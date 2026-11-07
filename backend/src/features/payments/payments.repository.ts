import { prisma } from '../../shared/database/prisma.service.js';
import { v4 as uuidv4 } from 'uuid';
import type {
  IPaymentsRepository,
  PaymentWithRelations,
  SettlePaymentParams,
  CashCounterPaymentData,
} from './payments.types.js';
import type { Payment, PaymentGateway, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../shared/errors/app-error.js';

export class PaymentsRepository implements IPaymentsRepository {
  private readonly paymentInclude = {
    invoice: true,
    payer: {
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    },
    collectedBy: {
      select: {
        id: true,
        fullName: true,
      },
    },
  } as const;

  public async createInitiatedPayment(data: {
    tenantId: string;
    invoiceId: string;
    payerId: string;
    paymentGateway: PaymentGateway;
    amount: number;
    transactionReference: string;
  }): Promise<Payment> {
    return prisma.payment.create({
      data: {
        tenantId: data.tenantId,
        invoiceId: data.invoiceId,
        payerId: data.payerId,
        paymentGateway: data.paymentGateway,
        amount: data.amount,
        transactionReference: data.transactionReference,
        status: 'INITIATED',
      },
    });
  }

  public async findPaymentByReference(
    tenantId: string,
    transactionReference: string
  ): Promise<PaymentWithRelations | null> {
    const payment = await prisma.payment.findFirst({
      where: { tenantId, transactionReference },
      include: this.paymentInclude,
    });
    return (payment as PaymentWithRelations) ?? null;
  }

  public async findPaymentById(
    tenantId: string,
    paymentId: string
  ): Promise<PaymentWithRelations | null> {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: this.paymentInclude,
    });
    return (payment as PaymentWithRelations) ?? null;
  }

  public async updateGatewayRefId(
    tenantId: string,
    paymentId: string,
    gatewayRefId: string
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { id: paymentId, tenantId },
      data: { gatewayRefId },
    });
  }

  /**
   * Atomic Payment Settlement (Defensive Financial Integrity)
   * Executes within an interactive transaction to prevent race conditions & duplicate crediting.
   */
  public async settlePaymentAtomic(params: SettlePaymentParams): Promise<{
    payment: PaymentWithRelations;
    alreadySettled: boolean;
  }> {
    return prisma.$transaction(
      async (tx) => {
        const orConditions: Prisma.PaymentWhereInput[] = [];
        if (params.transactionReference) {
          orConditions.push({ transactionReference: params.transactionReference });
        }
        if (params.gatewayRefId) {
          orConditions.push({ gatewayRefId: params.gatewayRefId });
        }
        const rawPidx = (params.rawResponse as Record<string, unknown>)?.pidx;
        if (typeof rawPidx === 'string' && rawPidx) {
          orConditions.push({ gatewayRefId: rawPidx });
        }

        const existing = await tx.payment.findFirst({
          where: {
            tenantId: params.tenantId,
            ...(orConditions.length > 0
              ? { OR: orConditions }
              : { transactionReference: params.transactionReference }),
          },
          include: this.paymentInclude,
        });

        if (!existing) {
          throw new NotFoundError(
            'Payment transaction not found for reference',
            params.transactionReference || params.gatewayRefId
          );
        }

        // Idempotency check: If already SUCCESS, return existing record without mutating state
        if (existing.status === 'SUCCESS') {
          return {
            payment: existing as PaymentWithRelations,
            alreadySettled: true,
          };
        }

        const now = new Date();
        const seq = await this.getNextReceiptSequence(
          params.tenantId,
          now.getFullYear(),
          now.getMonth() + 1,
          tx
        );
        const receiptNumber = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(seq).padStart(5, '0')}`;

        // 1. Mark payment as SUCCESS
        const updatedPayment = await tx.payment.update({
          where: { id: existing.id, tenantId: params.tenantId },
          data: {
            status: 'SUCCESS',
            gatewayRefId: params.gatewayRefId,
            gatewayResponse: params.rawResponse as Prisma.InputJsonValue,
            receiptNumber,
            paidAt: now,
          },
          include: this.paymentInclude,
        });

        // 2. Mark invoice as PAID
        await tx.invoice.update({
          where: { id: existing.invoiceId, tenantId: params.tenantId },
          data: {
            status: 'PAID',
            paidAt: now,
          },
        });

        return {
          payment: updatedPayment as PaymentWithRelations,
          alreadySettled: false,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );
  }

  /**
   * Ward Cashier Over-the-Counter Settlement
   */
  public async recordCashPayment(data: CashCounterPaymentData): Promise<PaymentWithRelations> {
    return prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findFirst({
          where: { id: data.invoiceId, tenantId: data.tenantId },
        });

        if (!invoice) {
          throw new NotFoundError('Invoice', data.invoiceId);
        }

        if (invoice.status === 'PAID') {
          throw new ConflictError('Invoice is already settled and marked PAID');
        }

        const now = new Date();
        const seq = await this.getNextReceiptSequence(
          data.tenantId,
          now.getFullYear(),
          now.getMonth() + 1,
          tx
        );
        const receiptNumber = `REC-CASH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(seq).padStart(5, '0')}`;
        const transactionReference = uuidv4();

        const payment = await tx.payment.create({
          data: {
            tenantId: data.tenantId,
            invoiceId: data.invoiceId,
            payerId: data.payerId,
            collectedByUserId: data.cashierUserId,
            paymentGateway: 'CASH_COUNTER',
            amount: data.receivedAmount,
            currency: 'NPR',
            transactionReference,
            status: 'SUCCESS',
            receiptNumber,
            paidAt: now,
          },
          include: this.paymentInclude,
        });

        await tx.invoice.update({
          where: { id: data.invoiceId, tenantId: data.tenantId },
          data: {
            status: 'PAID',
            paidAt: now,
          },
        });

        return payment as PaymentWithRelations;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );
  }

  public async getNextReceiptSequence(
    tenantId: string,
    year: number,
    month: number,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = tx ?? prisma;
    const count = await client.payment.count({
      where: {
        tenantId,
        status: 'SUCCESS',
      },
    });
    return count + 1;
  }
}


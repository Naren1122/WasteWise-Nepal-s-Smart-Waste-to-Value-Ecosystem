import { v4 as uuidv4 } from 'uuid';
import { PaymentsRepository } from './payments.repository.js';
import { BillingRepository } from '../billing/billing.repository.js';
import { PaymentProviderFactory } from './payments.factory.js';
import type {
  IPaymentsRepository,
  PaymentInitiationResult,
  PaymentReceiptDto,
  PaymentWithRelations,
} from './payments.types.js';
import type { IBillingRepository } from '../billing/billing.types.js';
import type { UserContext } from '../../shared/types/user-context.types.js';
import { PaymentGateway, Role } from '@prisma/client';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../shared/errors/app-error.js';
import { roundNpr } from '../../shared/utils/currency.util.js';

export class PaymentsService {
  constructor(
    private readonly repo: IPaymentsRepository = new PaymentsRepository(),
    private readonly billingRepo: IBillingRepository = new BillingRepository()
  ) {}

  public async findPaymentByReferenceGlobal(reference: string) {
    return this.repo.findPaymentByReferenceGlobal(reference);
  }

  public async initiatePayment(
    tenantId: string,
    payer: UserContext,
    invoiceId: string,
    gateway: PaymentGateway
  ): Promise<PaymentInitiationResult> {
    const invoice = await this.billingRepo.findInvoiceById(tenantId, invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }

    if (invoice.status === 'PAID') {
      throw new ConflictError('Invoice is already settled and marked PAID');
    }

    // Role-Scoped Authorization: Citizens can only initiate payment for their own invoices
    if (payer.role === Role.CITIZEN && invoice.citizenId !== payer.id) {
      throw new ForbiddenError('Access denied: You do not have permission to pay this invoice');
    }

    const transactionReference = uuidv4();
    const amount = roundNpr(Number(invoice.totalAmount));

    // 1. Record pending payment transaction in immutable ledger
    const payment = await this.repo.createInitiatedPayment({
      tenantId,
      invoiceId: invoice.id,
      payerId: payer.id,
      paymentGateway: gateway,
      amount,
      transactionReference,
    });

    // 2. Delegate to Gateway Provider strategy (DRY)
    const provider = PaymentProviderFactory.get(gateway);
    const result = await provider.initiatePayment({
      tenantId,
      invoice,
      payer,
      transactionReference,
    });

    if (result.gatewayRefId) {
      await this.repo.updateGatewayRefId(tenantId, payment.id, result.gatewayRefId);
    }

    return result;
  }

  public async verifyAndSettle(
    tenantId: string,
    gateway: PaymentGateway,
    payload: unknown
  ): Promise<{ payment: PaymentReceiptDto; isDuplicateCallback: boolean }> {
    const provider = PaymentProviderFactory.get(gateway);
    const verification = await provider.verifyPayment({ tenantId, payload });

    if (!verification.isVerified) {
      throw new BadRequestError(
        verification.errorMessage || 'Payment gateway verification rejected'
      );
    }

    // Atomic settlement inside interactive transaction (Idempotent)
    const { payment, alreadySettled } = await this.repo.settlePaymentAtomic({
      tenantId,
      transactionReference: verification.transactionReference,
      gatewayRefId: verification.gatewayRefId,
      paidAmount: verification.paidAmount,
      rawResponse: verification.rawResponse,
    });

    return {
      payment: this.toReceiptDto(payment),
      isDuplicateCallback: alreadySettled,
    };
  }

  public async recordCashCounterPayment(
    tenantId: string,
    cashier: UserContext,
    invoiceId: string,
    receivedAmount: number,
    payerId?: string
  ): Promise<PaymentReceiptDto> {
    const invoice = await this.billingRepo.findInvoiceById(tenantId, invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }

    const resolvedPayerId = payerId || invoice.citizenId;

    const payment = await this.repo.recordCashPayment({
      tenantId,
      invoiceId,
      payerId: resolvedPayerId,
      cashierUserId: cashier.id,
      receivedAmount: roundNpr(receivedAmount),
    });

    return this.toReceiptDto(payment);
  }

  public async getPaymentReceipt(
    tenantId: string,
    paymentId: string,
    userContext?: { id: string; role: Role }
  ): Promise<PaymentReceiptDto> {
    const payment = await this.repo.findPaymentById(tenantId, paymentId);
    if (!payment) {
      throw new NotFoundError('Payment receipt', paymentId);
    }

    if (userContext && userContext.role === Role.CITIZEN && payment.payerId !== userContext.id) {
      throw new ForbiddenError('Access denied: You do not own this payment receipt');
    }

    return this.toReceiptDto(payment);
  }

  private toReceiptDto = (payment: PaymentWithRelations): PaymentReceiptDto => ({
    receiptNumber: payment.receiptNumber || 'N/A',
    paymentId: payment.id,
    invoiceId: payment.invoiceId,
    invoiceNumber: payment.invoice.invoiceNumber,
    gateway: payment.paymentGateway,
    amount: Number(payment.amount),
    currency: payment.currency,
    payerName: payment.payer.fullName,
    payerPhone: payment.payer.phone,
    collectedByName: payment.collectedBy?.fullName ?? null,
    paidAt: (payment.paidAt || payment.createdAt).toISOString(),
  });
}


import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service.js';
import {
  InitiatePaymentSchema,
  EsewaCallbackSchema,
  KhaltiCallbackSchema,
  CashPaymentSchema,
  PaymentIdParamSchema,
} from './payments.schema.js';
import { sendSuccess } from '../../shared/utils/response.util.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';
import { PaymentGateway } from '@prisma/client';

export class PaymentsController {
  constructor(private readonly service: PaymentsService = new PaymentsService()) {}

  public initiatePayment = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new UnauthorizedError('Tenant context required');
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const { invoiceId, gateway } = InitiatePaymentSchema.parse(req.body);
    const result = await this.service.initiatePayment(
      req.tenant.id,
      req.user,
      invoiceId,
      gateway
    );

    sendSuccess(res, result, {
      status: 201,
      message: 'Payment session initiated successfully',
      tenantId: req.tenant.id,
    });
  };

  public verifyEsewaPayment = async (req: Request, res: Response): Promise<void> => {
    const body = EsewaCallbackSchema.parse(req.body);
    let tenantId = req.tenant?.id;

    if (!tenantId && body.data) {
      try {
        const decodedJson = Buffer.from(body.data, 'base64').toString('utf-8');
        const decoded = JSON.parse(decodedJson) as { transaction_uuid?: string };
        if (decoded.transaction_uuid) {
          const payment = await this.service.findPaymentByReferenceGlobal(decoded.transaction_uuid);
          tenantId = payment?.tenantId;
        }
      } catch {
        // Fallback to error check
      }
    }

    if (!tenantId) throw new UnauthorizedError('Tenant context required');

    const result = await this.service.verifyAndSettle(
      tenantId,
      PaymentGateway.ESEWA,
      body
    );

    sendSuccess(
      res,
      {
        isVerified: true,
        transactionReference: result.payment.receiptNumber || result.payment.invoiceNumber,
        paidAmount: result.payment.amount,
        ...result.payment,
      },
      {
        message: result.isDuplicateCallback
          ? 'Payment previously verified and settled (duplicate callback acknowledged)'
          : 'eSewa payment successfully verified and invoice settled',
        tenantId,
      }
    );
  };

  public verifyKhaltiPayment = async (req: Request, res: Response): Promise<void> => {
    const body = KhaltiCallbackSchema.parse(req.body);
    let tenantId = req.tenant?.id;

    if (!tenantId) {
      const ref = body.purchase_order_id || body.transactionReference || body.pidx;
      if (ref) {
        const payment = await this.service.findPaymentByReferenceGlobal(ref);
        tenantId = payment?.tenantId;
      }
    }

    if (!tenantId) throw new UnauthorizedError('Tenant context required');

    const result = await this.service.verifyAndSettle(
      tenantId,
      PaymentGateway.KHALTI,
      body
    );

    sendSuccess(
      res,
      {
        isVerified: true,
        transactionReference: result.payment.receiptNumber || result.payment.invoiceNumber,
        paidAmount: result.payment.amount,
        ...result.payment,
      },
      {
        message: result.isDuplicateCallback
          ? 'Payment previously verified and settled (duplicate callback acknowledged)'
          : 'Khalti payment successfully verified and invoice settled',
        tenantId,
      }
    );
  };

  public recordCashCounterPayment = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new UnauthorizedError('Tenant context required');
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const body = CashPaymentSchema.parse(req.body);
    const receipt = await this.service.recordCashCounterPayment(
      req.tenant.id,
      req.user,
      body.invoiceId,
      body.receivedAmount,
      body.payerId
    );

    sendSuccess(res, receipt, {
      status: 201,
      message: 'Over-the-counter cash payment settled and receipt generated',
      tenantId: req.tenant.id,
    });
  };

  public getReceipt = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new UnauthorizedError('Tenant context required');

    const { paymentId } = PaymentIdParamSchema.parse(req.params);
    const receipt = await this.service.getPaymentReceipt(
      req.tenant.id,
      paymentId,
      req.user
    );

    sendSuccess(res, receipt, {
      message: 'Payment receipt retrieved successfully',
      tenantId: req.tenant.id,
    });
  };
}


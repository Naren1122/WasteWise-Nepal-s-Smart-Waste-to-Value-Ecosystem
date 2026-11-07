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
    if (!req.tenant) throw new UnauthorizedError('Tenant context required');

    const body = EsewaCallbackSchema.parse(req.body);
    const result = await this.service.verifyAndSettle(
      req.tenant.id,
      PaymentGateway.ESEWA,
      body
    );

    sendSuccess(res, result.payment, {
      message: result.isDuplicateCallback
        ? 'Payment previously verified and settled (duplicate callback acknowledged)'
        : 'eSewa payment successfully verified and invoice settled',
      tenantId: req.tenant.id,
    });
  };

  public verifyKhaltiPayment = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new UnauthorizedError('Tenant context required');

    const body = KhaltiCallbackSchema.parse(req.body);
    const result = await this.service.verifyAndSettle(
      req.tenant.id,
      PaymentGateway.KHALTI,
      body
    );

    sendSuccess(res, result.payment, {
      message: result.isDuplicateCallback
        ? 'Payment previously verified and settled (duplicate callback acknowledged)'
        : 'Khalti payment successfully verified and invoice settled',
      tenantId: req.tenant.id,
    });
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


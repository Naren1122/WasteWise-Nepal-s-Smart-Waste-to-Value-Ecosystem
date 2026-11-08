import { Router } from 'express';
import { PaymentsController } from './payments.controller.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { Role } from '@prisma/client';

export const paymentsRouter = Router();
const controller = new PaymentsController();

// Tenant context middleware populates req.tenant when passed via header/subdomain
paymentsRouter.use(tenantContextMiddleware);

// Initiate payment (eSewa form post payload or Khalti checkout session)
paymentsRouter.post(
  '/initiate',
  requireTenant,
  authGuard,
  asyncHandler(controller.initiatePayment)
);

// eSewa server/client return callback verification (resolves tenant via header or transactionRef)
paymentsRouter.post(
  '/esewa/verify',
  asyncHandler(controller.verifyEsewaPayment)
);

// Khalti server/client return callback verification (resolves tenant via header or transactionRef)
paymentsRouter.post(
  '/khalti/verify',
  asyncHandler(controller.verifyKhaltiPayment)
);

// Ward office cash counter voucher settlement
paymentsRouter.post(
  '/cash-counter',
  requireTenant,
  authGuard,
  requireRole([Role.SUPER_ADMIN, Role.MUNICIPAL_ADMIN, Role.DISPATCHER, Role.WARD_OFFICER]),
  asyncHandler(controller.recordCashCounterPayment)
);

// View / download payment receipt
paymentsRouter.get(
  '/receipt/:paymentId',
  requireTenant,
  authGuard,
  asyncHandler(controller.getReceipt)
);

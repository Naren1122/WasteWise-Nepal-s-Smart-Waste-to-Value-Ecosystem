import { Router } from 'express';
import { PaymentsController } from './payments.controller.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { Role } from '@prisma/client';

export const paymentsRouter = Router();
const controller = new PaymentsController();

// All payments require tenant context
paymentsRouter.use(tenantContextMiddleware);
paymentsRouter.use(requireTenant);

// Initiate payment (eSewa form post payload or Khalti checkout session)
paymentsRouter.post(
  '/initiate',
  authGuard,
  asyncHandler(controller.initiatePayment)
);

// eSewa server/client return callback verification
paymentsRouter.post(
  '/esewa/verify',
  asyncHandler(controller.verifyEsewaPayment)
);

// Khalti server/client return callback verification
paymentsRouter.post(
  '/khalti/verify',
  asyncHandler(controller.verifyKhaltiPayment)
);

// Ward office cash counter voucher settlement
paymentsRouter.post(
  '/cash-counter',
  authGuard,
  requireRole([Role.SUPER_ADMIN, Role.MUNICIPAL_ADMIN, Role.DISPATCHER, Role.WARD_OFFICER]),
  asyncHandler(controller.recordCashCounterPayment)
);

// View / download payment receipt
paymentsRouter.get(
  '/receipt/:paymentId',
  authGuard,
  asyncHandler(controller.getReceipt)
);

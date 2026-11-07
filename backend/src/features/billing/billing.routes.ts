import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { Role } from '@prisma/client';

export const billingRouter = Router();
const controller = new BillingController();

// All billing endpoints require tenant context
billingRouter.use(tenantContextMiddleware);
billingRouter.use(requireTenant);

// Citizen / personal self-service billing route
billingRouter.get(
  '/my',
  authGuard,
  requireRole([
    Role.CITIZEN,
    Role.MUNICIPAL_ADMIN,
    Role.SUPER_ADMIN,
    Role.WARD_OFFICER,
    Role.DISPATCHER,
  ]),
  asyncHandler(controller.getMyInvoices)
);

// Municipal administrative invoice ledger
billingRouter.get(
  '/',
  authGuard,
  requireRole([Role.SUPER_ADMIN, Role.MUNICIPAL_ADMIN, Role.DISPATCHER, Role.WARD_OFFICER]),
  asyncHandler(controller.getInvoices)
);

// View single invoice details (citizen owner or staff)
billingRouter.get(
  '/:invoiceId',
  authGuard,
  asyncHandler(controller.getInvoiceById)
);

// Trigger batch recurring invoice generation
billingRouter.post(
  '/generate-monthly',
  authGuard,
  requireRole([Role.SUPER_ADMIN, Role.MUNICIPAL_ADMIN]),
  asyncHandler(controller.generateMonthlyInvoices)
);

// Create manual/custom invoice (e.g. ad-hoc commercial or fine)
billingRouter.post(
  '/custom',
  authGuard,
  requireRole([Role.SUPER_ADMIN, Role.MUNICIPAL_ADMIN]),
  asyncHandler(controller.createCustomInvoice)
);

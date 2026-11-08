import { Router } from 'express';
import { Role } from '@prisma/client';
import { complaintsController } from './complaints.controller.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';

export const complaintsRouter = Router();

// Tenant boundary isolation
complaintsRouter.use(tenantContextMiddleware);
complaintsRouter.use(requireTenant);
complaintsRouter.use(authGuard);

// Lodge a complaint (Citizen self-service or staff on behalf of citizen)
complaintsRouter.post(
  '/',
  requireRole([Role.CITIZEN, Role.WARD_OFFICER, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(complaintsController.lodgeComplaint)
);

// List complaints (scoped by role inside service)
complaintsRouter.get(
  '/',
  requireRole([
    Role.CITIZEN,
    Role.WARD_OFFICER,
    Role.DISPATCHER,
    Role.MUNICIPAL_ADMIN,
    Role.SUPER_ADMIN,
    Role.DRIVER,
    Role.FIELD_WORKER,
  ]),
  asyncHandler(complaintsController.listComplaints)
);

// Query complaint by unique ticket number (e.g. WW-GRV-2611-1234)
complaintsRouter.get(
  '/ticket/:ticketNumber',
  asyncHandler(complaintsController.getComplaintByTicket)
);

// Query complaint by UUID
complaintsRouter.get(
  '/:id',
  asyncHandler(complaintsController.getComplaintById)
);

// Triage complaint (Status transition, staff assignment, priority adjustment, or rejection)
complaintsRouter.patch(
  '/:id/triage',
  requireRole([Role.WARD_OFFICER, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(complaintsController.triageComplaint)
);

// Mark complaint as resolved with field photo proof
complaintsRouter.patch(
  '/:id/resolve',
  requireRole([
    Role.FIELD_WORKER,
    Role.DRIVER,
    Role.WARD_OFFICER,
    Role.MUNICIPAL_ADMIN,
    Role.SUPER_ADMIN,
  ]),
  asyncHandler(complaintsController.resolveComplaint)
);

// Reopen a resolved complaint within the 48-hour grace window
complaintsRouter.post(
  '/:id/reopen',
  requireRole([Role.CITIZEN, Role.WARD_OFFICER, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(complaintsController.reopenComplaint)
);

// Submit post-resolution citizen satisfaction rating and comments
complaintsRouter.post(
  '/:id/feedback',
  requireRole([Role.CITIZEN]),
  asyncHandler(complaintsController.submitFeedback)
);


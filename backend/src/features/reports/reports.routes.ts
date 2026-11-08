import { Router } from 'express';
import { Role } from '@prisma/client';
import { reportsController } from './reports.controller.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';

export const reportsRouter = Router();

// Enforce strict multi-tenant boundary and authentication
reportsRouter.use(tenantContextMiddleware);
reportsRouter.use(requireTenant);
reportsRouter.use(authGuard);

// Export Daily Collection & Stops Report (CSV)
reportsRouter.get(
  '/export/collections',
  requireRole([Role.MUNICIPAL_ADMIN, Role.WARD_OFFICER, Role.DISPATCHER, Role.SUPER_ADMIN]),
  asyncHandler(reportsController.exportCollections)
);

// Export Financial Reconciliation & Digital Payment Audit Ledger (CSV)
reportsRouter.get(
  '/export/financial-reconciliation',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(reportsController.exportFinancialReconciliation)
);

// Export Citizen Grievance & SLA Performance Audit (CSV)
reportsRouter.get(
  '/export/complaints-sla',
  requireRole([Role.MUNICIPAL_ADMIN, Role.WARD_OFFICER, Role.SUPER_ADMIN]),
  asyncHandler(reportsController.exportComplaintsSla)
);

// Export Ward Performance Summary (CSV)
reportsRouter.get(
  '/export/ward-summary',
  requireRole([Role.MUNICIPAL_ADMIN, Role.WARD_OFFICER, Role.SUPER_ADMIN]),
  asyncHandler(reportsController.exportWardSummary)
);


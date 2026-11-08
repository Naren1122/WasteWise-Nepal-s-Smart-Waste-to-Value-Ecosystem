import { Router } from 'express';
import { Role } from '@prisma/client';
import { auditController } from './audit.controller.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';

export const auditRouter = Router();

// Enforce strict multi-tenant context and authentication
auditRouter.use(tenantContextMiddleware);
auditRouter.use(requireTenant);
auditRouter.use(authGuard);

// Restricted strictly to Municipal Admins and Super Admins
auditRouter.use(requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]));

// Query paginated audit log events with composite filters
auditRouter.get(
  '/',
  asyncHandler(auditController.listAuditLogs)
);

// Inspect detailed audit record including delta diffs
auditRouter.get(
  '/:id',
  asyncHandler(auditController.getAuditLogById)
);


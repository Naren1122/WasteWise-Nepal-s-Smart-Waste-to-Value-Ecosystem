import { Router } from 'express';
import { Role } from '@prisma/client';
import { analyticsController } from './analytics.controller.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';

export const analyticsRouter = Router();

// Enforce strict multi-tenant context and authentication
analyticsRouter.use(tenantContextMiddleware);
analyticsRouter.use(requireTenant);
analyticsRouter.use(authGuard);

// Executive Overview
analyticsRouter.get(
  '/overview',
  requireRole([Role.MUNICIPAL_ADMIN, Role.WARD_OFFICER, Role.SUPER_ADMIN]),
  asyncHandler(analyticsController.getOverview)
);

// Collection & Route Outcomes
analyticsRouter.get(
  '/collections',
  requireRole([Role.MUNICIPAL_ADMIN, Role.WARD_OFFICER, Role.DISPATCHER, Role.SUPER_ADMIN]),
  asyncHandler(analyticsController.getCollections)
);

// Financial Metrics & Payment Gateways
analyticsRouter.get(
  '/financials',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(analyticsController.getFinancials)
);

// Citizen Complaints & SLA Redressal
analyticsRouter.get(
  '/complaints',
  requireRole([Role.MUNICIPAL_ADMIN, Role.WARD_OFFICER, Role.SUPER_ADMIN]),
  asyncHandler(analyticsController.getComplaints)
);

// Ward Comparative Scorecards & Rankings
analyticsRouter.get(
  '/wards',
  requireRole([Role.MUNICIPAL_ADMIN, Role.WARD_OFFICER, Role.SUPER_ADMIN]),
  asyncHandler(analyticsController.getWardPerformance)
);

// Single Ward Scorecard by ID
analyticsRouter.get(
  '/wards/:wardId',
  requireRole([Role.MUNICIPAL_ADMIN, Role.WARD_OFFICER, Role.SUPER_ADMIN]),
  asyncHandler(analyticsController.getSingleWardCard)
);


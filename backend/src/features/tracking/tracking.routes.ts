import { Router } from 'express';
import { TrackingController } from './tracking.controller.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import {
  tenantContextMiddleware,
  requireTenant,
} from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new TrackingController();

// 1. Ingest GPS telemetry (REST fallback for driver app or background worker) - Restricted to Role.DRIVER (Item 7)
router.post(
  '/tracking/telemetry',
  tenantContextMiddleware,
  requireTenant,
  authGuard,
  requireRole([Role.DRIVER]),
  asyncHandler(controller.ingestLocation)
);

// 2. Fetch live fleet positions for central municipal operations map
router.get(
  '/tracking/fleet',
  tenantContextMiddleware,
  requireTenant,
  authGuard,
  requireRole([
    Role.MUNICIPAL_ADMIN,
    Role.DISPATCHER,
    Role.WARD_OFFICER,
    Role.SUPER_ADMIN,
    Role.CITIZEN,
    Role.DRIVER,
  ]),
  asyncHandler(controller.getActiveFleetPositions)
);

// 3. Fetch historical GPS route breadcrumbs
router.get(
  '/tracking/routes/:routeId/breadcrumbs',
  tenantContextMiddleware,
  requireTenant,
  authGuard,
  requireRole([
    Role.MUNICIPAL_ADMIN,
    Role.DISPATCHER,
    Role.WARD_OFFICER,
    Role.CITIZEN,
    Role.SUPER_ADMIN,
  ]),
  asyncHandler(controller.getRouteBreadcrumbs)
);

export const trackingRoutes = router;

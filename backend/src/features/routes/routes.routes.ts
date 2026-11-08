import { Router } from 'express';
import { RoutesController } from './routes.controller.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import {
  tenantContextMiddleware,
  requireTenant,
} from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new RoutesController();

router.use(tenantContextMiddleware);
router.use(requireTenant);
router.use(authGuard);

// 1. Generate Daily Route Manifest (Office Dispatcher / Admin)
router.post(
  '/routes/generate',
  requireRole([Role.MUNICIPAL_ADMIN, Role.DISPATCHER, Role.SUPER_ADMIN]),
  asyncHandler(controller.generateRoute)
);

// 2. Active Route lookup for mobile Driver PWA
router.get(
  '/routes/driver/active',
  requireRole([
    Role.DRIVER,
    Role.FIELD_WORKER,
    Role.MUNICIPAL_ADMIN,
    Role.DISPATCHER,
    Role.SUPER_ADMIN,
  ]),
  asyncHandler(controller.getActiveDriverRoute)
);

// 3. Batch Offline Sync (Mobile field workers returning to online coverage)
router.post(
  '/routes/sync',
  requireRole([
    Role.DRIVER,
    Role.FIELD_WORKER,
    Role.MUNICIPAL_ADMIN,
    Role.DISPATCHER,
    Role.SUPER_ADMIN,
  ]),
  asyncHandler(controller.batchSyncOfflineStops)
);

// 4. Update individual stop outcome (Collected / Missed / Rejected)
router.patch(
  '/routes/stops/:id',
  requireRole([
    Role.DRIVER,
    Role.FIELD_WORKER,
    Role.MUNICIPAL_ADMIN,
    Role.DISPATCHER,
    Role.SUPER_ADMIN,
  ]),
  asyncHandler(controller.updateStopStatus)
);

// 5. Route queries and status transitions
router.get(
  '/routes',
  requireRole([
    Role.MUNICIPAL_ADMIN,
    Role.DISPATCHER,
    Role.SUPER_ADMIN,
    Role.WARD_OFFICER,
    Role.DRIVER,
    Role.CITIZEN,
  ]),
  asyncHandler(controller.listRoutes)
);

router.get(
  '/routes/:id',
  requireRole([
    Role.MUNICIPAL_ADMIN,
    Role.DISPATCHER,
    Role.SUPER_ADMIN,
    Role.WARD_OFFICER,
    Role.DRIVER,
    Role.CITIZEN,
  ]),
  asyncHandler(controller.getRouteById)
);

router.patch(
  '/routes/:id',
  requireRole([
    Role.MUNICIPAL_ADMIN,
    Role.DISPATCHER,
    Role.SUPER_ADMIN,
    Role.DRIVER,
  ]),
  asyncHandler(controller.updateRouteStatus)
);

export { router as routesRoutes };


import { Router } from 'express';
import { FleetController } from './fleet.controller.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import {
  tenantContextMiddleware,
  requireTenant,
} from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new FleetController();

router.use(tenantContextMiddleware);
router.use(requireTenant);
router.use(authGuard);

// 1. Driver roster for vehicle assignment
router.get(
  '/fleet/drivers',
  requireRole([Role.MUNICIPAL_ADMIN, Role.DISPATCHER, Role.SUPER_ADMIN]),
  asyncHandler(controller.listEligibleDrivers)
);

// 2. Fleet Vehicles CRUD
router.post(
  '/fleet',
  requireRole([Role.MUNICIPAL_ADMIN, Role.DISPATCHER, Role.SUPER_ADMIN]),
  asyncHandler(controller.createVehicle)
);

router.get(
  '/fleet',
  requireRole([
    Role.MUNICIPAL_ADMIN,
    Role.DISPATCHER,
    Role.SUPER_ADMIN,
    Role.WARD_OFFICER,
    Role.DRIVER,
  ]),
  asyncHandler(controller.listVehicles)
);

router.get(
  '/fleet/:id',
  requireRole([
    Role.MUNICIPAL_ADMIN,
    Role.DISPATCHER,
    Role.SUPER_ADMIN,
    Role.WARD_OFFICER,
    Role.DRIVER,
  ]),
  asyncHandler(controller.getVehicleById)
);

router.patch(
  '/fleet/:id',
  requireRole([Role.MUNICIPAL_ADMIN, Role.DISPATCHER, Role.SUPER_ADMIN]),
  asyncHandler(controller.updateVehicle)
);

router.delete(
  '/fleet/:id',
  requireRole([Role.MUNICIPAL_ADMIN, Role.DISPATCHER, Role.SUPER_ADMIN]),
  asyncHandler(controller.deleteVehicle)
);

export { router as fleetRoutes };


import { Router } from 'express';
import { PropertyController } from './properties.controller.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new PropertyController();

// All property routes require an active tenant context and an authenticated session
router.use(tenantContextMiddleware);
router.use(requireTenant);
router.use(authGuard);

const ALL_ROLES = [
  Role.CITIZEN,
  Role.MUNICIPAL_ADMIN,
  Role.SUPER_ADMIN,
  Role.WARD_OFFICER,
  Role.DISPATCHER,
  Role.DRIVER,
  Role.FIELD_WORKER,
];

const PROPERTY_READ_ROLES = [
  Role.CITIZEN,
  Role.MUNICIPAL_ADMIN,
  Role.SUPER_ADMIN,
  Role.WARD_OFFICER,
  Role.DISPATCHER,
];

const PROPERTY_WRITE_ROLES = [
  Role.CITIZEN,
  Role.MUNICIPAL_ADMIN,
  Role.SUPER_ADMIN,
  Role.WARD_OFFICER,
];

// 1. Citizen Routes: Register a new property and view own registered properties
router.post(
  '/properties',
  requireRole([Role.CITIZEN, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.registerProperty)
);

router.get(
  '/properties/me',
  requireRole([Role.CITIZEN, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.getMyProperties)
);

// 2. Admin & Staff Route: List all properties with pagination & ward filters
router.get(
  '/properties',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER, Role.DISPATCHER]),
  asyncHandler(controller.listProperties)
);

// 3. Shared Route: View property by ID (Explicit Allow-list)
router.get(
  '/properties/:id',
  requireRole(PROPERTY_READ_ROLES),
  asyncHandler(controller.getPropertyById)
);

// 4. Update Property Details (Explicit Allow-list: Citizens, Admins, Ward Officers only; DRIVERS/FIELD_WORKERS blocked)
router.patch(
  '/properties/:id',
  requireRole(PROPERTY_WRITE_ROLES),
  asyncHandler(controller.updateProperty)
);

// 5. Staff/Admin Route: Verify/Activate property status
router.patch(
  '/properties/:id/status',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER]),
  asyncHandler(controller.updatePropertyStatus)
);

export const propertyRoutes = router;

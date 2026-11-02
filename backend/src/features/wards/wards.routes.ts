import { Router } from 'express';
import { WardController } from './wards.controller.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new WardController();

// All Ward & Zone routes require an active municipality tenant context
router.use(tenantContextMiddleware);
router.use(requireTenant);

// 1. Discovery Endpoints (Wards list and active zones for property registration)
router.get('/wards', asyncHandler(controller.getWards));
router.get('/wards/:id', asyncHandler(controller.getWardById));
router.get('/wards/:wardId/zones', asyncHandler(controller.getZonesByWard));

// 2. Municipal Admin only: Creating and managing Wards
router.post(
  '/wards',
  authGuard,
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.createWard)
);

router.patch(
  '/wards/:id',
  authGuard,
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.updateWard)
);

// 3. Natural REST Design: POST /wards/:wardId/zones for scoped creation
router.post(
  '/wards/:wardId/zones',
  authGuard,
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER]),
  asyncHandler(controller.createZone)
);

router.patch(
  '/zones/:id',
  authGuard,
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER]),
  asyncHandler(controller.updateZone)
);

export const wardRoutes = router;

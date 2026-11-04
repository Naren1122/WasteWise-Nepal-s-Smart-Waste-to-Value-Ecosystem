import { Router } from 'express';
import { PlansController } from './plans.controller.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new PlansController();

router.use(tenantContextMiddleware);
router.use(requireTenant);
router.use(authGuard);

// 1. Service Plans Catalog
router.post(
  '/plans',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.createPlan)
);

router.get(
  '/plans',
  asyncHandler(controller.listPlans)
);

router.get(
  '/plans/:id',
  asyncHandler(controller.getPlanById)
);

router.patch(
  '/plans/:id',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.updatePlan)
);

// 2. Subscriptions Management
router.post(
  '/subscriptions',
  requireRole([Role.CITIZEN, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.createSubscription)
);

router.get(
  '/properties/:id/subscriptions',
  requireRole([Role.CITIZEN, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER]),
  asyncHandler(controller.getPropertySubscriptions)
);

router.post(
  '/subscriptions/:id/cancel',
  requireRole([Role.CITIZEN, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.cancelSubscription)
);

export { router as plansRoutes };


import { Router } from 'express';
import { SchedulesController } from './schedules.controller.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new SchedulesController();

router.use(tenantContextMiddleware);
router.use(requireTenant);
router.use(authGuard);

// 1. Calendar View & Pickups Feed
router.get(
  '/schedules/calendar',
  asyncHandler(controller.getCalendarPickups)
);

// 2. Collection Rules Management
router.post(
  '/schedules',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER]),
  asyncHandler(controller.createSchedule)
);

router.get(
  '/wards/:id/schedules',
  asyncHandler(controller.getSchedulesByWard)
);

router.patch(
  '/schedules/:id',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER]),
  asyncHandler(controller.updateSchedule)
);

router.delete(
  '/schedules/:id',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER]),
  asyncHandler(controller.deleteSchedule)
);

// 3. Automated Daily Pickup Manifest Generation
router.post(
  '/schedules/generate',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.DISPATCHER]),
  asyncHandler(controller.generateDailyPickups)
);

export { router as scheduleRoutes };

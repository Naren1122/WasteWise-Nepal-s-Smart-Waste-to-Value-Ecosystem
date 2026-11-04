import { Router } from 'express';
import { BulkyWasteController } from './bulky-waste.controller.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new BulkyWasteController();

router.use(tenantContextMiddleware);
router.use(requireTenant);
router.use(authGuard);

// 1. Citizen submits bulky waste request
router.post(
  '/bulky-waste',
  requireRole([Role.CITIZEN, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.submitRequest)
);

// 2. List & Detail view
router.get(
  '/bulky-waste',
  asyncHandler(controller.listRequests)
);

router.get(
  '/bulky-waste/:id',
  asyncHandler(controller.getRequestById)
);

// 3. Officer provides price quotation
router.patch(
  '/bulky-waste/:id/quote',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER]),
  asyncHandler(controller.quoteRequest)
);

// 4. Citizen approves the quotation
router.post(
  '/bulky-waste/:id/approve',
  requireRole([Role.CITIZEN, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.approveQuotation)
);

// 5. Officer schedules the collection date
router.patch(
  '/bulky-waste/:id/schedule',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER, Role.DISPATCHER]),
  asyncHandler(controller.schedulePickup)
);

// 6. Officer rejects bulky request
router.post(
  '/bulky-waste/:id/reject',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER]),
  asyncHandler(controller.rejectRequest)
);

// 7. Driver or Officer marks bulky pickup completed
router.post(
  '/bulky-waste/:id/complete',
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER, Role.DRIVER, Role.DISPATCHER]),
  asyncHandler(controller.completeRequest)
);

// 8. Cancellation (Citizen or Officer)
router.post(
  '/bulky-waste/:id/cancel',
  requireRole([Role.CITIZEN, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER]),
  asyncHandler(controller.cancelRequest)
);

export const bulkyWasteRoutes = router;
export default router;

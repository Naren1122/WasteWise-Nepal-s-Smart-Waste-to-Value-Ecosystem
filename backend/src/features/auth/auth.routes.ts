import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { tenantContextMiddleware, requireTenant } from '../../shared/middleware/tenant-context.middleware.js';
import { authGuard } from '../../shared/middleware/auth-guard.middleware.js';
import { requireRole } from '../../shared/middleware/role-guard.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new AuthController();

// Public Tenant Onboarding (creates a new municipality tenant + initial admin)
router.post('/tenants/onboard', asyncHandler(controller.onboardTenant));

// Refresh Token (independent of tenant header, verified by token payload)
router.post('/auth/refresh', asyncHandler(controller.refreshTokens));

// Tenant-scoped authentication routes
router.post(
  '/auth/register',
  tenantContextMiddleware,
  requireTenant,
  asyncHandler(controller.register)
);

router.post(
  '/auth/login',
  tenantContextMiddleware,
  requireTenant,
  asyncHandler(controller.login)
);

// Authenticated current user profile
router.get(
  '/auth/me',
  tenantContextMiddleware,
  authGuard,
  asyncHandler(controller.getMe)
);

// Admin-only route: Create privileged municipal staff (Driver, Dispatcher, Ward Officer)
router.post(
  '/auth/staff',
  tenantContextMiddleware,
  requireTenant,
  authGuard,
  requireRole([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.createStaff)
);

export const authRoutes = router;


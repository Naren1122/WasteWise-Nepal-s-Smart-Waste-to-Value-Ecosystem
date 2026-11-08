import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './shared/config/env.js';
import { authRoutes } from './features/auth/auth.routes.js';
import { propertyRoutes } from './features/properties/properties.routes.js';
import { wardRoutes } from './features/wards/wards.routes.js';
import { plansRoutes } from './features/plans/plans.routes.js';
import { scheduleRoutes } from './features/schedules/schedules.routes.js';
import { bulkyWasteRoutes } from './features/bulky-waste/bulky-waste.routes.js';
import { fleetRoutes } from './features/fleet/fleet.routes.js';
import { routesRoutes } from './features/routes/routes.routes.js';
import { trackingRoutes } from './features/tracking/tracking.routes.js';
import { billingRouter } from './features/billing/billing.routes.js';
import { paymentsRouter } from './features/payments/payments.routes.js';
import { complaintsRouter } from './features/complaints/complaints.routes.js';
import { analyticsRouter } from './features/analytics/analytics.routes.js';
import { reportsRouter } from './features/reports/reports.routes.js';
import { auditRouter } from './features/audit/audit.routes.js';
import { healthRouter } from './features/health/health.routes.js';
import { errorHandlerMiddleware } from './shared/errors/error-handler.middleware.js';
import { NotFoundError } from './shared/errors/app-error.js';

export const createApp = (): Application => {
  const app = express();

  // Security & Ingress Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Tenant-Subdomain'],
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health & Readiness Probes
  app.use('/health', healthRouter);

  // REST API v1 Routes
  const apiRouter = express.Router();
  apiRouter.use(authRoutes);
  apiRouter.use(propertyRoutes);
  apiRouter.use(wardRoutes);
  apiRouter.use(plansRoutes);
  apiRouter.use(scheduleRoutes);
  apiRouter.use(bulkyWasteRoutes);
  apiRouter.use(fleetRoutes);
  apiRouter.use(routesRoutes);
  apiRouter.use(trackingRoutes);
  apiRouter.use('/invoices', billingRouter);
  apiRouter.use('/payments', paymentsRouter);
  apiRouter.use('/complaints', complaintsRouter);
  apiRouter.use('/analytics', analyticsRouter);
  apiRouter.use('/reports', reportsRouter);
  apiRouter.use('/audit-logs', auditRouter);

  app.use('/api/v1', apiRouter);

  // 404 Catch-all Route
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Endpoint ${req.method} ${req.originalUrl}`));
  });

  // Centralized Global Error Handler
  app.use(errorHandlerMiddleware);

  return app;
};

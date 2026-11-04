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
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'WasteWise API',
    });
  });

  // REST API v1 Routes
  const apiRouter = express.Router();
  apiRouter.use(authRoutes);
  apiRouter.use(propertyRoutes);
  apiRouter.use(wardRoutes);
  apiRouter.use(plansRoutes);
  apiRouter.use(scheduleRoutes);
  apiRouter.use(bulkyWasteRoutes);

  app.use('/api/v1', apiRouter);

  // 404 Catch-all Route
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Endpoint ${req.method} ${req.originalUrl}`));
  });

  // Centralized Global Error Handler
  app.use(errorHandlerMiddleware);

  return app;
};

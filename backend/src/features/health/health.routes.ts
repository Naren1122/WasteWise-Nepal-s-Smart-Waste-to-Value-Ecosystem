import { Router } from 'express';
import { healthController } from './health.controller.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';

export const healthRouter = Router();

// Public liveness probes (unauthenticated for cloud infrastructure)
healthRouter.get('/', healthController.getLive);
healthRouter.get('/live', healthController.getLive);

// Deep readiness probe verifying database, redis, and memory health
healthRouter.get('/ready', asyncHandler(healthController.getReady));


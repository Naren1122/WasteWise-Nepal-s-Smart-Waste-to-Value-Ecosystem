import type { Request, Response } from 'express';
import { healthService, HealthService } from './health.service.js';

export class HealthController {
  constructor(private readonly service: HealthService = healthService) {}

  public getLive = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(1)),
      service: 'WasteWise API',
    });
  };

  public getReady = async (_req: Request, res: Response): Promise<void> => {
    const readiness = await this.service.getReadiness();
    const httpStatus = readiness.status === 'UNHEALTHY' ? 503 : 200;

    res.status(httpStatus).json(readiness);
  };
}

export const healthController = new HealthController();


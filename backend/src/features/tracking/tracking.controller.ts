import type { Request, Response } from 'express';
import { TrackingService } from './tracking.service.js';
import { trackingGateway } from './tracking.gateway.js';
import {
  GpsLocationIngestSchema,
  RouteBreadcrumbsQuerySchema,
  RouteIdParamSchema,
} from './tracking.schema.js';
import { sendSuccess } from '../../shared/utils/response.util.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

export class TrackingController {
  constructor(private readonly service: TrackingService = new TrackingService()) {}

  /**
   * HTTP Fallback for GPS ingestion (e.g., when WebSocket is disconnected or background service syncs).
   */
  public ingestLocation = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to stream telemetry');
    }

    const validatedBody = GpsLocationIngestSchema.parse(req.body);
    const result = await this.service.ingestLocation(req.user.tenantId, req.user.id, validatedBody);

    // Broadcast update via WebSocket gateway to live operations room
    if (result.telemetry.routeId) {
      trackingGateway.broadcastToRoute(result.telemetry.routeId, result.telemetry);
    }

    sendSuccess(res, result.telemetry, {
      status: 201,
      message: 'Telemetry recorded successfully',
      tenantId: req.user.tenantId,
    });
  };

  /**
   * Retrieves current coordinates and operational state of all vehicles in the tenant.
   */
  public getActiveFleetPositions = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) {
      throw new UnauthorizedError('Tenant context required');
    }

    const positions = await this.service.getActiveFleetPositions(req.tenant.id);
    sendSuccess(res, positions, {
      message: 'Live fleet positions retrieved successfully',
      tenantId: req.tenant.id,
    });
  };

  /**
   * Retrieves historical GPS breadcrumb coordinates for an active or completed route.
   */
  public getRouteBreadcrumbs = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) {
      throw new UnauthorizedError('Tenant context required');
    }

    const { routeId } = RouteIdParamSchema.parse(req.params);
    const { limit } = RouteBreadcrumbsQuerySchema.parse(req.query);

    const breadcrumbs = await this.service.getRouteBreadcrumbs(req.tenant.id, routeId, limit);
    sendSuccess(res, breadcrumbs, {
      message: 'Route breadcrumbs retrieved successfully',
      tenantId: req.tenant.id,
    });
  };
}

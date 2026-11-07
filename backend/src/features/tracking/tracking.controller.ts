import type { Request, Response } from 'express';
import { TrackingService } from './tracking.service.js';
import { trackingGateway } from './tracking.gateway.js';
import { TrackingRepository } from './tracking.repository.js';
import {
  GpsLocationIngestSchema,
  RouteBreadcrumbsQuerySchema,
  RouteIdParamSchema,
} from './tracking.schema.js';
import { sendSuccess } from '../../shared/utils/response.util.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

export class TrackingController {
  constructor(
    private readonly service: TrackingService = new TrackingService(
      new TrackingRepository(),
      trackingGateway
    )
  ) {}

  /**
   * HTTP Fallback for GPS ingestion (e.g., when WebSocket is disconnected or background service syncs).
   */
  public ingestLocation = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) {
      throw new UnauthorizedError('Tenant context required');
    }
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to stream telemetry');
    }

    const validatedBody = GpsLocationIngestSchema.parse(req.body);
    const result = await this.service.ingestLocation(req.tenant.id, req.user.id, validatedBody);

    sendSuccess(
      res,
      { telemetry: result.telemetry, recorded: !result.isThrottled },
      {
        status: result.isThrottled ? 200 : 201,
        message: result.isThrottled
          ? 'Telemetry throttled (skipped persistence)'
          : 'Telemetry recorded successfully',
        tenantId: req.tenant.id,
      }
    );
  };

  /**
   * Retrieves current coordinates and operational state of all vehicles in the tenant.
   * NOTE: WARD_OFFICER has tenant-wide fleet overview intentionally to maintain
   * municipal-wide situational awareness across ward perimeters.
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
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { routeId } = RouteIdParamSchema.parse(req.params);
    const { limit } = RouteBreadcrumbsQuerySchema.parse(req.query);

    const breadcrumbs = await this.service.getRouteBreadcrumbs({
      tenantId: req.tenant.id,
      routeId,
      userId: req.user.id,
      role: req.user.role,
      wardId: req.user.wardId,
      limit,
    });

    sendSuccess(res, breadcrumbs, {
      message: 'Route breadcrumbs retrieved successfully',
      tenantId: req.tenant.id,
    });
  };
}

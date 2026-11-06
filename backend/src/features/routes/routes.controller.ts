import { Request, Response } from 'express';
import { RoutesService } from './routes.service.js';
import {
  GenerateDailyRouteSchema,
  UpdateRouteStatusSchema,
  UpdateStopStatusSchema,
  BatchOfflineSyncSchema,
  RouteFilterSchema,
} from './routes.schema.js';
import { BadRequestError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { IdParamSchema } from '../../shared/utils/param-validator.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.util.js';

export class RoutesController {
  constructor(private readonly service: RoutesService = new RoutesService()) {}

  public generateRoute = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const input = GenerateDailyRouteSchema.parse(req.body);
    const route = await this.service.generateDailyRoute(req.tenant.id, input);
    sendSuccess(res, route, {
      status: 201,
      message: 'Daily collection route generated successfully',
      tenantId: req.tenant.id,
    });
  };

  public getRouteById = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    const route = await this.service.getRouteById(req.tenant.id, id);
    sendSuccess(res, route, { tenantId: req.tenant.id });
  };

  public listRoutes = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const filters = RouteFilterSchema.parse(req.query);
    const result = await this.service.getRoutes(req.tenant.id, {
      ...(filters.wardId !== undefined && { wardId: filters.wardId }),
      ...(filters.vehicleId !== undefined && { vehicleId: filters.vehicleId }),
      ...(filters.driverId !== undefined && { driverId: filters.driverId }),
      ...(filters.status !== undefined && { status: filters.status }),
      ...(filters.routeDate !== undefined && { routeDate: filters.routeDate }),
      page: filters.page,
      pageSize: filters.pageSize,
    });

    sendPaginated(
      res,
      result.items,
      {
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
      },
      { tenantId: req.tenant.id }
    );
  };

  public updateRouteStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    const input = UpdateRouteStatusSchema.parse(req.body);
    const route = await this.service.updateRouteStatus(req.tenant.id, id, input);
    sendSuccess(res, route, {
      message: 'Route status updated successfully',
      tenantId: req.tenant.id,
    });
  };

  public updateStopStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id: stopId } = IdParamSchema.parse(req.params);
    const input = UpdateStopStatusSchema.parse(req.body);
    const stop = await this.service.updateStopStatus(req.tenant.id, stopId, input);
    sendSuccess(res, stop, {
      message: 'Stop completion status updated',
      tenantId: req.tenant.id,
    });
  };

  public batchSyncOfflineStops = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const input = BatchOfflineSyncSchema.parse(req.body);
    const result = await this.service.batchSyncOfflineStops(req.tenant.id, input);
    sendSuccess(res, result, {
      message: result.message,
      tenantId: req.tenant.id,
    });
  };

  public getActiveDriverRoute = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const route = await this.service.getActiveDriverRoute(req.tenant.id, req.user.id, today);
    sendSuccess(res, route, { tenantId: req.tenant.id });
  };
}


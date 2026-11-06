import { Request, Response } from 'express';
import { FleetService } from './fleet.service.js';
import {
  CreateVehicleSchema,
  UpdateVehicleSchema,
  VehicleFilterSchema,
} from './fleet.schema.js';
import { BadRequestError } from '../../shared/errors/app-error.js';
import { IdParamSchema } from '../../shared/utils/param-validator.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.util.js';

export class FleetController {
  constructor(private readonly service: FleetService = new FleetService()) {}

  public createVehicle = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const input = CreateVehicleSchema.parse(req.body);
    const vehicle = await this.service.createVehicle(req.tenant.id, input);
    sendSuccess(res, vehicle, {
      status: 201,
      message: 'Vehicle added to fleet successfully',
      tenantId: req.tenant.id,
    });
  };

  public getVehicleById = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    const vehicle = await this.service.getVehicleById(req.tenant.id, id);
    sendSuccess(res, vehicle, { tenantId: req.tenant.id });
  };

  public listVehicles = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const filters = VehicleFilterSchema.parse(req.query);
    const result = await this.service.getVehicles(req.tenant.id, {
      ...(filters.vehicleType !== undefined && { vehicleType: filters.vehicleType }),
      ...(filters.status !== undefined && { status: filters.status }),
      ...(filters.assignedDriverId !== undefined && { assignedDriverId: filters.assignedDriverId }),
      ...(filters.search !== undefined && { search: filters.search }),
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

  public updateVehicle = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    const input = UpdateVehicleSchema.parse(req.body);
    const vehicle = await this.service.updateVehicle(req.tenant.id, id, input);
    sendSuccess(res, vehicle, {
      message: 'Vehicle updated successfully',
      tenantId: req.tenant.id,
    });
  };

  public deleteVehicle = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    await this.service.deleteVehicle(req.tenant.id, id);
    sendSuccess(res, { deleted: true }, {
      message: 'Vehicle deleted from fleet successfully',
      tenantId: req.tenant.id,
    });
  };

  public listEligibleDrivers = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const drivers = await this.service.getEligibleDrivers(req.tenant.id);
    sendSuccess(res, drivers, { tenantId: req.tenant.id });
  };
}

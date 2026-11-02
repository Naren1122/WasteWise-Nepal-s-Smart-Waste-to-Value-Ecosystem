import { Request, Response } from 'express';
import { WardService } from './wards.service.js';
import {
  CreateWardSchema,
  UpdateWardSchema,
  CreateZoneSchema,
  UpdateZoneSchema,
} from './wards.schema.js';
import { BadRequestError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { sendSuccess } from '../../shared/utils/response.util.js';
import {
  IdParamSchema,
  WardIdParamSchema,
  WardAndZoneParamSchema,
} from '../../shared/utils/param-validator.js';

export class WardController {
  constructor(private readonly service: WardService = new WardService()) {}

  public getWards = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const result = await this.service.getWards(req.tenant.id);
    sendSuccess(res, result, { tenantId: req.tenant.id });
  };

  public getWardById = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    const result = await this.service.getWardById(req.tenant.id, id);
    sendSuccess(res, result, { tenantId: req.tenant.id });
  };

  public createWard = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const validatedData = CreateWardSchema.parse(req.body);
    const result = await this.service.createWard(req.tenant.id, validatedData);
    sendSuccess(res, result, { status: 201, message: 'Ward created successfully', tenantId: req.tenant.id });
  };

  public updateWard = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    const validatedData = UpdateWardSchema.parse(req.body);
    const result = await this.service.updateWard(req.tenant.id, id, validatedData);
    sendSuccess(res, result, { message: 'Ward updated successfully', tenantId: req.tenant.id });
  };

  public getZonesByWard = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { wardId } = WardIdParamSchema.parse(req.params);
    const result = await this.service.getZonesByWard(
      req.tenant.id,
      wardId,
      req.user ? { role: req.user.role, wardId: req.user.wardId } : undefined
    );
    sendSuccess(res, result, { tenantId: req.tenant.id });
  };

  public createZone = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();
    const { wardId } = WardIdParamSchema.parse(req.params);
    const validatedData = CreateZoneSchema.parse(req.body);
    const result = await this.service.createZone(
      req.tenant.id,
      wardId,
      { role: req.user.role, wardId: req.user.wardId },
      validatedData
    );
    sendSuccess(res, result, { status: 201, message: 'Service zone created successfully', tenantId: req.tenant.id });
  };

  public updateZone = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();
    const { id } = IdParamSchema.parse(req.params);
    const validatedData = UpdateZoneSchema.parse(req.body);
    const result = await this.service.updateZone(
      req.tenant.id,
      id,
      { role: req.user.role, wardId: req.user.wardId },
      validatedData
    );
    sendSuccess(res, result, { message: 'Service zone updated successfully', tenantId: req.tenant.id });
  };
}

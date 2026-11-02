import { Request, Response } from 'express';
import { PropertyService } from './properties.service.js';
import {
  CreatePropertySchema,
  UpdatePropertySchema,
  UpdatePropertyStatusSchema,
  PropertyQuerySchema,
} from './properties.schema.js';
import { BadRequestError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { ApiResponse, PaginatedResponse } from '../../shared/types/api-response.types.js';
import { PropertyDto } from './properties.types.js';
import { IdParamSchema } from '../../shared/utils/param-validator.js';
import { sendSuccess } from '../../shared/utils/response.util.js';

export class PropertyController {
  constructor(private readonly service: PropertyService = new PropertyService()) {}

  public registerProperty = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();

    const validatedData = CreatePropertySchema.parse(req.body);
    const result = await this.service.registerProperty(req.tenant.id, req.user.id, validatedData);

    const response: ApiResponse<PropertyDto> = {
      success: true,
      data: result,
      message: 'Property registered successfully',
      meta: { timestamp: new Date().toISOString(), tenantId: req.tenant.id },
    };

    res.status(201).json(response);
  };

  public getMyProperties = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();

    const result = await this.service.getMyProperties(req.tenant.id, req.user.id);

    const response: ApiResponse<PropertyDto[]> = {
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString(), tenantId: req.tenant.id },
    };

    res.status(200).json(response);
  };

  public getPropertyById = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();

    const { id } = IdParamSchema.parse(req.params);

    const result = await this.service.getPropertyById(req.tenant.id, id, {
      id: req.user.id,
      role: req.user.role,
      wardId: req.user.wardId,
    });

    sendSuccess(res, result, { tenantId: req.tenant.id });
  };

  public listProperties = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();

    const query = PropertyQuerySchema.parse(req.query);
    const result = await this.service.listProperties(
      req.tenant.id,
      { id: req.user.id, role: req.user.role, wardId: req.user.wardId },
      query
    );

    const response: PaginatedResponse<PropertyDto> = {
      success: true,
      data: result.properties,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        totalItems: result.totalCount,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      },
      meta: { timestamp: new Date().toISOString(), tenantId: req.tenant.id },
    };

    res.status(200).json(response);
  };

  public updateProperty = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();

    const { id } = IdParamSchema.parse(req.params);

    const validatedData = UpdatePropertySchema.parse(req.body);
    const result = await this.service.updateProperty(
      req.tenant.id,
      id,
      { id: req.user.id, role: req.user.role, wardId: req.user.wardId },
      validatedData
    );

    sendSuccess(res, result, { message: 'Property updated successfully', tenantId: req.tenant.id });
  };

  public updatePropertyStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();

    const { id } = IdParamSchema.parse(req.params);

    const validatedData = UpdatePropertyStatusSchema.parse(req.body);
    const result = await this.service.updatePropertyStatus(
      req.tenant.id,
      id,
      { id: req.user.id, role: req.user.role, wardId: req.user.wardId },
      validatedData
    );

    sendSuccess(res, result, { message: 'Property status updated successfully', tenantId: req.tenant.id });
  };
}

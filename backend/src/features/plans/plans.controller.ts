import { Request, Response } from 'express';
import { PlansService } from './plans.service.js';
import {
  CreateServicePlanSchema,
  UpdateServicePlanSchema,
  ServicePlanFilterSchema,
  CreateSubscriptionSchema,
} from './plans.schema.js';
import { BadRequestError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { IdParamSchema } from '../../shared/utils/param-validator.js';
import { sendSuccess } from '../../shared/utils/response.util.js';

export class PlansController {
  constructor(private readonly service: PlansService = new PlansService()) {}

  public createPlan = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const input = CreateServicePlanSchema.parse(req.body);
    const plan = await this.service.createPlan(req.tenant.id, input);
    sendSuccess(res, plan, { status: 201, message: 'Service plan created successfully', tenantId: req.tenant.id });
  };

  public getPlanById = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    const plan = await this.service.getPlanById(req.tenant.id, id);
    sendSuccess(res, plan, { tenantId: req.tenant.id });
  };

  public listPlans = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const filters = ServicePlanFilterSchema.parse(req.query);
    const result = await this.service.getPlans(req.tenant.id, filters);
    res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: result.totalCount,
        totalPages: Math.ceil(result.totalCount / filters.pageSize),
        hasNextPage: filters.page * filters.pageSize < result.totalCount,
        hasPreviousPage: filters.page > 1,
      },
      meta: { timestamp: new Date().toISOString(), tenantId: req.tenant.id },
    });
  };

  public updatePlan = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    const input = UpdateServicePlanSchema.parse(req.body);
    const plan = await this.service.updatePlan(req.tenant.id, id, input);
    sendSuccess(res, plan, { message: 'Service plan updated successfully', tenantId: req.tenant.id });
  };

  public createSubscription = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();
    const input = CreateSubscriptionSchema.parse(req.body);
    const sub = await this.service.createSubscription(req.tenant.id, req.user.id, req.user.role, input);
    sendSuccess(res, sub, { status: 201, message: 'Subscribed successfully', tenantId: req.tenant.id });
  };

  public getPropertySubscriptions = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();
    const { id: propertyId } = IdParamSchema.parse(req.params);
    const subs = await this.service.getPropertySubscriptions(req.tenant.id, propertyId, req.user.id, req.user.role);
    sendSuccess(res, subs, { tenantId: req.tenant.id });
  };

  public cancelSubscription = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    if (!req.user) throw new UnauthorizedError();
    const { id: subscriptionId } = IdParamSchema.parse(req.params);
    const sub = await this.service.cancelSubscription(req.tenant.id, subscriptionId, req.user.id, req.user.role);
    sendSuccess(res, sub, { message: 'Subscription cancelled successfully', tenantId: req.tenant.id });
  };
}


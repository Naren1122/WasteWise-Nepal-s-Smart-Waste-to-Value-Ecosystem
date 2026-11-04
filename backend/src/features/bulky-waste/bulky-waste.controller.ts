import { Request, Response } from 'express';
import { BulkyWasteService } from './bulky-waste.service.js';
import {
  CreateBulkyRequestSchema,
  QuoteBulkyRequestSchema,
  ScheduleBulkyRequestSchema,
  RejectBulkyRequestSchema,
  CompleteBulkyRequestSchema,
  BulkyRequestQuerySchema,
} from './bulky-waste.schema.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.util.js';
import { IdParamSchema } from '../../shared/utils/param-validator.js';
import { getRequestContext } from '../../shared/utils/request-context.js';

export class BulkyWasteController {
  constructor(private readonly service: BulkyWasteService = new BulkyWasteService()) {}

  public submitRequest = async (req: Request, res: Response): Promise<void> => {
    const ctx = getRequestContext(req);
    const input = CreateBulkyRequestSchema.parse(req.body);
    const result = await this.service.submitRequest(ctx.tenantId, ctx.userId, ctx.role, input);
    sendSuccess(res, result, {
      status: 201,
      message: 'Bulky waste pickup requested successfully',
      tenantId: ctx.tenantId,
    });
  };

  public quoteRequest = async (req: Request, res: Response): Promise<void> => {
    const ctx = getRequestContext(req);
    const { id } = IdParamSchema.parse(req.params);
    const input = QuoteBulkyRequestSchema.parse(req.body);
    const result = await this.service.quoteRequest(ctx.tenantId, id, input, ctx.wardId);
    sendSuccess(res, result, { message: 'Tariff quotation submitted', tenantId: ctx.tenantId });
  };

  public approveQuotation = async (req: Request, res: Response): Promise<void> => {
    const ctx = getRequestContext(req);
    const { id } = IdParamSchema.parse(req.params);
    const result = await this.service.approveQuotation(ctx.tenantId, id, ctx.userId, ctx.role);
    sendSuccess(res, result, { message: 'Quotation approved', tenantId: ctx.tenantId });
  };

  public schedulePickup = async (req: Request, res: Response): Promise<void> => {
    const ctx = getRequestContext(req);
    const { id } = IdParamSchema.parse(req.params);
    const input = ScheduleBulkyRequestSchema.parse(req.body);
    const result = await this.service.schedulePickup(ctx.tenantId, id, input, ctx.wardId);
    sendSuccess(res, result, { message: 'Bulky pickup scheduled', tenantId: ctx.tenantId });
  };

  public rejectRequest = async (req: Request, res: Response): Promise<void> => {
    const ctx = getRequestContext(req);
    const { id } = IdParamSchema.parse(req.params);
    const input = RejectBulkyRequestSchema.parse(req.body);
    const result = await this.service.rejectRequest(ctx.tenantId, id, input, ctx.wardId);
    sendSuccess(res, result, { message: 'Bulky request rejected', tenantId: ctx.tenantId });
  };

  public completeRequest = async (req: Request, res: Response): Promise<void> => {
    const ctx = getRequestContext(req);
    const { id } = IdParamSchema.parse(req.params);
    const input = CompleteBulkyRequestSchema.parse(req.body);
    const result = await this.service.completeRequest(ctx.tenantId, id, input, ctx.wardId);
    sendSuccess(res, result, { message: 'Bulky pickup completed', tenantId: ctx.tenantId });
  };

  public cancelRequest = async (req: Request, res: Response): Promise<void> => {
    const ctx = getRequestContext(req);
    const { id } = IdParamSchema.parse(req.params);
    const result = await this.service.cancelRequest(ctx.tenantId, id, ctx.userId, ctx.role, ctx.wardId);
    sendSuccess(res, result, { message: 'Request cancelled', tenantId: ctx.tenantId });
  };

  public listRequests = async (req: Request, res: Response): Promise<void> => {
    const ctx = getRequestContext(req);
    const filters = BulkyRequestQuerySchema.parse(req.query);
    const result = await this.service.getRequests(ctx, filters);

    sendPaginated(
      res,
      result.items,
      {
        page: filters.page,
        pageSize: filters.pageSize,
        totalCount: result.totalCount,
      },
      { tenantId: ctx.tenantId }
    );
  };

  public getRequestById = async (req: Request, res: Response): Promise<void> => {
    const ctx = getRequestContext(req);
    const { id } = IdParamSchema.parse(req.params);
    const result = await this.service.getRequestById(ctx.tenantId, id, ctx.userId, ctx.role, ctx.wardId);
    sendSuccess(res, result, { tenantId: ctx.tenantId });
  };
}

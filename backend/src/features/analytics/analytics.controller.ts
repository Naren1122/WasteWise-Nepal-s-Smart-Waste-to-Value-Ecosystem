import type { Request, Response } from 'express';
import { analyticsService, AnalyticsService } from './analytics.service.js';
import { AnalyticsQuerySchema, WardAnalyticsParamSchema } from './analytics.schema.js';
import { resolveDateRange } from '../../shared/utils/date-range.util.js';
import { sendSuccess } from '../../shared/utils/response.util.js';
import { UnauthorizedError, NotFoundError } from '../../shared/errors/app-error.js';

export class AnalyticsController {
  constructor(private readonly service: AnalyticsService = analyticsService) {}

  private extractTenantId(req: Request): string {
    if (!req.tenant?.id) throw new UnauthorizedError('Tenant context is required');
    return req.tenant.id;
  }

  public getOverview = async (req: Request, res: Response): Promise<void> => {
    const tenantId = this.extractTenantId(req);
    const query = AnalyticsQuerySchema.parse(req.query);
    const resolved = resolveDateRange({
      startDate: query.startDate,
      endDate: query.endDate,
      preset: query.preset,
    });

    const overview = await this.service.getExecutiveOverview(tenantId, {
      startDate: resolved.startDate,
      endDate: resolved.endDate,
      wardId: query.wardId,
    });

    sendSuccess(res, overview, {
      message: 'Executive analytics overview retrieved successfully',
      tenantId,
    });
  };

  public getCollections = async (req: Request, res: Response): Promise<void> => {
    const tenantId = this.extractTenantId(req);
    const query = AnalyticsQuerySchema.parse(req.query);
    const resolved = resolveDateRange({
      startDate: query.startDate,
      endDate: query.endDate,
      preset: query.preset,
    });

    const collections = await this.service.getCollectionMetrics(tenantId, {
      startDate: resolved.startDate,
      endDate: resolved.endDate,
      wardId: query.wardId,
    });

    sendSuccess(res, collections, {
      message: 'Collection metrics retrieved successfully',
      tenantId,
    });
  };

  public getFinancials = async (req: Request, res: Response): Promise<void> => {
    const tenantId = this.extractTenantId(req);
    const query = AnalyticsQuerySchema.parse(req.query);
    const resolved = resolveDateRange({
      startDate: query.startDate,
      endDate: query.endDate,
      preset: query.preset,
    });

    const financials = await this.service.getFinancialMetrics(tenantId, {
      startDate: resolved.startDate,
      endDate: resolved.endDate,
      wardId: query.wardId,
    });

    sendSuccess(res, financials, {
      message: 'Financial metrics retrieved successfully',
      tenantId,
    });
  };

  public getComplaints = async (req: Request, res: Response): Promise<void> => {
    const tenantId = this.extractTenantId(req);
    const query = AnalyticsQuerySchema.parse(req.query);
    const resolved = resolveDateRange({
      startDate: query.startDate,
      endDate: query.endDate,
      preset: query.preset,
    });

    const complaints = await this.service.getGrievanceMetrics(tenantId, {
      startDate: resolved.startDate,
      endDate: resolved.endDate,
      wardId: query.wardId,
    });

    sendSuccess(res, complaints, {
      message: 'Grievance metrics retrieved successfully',
      tenantId,
    });
  };

  public getWardPerformance = async (req: Request, res: Response): Promise<void> => {
    const tenantId = this.extractTenantId(req);
    const query = AnalyticsQuerySchema.parse(req.query);
    const resolved = resolveDateRange({
      startDate: query.startDate,
      endDate: query.endDate,
      preset: query.preset,
    });

    const wardCards = await this.service.getWardPerformance(tenantId, {
      startDate: resolved.startDate,
      endDate: resolved.endDate,
    });

    sendSuccess(res, wardCards, {
      message: 'Ward performance cards retrieved successfully',
      tenantId,
    });
  };

  public getSingleWardCard = async (req: Request, res: Response): Promise<void> => {
    const tenantId = this.extractTenantId(req);
    const params = WardAnalyticsParamSchema.parse(req.params);
    const query = AnalyticsQuerySchema.parse(req.query);
    const resolved = resolveDateRange({
      startDate: query.startDate,
      endDate: query.endDate,
      preset: query.preset,
    });

    const wardCards = await this.service.getWardPerformance(tenantId, {
      startDate: resolved.startDate,
      endDate: resolved.endDate,
      wardId: params.wardId,
    });

    const card = wardCards.find((c) => c.wardId === params.wardId);
    if (!card) throw new NotFoundError('Ward performance card', params.wardId);

    sendSuccess(res, card, {
      message: 'Ward performance card retrieved successfully',
      tenantId,
    });
  };
}

export const analyticsController = new AnalyticsController();


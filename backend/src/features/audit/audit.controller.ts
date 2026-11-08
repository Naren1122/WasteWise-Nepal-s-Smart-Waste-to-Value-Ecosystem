import type { Request, Response } from 'express';
import { auditService, AuditService } from './audit.service.js';
import { AuditQuerySchema, AuditIdParamSchema } from './audit.schema.js';
import { resolveDateRange } from '../../shared/utils/date-range.util.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.util.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

export class AuditController {
  constructor(private readonly service: AuditService = auditService) {}

  private extractTenantId(req: Request): string {
    if (!req.tenant?.id) throw new UnauthorizedError('Tenant context is required');
    return req.tenant.id;
  }

  public listAuditLogs = async (req: Request, res: Response): Promise<void> => {
    const tenantId = this.extractTenantId(req);
    const query = AuditQuerySchema.parse(req.query);

    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (query.startDate || query.endDate || query.preset) {
      const resolved = resolveDateRange({
        startDate: query.startDate,
        endDate: query.endDate,
        preset: query.preset,
      });
      startDate = resolved.startDate;
      endDate = resolved.endDate;
    }

    const result = await this.service.listAuditLogs(tenantId, {
      page: query.page,
      pageSize: query.pageSize,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      actorUserId: query.actorUserId,
      startDate,
      endDate,
    });

    sendPaginated(
      res,
      result.data,
      {
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalCount: result.pagination.totalItems,
      },
      {
        message: 'Audit logs retrieved successfully',
        tenantId,
      }
    );
  };

  public getAuditLogById = async (req: Request, res: Response): Promise<void> => {
    const tenantId = this.extractTenantId(req);
    const params = AuditIdParamSchema.parse(req.params);

    const log = await this.service.getAuditLogById(tenantId, params.id);

    sendSuccess(res, log, {
      message: 'Audit log record retrieved successfully',
      tenantId,
    });
  };
}

export const auditController = new AuditController();


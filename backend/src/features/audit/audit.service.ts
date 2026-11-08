import { auditRepository, AuditRepository } from './audit.repository.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import type { AuditLogSummaryDto, AuditLogDetailDto, AuditLogQueryFilters } from './audit.types.js';
import type { PaginatedResult } from '../../shared/types/api-response.types.js';

export class AuditService {
  constructor(private readonly repo: AuditRepository = auditRepository) {}

  async listAuditLogs(
    tenantId: string,
    filters: AuditLogQueryFilters
  ): Promise<PaginatedResult<AuditLogSummaryDto>> {
    return this.repo.findMany(tenantId, filters);
  }

  async getAuditLogById(tenantId: string, id: string): Promise<AuditLogDetailDto> {
    const log = await this.repo.findById(tenantId, id);
    if (!log) {
      throw new NotFoundError('Audit log record', id);
    }
    return log;
  }
}

export const auditService = new AuditService();


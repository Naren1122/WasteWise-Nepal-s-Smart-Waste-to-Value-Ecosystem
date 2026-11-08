import { prisma } from '../../shared/database/prisma.service.js';
import type { Prisma } from '@prisma/client';
import type { AuditLogSummaryDto, AuditLogDetailDto, AuditLogQueryFilters } from './audit.types.js';
import type { PaginatedResult } from '../../shared/types/api-response.types.js';

export class AuditRepository {
  async findMany(tenantId: string, filters: AuditLogQueryFilters): Promise<PaginatedResult<AuditLogSummaryDto>> {
    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          }
        : {}),
    };

    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    const [totalItems, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: { select: { fullName: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / filters.pageSize);

    const data: AuditLogSummaryDto[] = logs.map((log) => ({
      id: log.id,
      tenantId: log.tenantId,
      actorUserId: log.actorUserId,
      actorUserName: log.actorUser?.fullName ?? null,
      actorRole: log.actorRole,
      ipAddress: log.ipAddress,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      description: log.description,
      createdAt: log.createdAt,
    }));

    return {
      data,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems,
        totalPages,
        hasNextPage: filters.page < totalPages,
        hasPreviousPage: filters.page > 1,
      },
    };
  }

  async findById(tenantId: string, id: string): Promise<AuditLogDetailDto | null> {
    const log = await prisma.auditLog.findFirst({
      where: { id, tenantId },
      include: {
        actorUser: { select: { fullName: true } },
      },
    });

    if (!log) return null;

    return {
      id: log.id,
      tenantId: log.tenantId,
      actorUserId: log.actorUserId,
      actorUserName: log.actorUser?.fullName ?? null,
      actorRole: log.actorRole,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      diffBefore: log.diffBefore,
      diffAfter: log.diffAfter,
      description: log.description,
      createdAt: log.createdAt,
    };
  }
}

export const auditRepository = new AuditRepository();


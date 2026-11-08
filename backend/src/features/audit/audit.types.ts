import type { AuditAction, Role, Prisma } from '@prisma/client';

export interface AuditLogSummaryDto {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  actorUserName: string | null;
  actorRole: Role | null;
  ipAddress: string | null;
  entityType: string;
  entityId: string;
  action: AuditAction;
  description: string | null;
  createdAt: Date;
}

export interface AuditLogDetailDto extends AuditLogSummaryDto {
  userAgent: string | null;
  diffBefore: Prisma.JsonValue | null;
  diffAfter: Prisma.JsonValue | null;
}

export interface AuditLogQueryFilters {
  page: number;
  pageSize: number;
  action?: AuditAction | undefined;
  entityType?: string | undefined;
  entityId?: string | undefined;
  actorUserId?: string | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
}


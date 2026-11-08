import { prisma } from '../database/prisma.service.js';
import type { Role, AuditAction } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface RecordAuditParams {
  tenantId: string;
  actorUserId?: string | undefined;
  actorRole?: Role | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  entityType: string;
  entityId: string;
  action: AuditAction;
  diffBefore?: Record<string, unknown> | null | undefined;
  diffAfter?: Record<string, unknown> | null | undefined;
  description?: string | undefined;
}

const REDACTED_KEYS = new Set(['passwordHash', 'tokenHash', 'secret', 'apiKey', 'pin', 'signature']);

/**
 * Strips sensitive credential fields from diff objects before audit persistence.
 */
export const sanitizeAuditPayload = (obj?: Record<string, unknown> | null): Prisma.InputJsonValue | undefined => {
  if (!obj) return undefined;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditPayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as Prisma.InputJsonValue;
};

/**
 * Computes a minimal changed-field diff between before and after states.
 */
export const computeAuditDiff = (
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null
): { diffBefore?: Prisma.InputJsonValue | undefined; diffAfter?: Prisma.InputJsonValue | undefined } => {
  if (!before && !after) return {};
  if (!before) return { diffAfter: sanitizeAuditPayload(after) };
  if (!after) return { diffBefore: sanitizeAuditPayload(before) };

  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    const valBefore = before[key];
    const valAfter = after[key];

    if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
      changedBefore[key] = valBefore;
      changedAfter[key] = valAfter;
    }
  }

  const result: { diffBefore?: Prisma.InputJsonValue | undefined; diffAfter?: Prisma.InputJsonValue | undefined } = {};
  const sBefore = sanitizeAuditPayload(changedBefore);
  const sAfter = sanitizeAuditPayload(changedAfter);
  if (sBefore !== undefined) result.diffBefore = sBefore;
  if (sAfter !== undefined) result.diffAfter = sAfter;

  return result;
};

/**
 * Asynchronously writes an immutable audit record without blocking primary request thread.
 */
export const logAuditEvent = (params: RecordAuditParams): void => {
  setImmediate(async () => {
    try {
      const sanitizedBefore = sanitizeAuditPayload(params.diffBefore);
      const sanitizedAfter = sanitizeAuditPayload(params.diffAfter);

      const createData: Prisma.AuditLogUncheckedCreateInput = {
        tenantId: params.tenantId,
        actorUserId: params.actorUserId ?? null,
        actorRole: params.actorRole ?? null,
        ipAddress: params.ipAddress ? params.ipAddress.slice(0, 45) : null,
        userAgent: params.userAgent ? params.userAgent.slice(0, 255) : null,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        description: params.description ? params.description.slice(0, 255) : null,
      };

      if (sanitizedBefore !== undefined) {
        createData.diffBefore = sanitizedBefore;
      }
      if (sanitizedAfter !== undefined) {
        createData.diffAfter = sanitizedAfter;
      }

      await prisma.auditLog.create({ data: createData });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[AuditLogger] Failed to write audit event for ${params.entityType}:${params.entityId}: ${message}`);
    }
  });
};

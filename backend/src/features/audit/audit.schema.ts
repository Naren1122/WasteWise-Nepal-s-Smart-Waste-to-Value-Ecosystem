import { z } from 'zod';
import { AuditAction } from '@prisma/client';
import { DatePresetSchema } from '../analytics/analytics.schema.js';

export const AuditQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    action: z.nativeEnum(AuditAction).optional(),
    entityType: z.string().trim().max(64).optional(),
    entityId: z.string().trim().max(64).optional(),
    actorUserId: z.string().uuid('Invalid actor user UUID').optional(),
    startDate: z
      .string()
      .datetime({ offset: true })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD or ISO-8601'))
      .optional(),
    endDate: z
      .string()
      .datetime({ offset: true })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD or ISO-8601'))
      .optional(),
    preset: DatePresetSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'startDate must be on or before endDate',
      path: ['startDate'],
    }
  );

export type AuditQueryDto = z.infer<typeof AuditQuerySchema>;

export const AuditIdParamSchema = z.object({
  id: z.string().uuid('Invalid audit log UUID format'),
});

export type AuditIdParamDto = z.infer<typeof AuditIdParamSchema>;


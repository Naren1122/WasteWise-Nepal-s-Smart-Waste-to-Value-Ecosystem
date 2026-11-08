import { z } from 'zod';
import { DatePresetSchema } from '../analytics/analytics.schema.js';

export const ReportTypeSchema = z.enum([
  'COLLECTIONS',
  'FINANCIAL_RECONCILIATION',
  'COMPLAINTS_SLA',
  'WARD_SUMMARY',
]);

export const ReportFormatSchema = z.enum(['csv', 'pdf']).default('csv');

export const ReportExportQuerySchema = z
  .object({
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
    wardId: z.string().uuid('Invalid ward UUID format').optional(),
    format: ReportFormatSchema,
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

export type ReportExportQueryDto = z.infer<typeof ReportExportQuerySchema>;


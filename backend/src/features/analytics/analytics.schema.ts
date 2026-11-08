import { z } from 'zod';

export const DatePresetSchema = z.enum([
  'today',
  'yesterday',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'last_30_days',
  'this_fiscal_year',
]);

export type DatePreset = z.infer<typeof DatePresetSchema>;

export const AnalyticsQuerySchema = z
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

export type AnalyticsQueryDto = z.infer<typeof AnalyticsQuerySchema>;

export const WardAnalyticsParamSchema = z.object({
  wardId: z.string().uuid('Invalid ward UUID format'),
});

export type WardAnalyticsParamDto = z.infer<typeof WardAnalyticsParamSchema>;


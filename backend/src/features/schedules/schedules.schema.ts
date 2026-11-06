import { z } from 'zod';
import { WasteType } from '@prisma/client';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const CreateCollectionScheduleSchema = z.object({
  wardId: z.string().uuid('Invalid ward ID format'),
  zoneId: z.string().uuid('Invalid zone ID format').optional().nullable(),
  wasteType: z.nativeEnum(WasteType, {
    errorMap: () => ({ message: 'Invalid waste stream type' }),
  }),
  dayOfWeek: z
    .number({ invalid_type_error: 'Day of week must be 0 (Sun) to 6 (Sat)' })
    .int()
    .min(0)
    .max(6),
  startTime: z.string().regex(timeRegex, 'Start time must be in 24-hour HH:MM format'),
  endTime: z.string().regex(timeRegex, 'End time must be in 24-hour HH:MM format'),
  isActive: z.boolean().optional().default(true),
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const UpdateCollectionScheduleSchema = z.object({
  wasteType: z.nativeEnum(WasteType).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  isActive: z.boolean().optional(),
});

export const GeneratePickupsSchema = z.object({
  targetDate: z.coerce.date(),
  wardId: z.string().uuid().optional(),
});

export const CalendarQuerySchema = z.object({
  wardId: z.string().uuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type CreateCollectionScheduleInput = z.input<typeof CreateCollectionScheduleSchema>;
export type UpdateCollectionScheduleInput = z.input<typeof UpdateCollectionScheduleSchema>;
export type GeneratePickupsInput = z.infer<typeof GeneratePickupsSchema>;
export type CalendarQueryInput = z.infer<typeof CalendarQuerySchema>;

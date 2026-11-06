import { z } from 'zod';
import { BulkyWasteStatus } from '@prisma/client';
import { MAX_BULKY_QUOTE_NPR, NEPAL_TIMEZONE } from './bulky-waste.constants.js';

const YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayInNepal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: NEPAL_TIMEZONE }).format(new Date());
}

export const NepalFutureDateSchema = z
  .string({ required_error: 'Date must be provided in YYYY-MM-DD format' })
  .regex(YYYY_MM_DD_REGEX, 'Date must be in YYYY-MM-DD format')
  .refine(
    (dateStr) => {
      const todayNepal = getTodayInNepal();
      return dateStr >= todayNepal;
    },
    {
      message: 'Date cannot be in the past in Nepal timezone (Asia/Kathmandu)',
    }
  )
  .transform((dateStr) => new Date(`${dateStr}T00:00:00.000Z`));

export const CreateBulkyRequestSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID format'),
  itemDescription: z
    .string()
    .trim()
    .min(5, 'Item description must be at least 5 characters')
    .max(500, 'Item description cannot exceed 500 characters'),
  estimatedVolume: z.string().trim().max(100).optional().nullable(),
  preferredDate: NepalFutureDateSchema,
});

export const QuoteBulkyRequestSchema = z.object({
  quotedAmountNpr: z
    .number({ invalid_type_error: 'Quoted amount must be a number' })
    .positive('Quoted tariff must be greater than 0 NPR')
    .max(MAX_BULKY_QUOTE_NPR, `Quoted amount cannot exceed ${MAX_BULKY_QUOTE_NPR} NPR`)
    .multipleOf(0.01, 'Quoted amount must have at most 2 decimal places'),
  officerNotes: z.string().trim().max(500).optional().nullable(),
});

export const ScheduleBulkyRequestSchema = z.object({
  scheduledDate: NepalFutureDateSchema,
  officerNotes: z.string().trim().max(500).optional().nullable(),
});

export const RejectBulkyRequestSchema = z
  .object({
    officerNotes: z.string().trim().min(3, 'Rejection reason must be at least 3 characters').max(500).optional(),
    reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters').max(500).optional(),
  })
  .refine((data) => !!(data.officerNotes || data.reason), {
    message: 'Rejection reason is required and must be at least 3 characters',
    path: ['officerNotes'],
  })
  .transform((data) => ({
    officerNotes: (data.officerNotes || data.reason) as string,
  }));

export const CompleteBulkyRequestSchema = z.object({
  officerNotes: z.string().trim().max(500).optional().nullable(),
});

export const BulkyRequestQuerySchema = z.object({
  wardId: z.string().uuid().optional(),
  status: z.nativeEnum(BulkyWasteStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateBulkyRequestInput = z.infer<typeof CreateBulkyRequestSchema>;
export type QuoteBulkyRequestInput = z.infer<typeof QuoteBulkyRequestSchema>;
export type ScheduleBulkyRequestInput = z.infer<typeof ScheduleBulkyRequestSchema>;
export type RejectBulkyRequestInput = z.infer<typeof RejectBulkyRequestSchema>;
export type CompleteBulkyRequestInput = z.infer<typeof CompleteBulkyRequestSchema>;
export type BulkyRequestQueryInput = z.infer<typeof BulkyRequestQuerySchema>;

import { z } from 'zod';
import { PropertyType, WasteType } from '@prisma/client';

export const CreateServicePlanSchema = z.object({
  name: z.string().trim().min(3, 'Plan name must be at least 3 characters').max(100),
  code: z
    .string()
    .trim()
    .min(2, 'Plan code must be at least 2 characters')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, 'Plan code must be alphanumeric with dashes or underscores')
    .transform((val) => val.toUpperCase()),
  description: z.string().trim().max(255).optional().nullable(),
  propertyType: z.nativeEnum(PropertyType, {
    errorMap: () => ({ message: 'Invalid property type' }),
  }),
  wasteType: z.nativeEnum(WasteType, {
    errorMap: () => ({ message: 'Invalid waste type stream' }),
  }),
  monthlyRateNpr: z
    .number({ invalid_type_error: 'Monthly rate must be a number' })
    .nonnegative('Monthly rate cannot be negative')
    .max(1000000, 'Monthly rate exceeds limit'),
  isActive: z.boolean().optional().default(true),
});

export const UpdateServicePlanSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().max(255).optional().nullable(),
  monthlyRateNpr: z.number().nonnegative().max(1000000).optional(),
  isActive: z.boolean().optional(),
});

export const ServicePlanFilterSchema = z.object({
  propertyType: z.nativeEnum(PropertyType).optional(),
  wasteType: z.nativeEnum(WasteType).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const CreateSubscriptionSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID format'),
  planId: z.string().uuid('Invalid service plan ID format'),
  startDate: z.coerce.date().optional(),
});

export type CreateServicePlanInput = z.infer<typeof CreateServicePlanSchema>;
export type UpdateServicePlanInput = z.infer<typeof UpdateServicePlanSchema>;
export type ServicePlanFilterInput = z.infer<typeof ServicePlanFilterSchema>;
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;


import { z } from 'zod';
import { optionalPhoneSchema } from '../../shared/utils/nepal-phone.js';

export const CreateWardSchema = z.object({
  wardNumber: z
    .number({ invalid_type_error: 'Ward number must be an integer' })
    .int('Ward number must be an integer')
    .min(1, 'Ward number must be at least 1')
    .max(99, 'Ward number cannot exceed 99'),
  officeAddress: z.string().trim().max(255).optional().nullable(),
  contactPhone: optionalPhoneSchema,
});
export type CreateWardDto = z.infer<typeof CreateWardSchema>;

export const UpdateWardSchema = z
  .object({
    officeAddress: z.string().trim().max(255).optional().nullable(),
    contactPhone: optionalPhoneSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
export type UpdateWardDto = z.infer<typeof UpdateWardSchema>;

export const CreateZoneSchema = z.object({
  name: z.string().trim().min(2, 'Zone name must be at least 2 characters').max(100),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Zone code must be at least 2 characters')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Zone code must contain only uppercase letters, numbers, hyphens or underscores'),
  description: z.string().trim().max(255).optional().nullable(),
});
export type CreateZoneDto = z.infer<typeof CreateZoneSchema>;

export const UpdateZoneSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(255).optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
export type UpdateZoneDto = z.infer<typeof UpdateZoneSchema>;

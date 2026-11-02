import { z } from 'zod';
import { PropertyType, PropertyStatus } from '@prisma/client';
import { phoneSchema } from '../../shared/utils/nepal-phone.js';

// Geographic coordinate bounds for Nepal roughly:
// Latitude: 26.3°N to 30.5°N
// Longitude: 80.0°E to 88.2°E
const latitudeField = z
  .number({ invalid_type_error: 'Latitude must be a valid number' })
  .min(26.0, 'Latitude is out of valid bounds for Nepal (minimum 26.0°N)')
  .max(31.0, 'Latitude is out of valid bounds for Nepal (maximum 31.0°N)');

const longitudeField = z
  .number({ invalid_type_error: 'Longitude must be a valid number' })
  .min(80.0, 'Longitude is out of valid bounds for Nepal (minimum 80.0°E)')
  .max(89.0, 'Longitude is out of valid bounds for Nepal (maximum 89.0°E)');

export const CreatePropertySchema = z.object({
  wardId: z.string().uuid('Invalid ward UUID format'),
  zoneId: z.string().uuid('Invalid zone UUID format').optional().nullable(),
  propertyType: z.nativeEnum(PropertyType, {
    errorMap: () => ({ message: 'Invalid property type. Must be RESIDENTIAL, COMMERCIAL, INDUSTRIAL, or INSTITUTIONAL' }),
  }),
  houseNumber: z.string().trim().max(50, 'House number must be at most 50 characters').optional().nullable(),
  streetAddress: z.string().trim().min(3, 'Street address must be at least 3 characters').max(255),
  latitude: latitudeField,
  longitude: longitudeField,
  contactName: z.string().trim().min(2, 'Contact person name must be at least 2 characters').max(100),
  contactPhone: phoneSchema,
});
export type CreatePropertyDto = z.infer<typeof CreatePropertySchema>;

export const UpdatePropertySchema = z
  .object({
    wardId: z.string().uuid('Invalid ward UUID format').optional(),
    zoneId: z.string().uuid('Invalid zone UUID format').optional().nullable(),
    propertyType: z.nativeEnum(PropertyType).optional(),
    houseNumber: z.string().trim().max(50).optional().nullable(),
    streetAddress: z.string().trim().min(3).max(255).optional(),
    latitude: latitudeField.optional(),
    longitude: longitudeField.optional(),
    contactName: z.string().trim().min(2).max(100).optional(),
    contactPhone: phoneSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
export type UpdatePropertyDto = z.infer<typeof UpdatePropertySchema>;

export const UpdatePropertyStatusSchema = z.object({
  status: z.nativeEnum(PropertyStatus, {
    errorMap: () => ({ message: 'Invalid status. Must be PENDING_VERIFICATION, ACTIVE, or INACTIVE' }),
  }),
});
export type UpdatePropertyStatusDto = z.infer<typeof UpdatePropertyStatusSchema>;

export const PropertyQuerySchema = z.object({
  wardId: z.string().uuid('Invalid ward UUID').optional(),
  zoneId: z.string().uuid('Invalid zone UUID').optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PropertyQueryDto = z.infer<typeof PropertyQuerySchema>;


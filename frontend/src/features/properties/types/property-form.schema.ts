import { z } from 'zod';

export const NEPAL_PHONE_REGEX = /^(?:\+977)?(?:0\d{1,2}\d{6,7}|(?:98|97|96)\d{8})$/;

export const propertyFormSchema = z.object({
  wardId: z.string().min(1, 'Please select your municipal ward'),
  zoneId: z.string().optional().nullable(),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL'] as const),
  houseNumber: z.string().trim().max(50).optional().nullable(),
  streetAddress: z.string().trim().min(3, 'Street address must be at least 3 characters').max(255),
  latitude: z
    .number({ invalid_type_error: 'Latitude is required' })
    .min(26.0, 'Invalid latitude for Nepal')
    .max(31.0, 'Invalid latitude for Nepal'),
  longitude: z
    .number({ invalid_type_error: 'Longitude is required' })
    .min(80.0, 'Invalid longitude for Nepal')
    .max(89.0, 'Invalid longitude for Nepal'),
  contactName: z.string().trim().min(2, 'Contact person name must be at least 2 characters').max(100),
  contactPhone: z
    .string()
    .trim()
    .regex(NEPAL_PHONE_REGEX, 'Must be a valid Nepali mobile or landline number'),
});

export type PropertyFormData = z.infer<typeof propertyFormSchema>;


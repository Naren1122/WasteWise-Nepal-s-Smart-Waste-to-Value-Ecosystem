import { z } from 'zod';
import { VehicleType, VehicleStatus } from '@prisma/client';

export const CreateVehicleSchema = z.object({
  registrationNo: z
    .string({ required_error: 'Vehicle registration number is required' })
    .trim()
    .min(3, 'Registration number must be at least 3 characters')
    .max(50, 'Registration number cannot exceed 50 characters')
    .regex(/^[A-Z0-9\s-]+$/i, 'Registration number must contain only letters, numbers, hyphens, and spaces')
    .transform((val) => val.toUpperCase()),
  vehicleType: z.nativeEnum(VehicleType, {
    errorMap: () => ({ message: 'Invalid vehicle type' }),
  }),
  capacityKg: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .positive('Capacity must be greater than 0 kg')
    .max(50000, 'Capacity cannot exceed 50,000 kg'),
  fuelType: z
    .enum(['DIESEL', 'ELECTRIC', 'PETROL', 'CNG', 'HYBRID', 'OTHER'], {
      errorMap: () => ({ message: 'Invalid fuel type stream' }),
    })
    .optional()
    .nullable(),
  assignedDriverId: z
    .string()
    .uuid('Invalid driver ID format')
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(255, 'Notes cannot exceed 255 characters')
    .optional()
    .nullable(),
});

export const UpdateVehicleSchema = z.object({
  registrationNo: z
    .string()
    .trim()
    .min(3, 'Registration number must be at least 3 characters')
    .max(50, 'Registration number cannot exceed 50 characters')
    .regex(/^[A-Z0-9\s-]+$/i, 'Registration number must contain only letters, numbers, hyphens, and spaces')
    .transform((val) => val.toUpperCase())
    .optional(),
  vehicleType: z.nativeEnum(VehicleType).optional(),
  capacityKg: z
    .number()
    .positive('Capacity must be greater than 0 kg')
    .max(50000, 'Capacity cannot exceed 50,000 kg')
    .optional(),
  fuelType: z
    .enum(['DIESEL', 'ELECTRIC', 'PETROL', 'CNG', 'HYBRID', 'OTHER'])
    .optional()
    .nullable(),
  status: z.nativeEnum(VehicleStatus, {
    errorMap: () => ({ message: 'Invalid vehicle operational status' }),
  }).optional(),
  assignedDriverId: z
    .string()
    .uuid('Invalid driver ID format')
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(255, 'Notes cannot exceed 255 characters')
    .optional()
    .nullable(),
});

export const VehicleFilterSchema = z.object({
  vehicleType: z.nativeEnum(VehicleType).optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  assignedDriverId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const AssignDriverSchema = z.object({
  driverId: z
    .string()
    .uuid('Invalid driver ID format')
    .nullable(),
});

export type CreateVehicleInput = z.input<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.input<typeof UpdateVehicleSchema>;
export type VehicleFilterInput = z.infer<typeof VehicleFilterSchema>;
export type AssignDriverInput = z.infer<typeof AssignDriverSchema>;


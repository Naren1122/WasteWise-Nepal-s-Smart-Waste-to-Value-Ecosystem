import { z } from 'zod';

export const VEHICLE_TYPES = [
  'COMPACTOR',
  'TIPPER',
  'TRUCK',
  'TRACTOR',
  'ELECTRIC_CART',
] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_STATUSES = [
  'AVAILABLE',
  'ON_ROUTE',
  'MAINTENANCE',
  'RETIRED',
] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const FUEL_TYPES = [
  'DIESEL',
  'ELECTRIC',
  'PETROL',
  'CNG',
  'HYBRID',
  'OTHER',
] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export interface DriverSummary {
  id: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface Vehicle {
  id: string;
  tenantId: string;
  registrationNo: string;
  vehicleType: VehicleType;
  capacityKg: number;
  fuelType: FuelType | null;
  status: VehicleStatus;
  assignedDriverId: string | null;
  assignedDriver?: DriverSummary | null;
  routesCount?: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createVehicleSchema = z.object({
  registrationNo: z
    .string()
    .trim()
    .min(3, 'Registration number must be at least 3 characters')
    .max(50, 'Registration number cannot exceed 50 characters')
    .regex(/^[A-Z0-9\s-]+$/i, 'Only alphanumeric characters, hyphens, and spaces allowed')
    .transform((val) => val.toUpperCase()),
  vehicleType: z.enum(VEHICLE_TYPES, {
    errorMap: () => ({ message: 'Please select a valid vehicle type' }),
  }),
  capacityKg: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .positive('Capacity must be greater than 0 kg')
    .max(50000, 'Capacity cannot exceed 50,000 kg'),
  fuelType: z.enum(FUEL_TYPES).optional().nullable(),
  assignedDriverId: z.string().uuid('Invalid driver ID format').optional().nullable(),
  notes: z.string().trim().max(255, 'Notes cannot exceed 255 characters').optional().nullable(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.enum(VEHICLE_STATUSES).optional(),
});

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

export interface VehicleFilterParams {
  vehicleType?: VehicleType;
  status?: VehicleStatus;
  assignedDriverId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedVehiclesData {
  vehicles: Vehicle[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


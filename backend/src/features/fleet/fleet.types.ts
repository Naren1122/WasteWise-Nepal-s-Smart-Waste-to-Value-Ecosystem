import type { Prisma } from '@prisma/client';
import { VehicleType, VehicleStatus, Role } from '@prisma/client';

export { VehicleType, VehicleStatus, Role };

export interface DriverSummaryDto {
  id: string;
  fullName: string;
  phone: string;
  email: string;
}

export type VehicleWithRelations = Prisma.VehicleGetPayload<{
  include: {
    assignedDriver: {
      select: {
        id: true;
        fullName: true;
        phone: true;
        email: true;
      };
    };
    _count: {
      select: { routes: true };
    };
  };
}>;

export interface VehicleDto {
  id: string;
  tenantId: string;
  registrationNo: string;
  vehicleType: VehicleType;
  capacityKg: number;
  fuelType: string | null;
  status: VehicleStatus;
  assignedDriverId: string | null;
  assignedDriver?: DriverSummaryDto | null;
  routesCount?: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleData {
  tenantId: string;
  registrationNo: string;
  vehicleType: VehicleType;
  capacityKg: number;
  fuelType?: string | null;
  assignedDriverId?: string | null;
  notes?: string | null;
}

export interface UpdateVehicleData {
  registrationNo?: string;
  vehicleType?: VehicleType;
  capacityKg?: number;
  fuelType?: string | null;
  status?: VehicleStatus;
  assignedDriverId?: string | null;
  notes?: string | null;
}

export interface VehicleFilterParams {
  vehicleType?: VehicleType;
  status?: VehicleStatus;
  assignedDriverId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface IFleetRepository {
  createVehicle(data: CreateVehicleData): Promise<VehicleWithRelations>;
  findVehicleById(tenantId: string, id: string): Promise<VehicleWithRelations | null>;
  findVehicleByRegNo(tenantId: string, registrationNo: string): Promise<VehicleWithRelations | null>;
  findVehicles(
    tenantId: string,
    filter: VehicleFilterParams
  ): Promise<{ vehicles: VehicleWithRelations[]; totalCount: number }>;
  updateVehicle(tenantId: string, id: string, data: UpdateVehicleData): Promise<VehicleWithRelations>;
  deleteVehicle(tenantId: string, id: string): Promise<void>;
  findEligibleDrivers(tenantId: string): Promise<DriverSummaryDto[]>;
}



import { FleetRepository } from './fleet.repository.js';
import type {
  IFleetRepository,
  VehicleDto,
  VehicleFilterParams,
  VehicleWithRelations,
  DriverSummaryDto,
  UpdateVehicleData,
} from './fleet.types.js';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from './fleet.schema.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../shared/errors/app-error.js';

export class FleetService {
  constructor(private readonly repo: IFleetRepository = new FleetRepository()) {}

  public async createVehicle(tenantId: string, dto: CreateVehicleInput): Promise<VehicleDto> {
    const existing = await this.repo.findVehicleByRegNo(tenantId, dto.registrationNo);
    if (existing) {
      throw new ConflictError(`Vehicle with registration '${dto.registrationNo}' already exists`);
    }

    if (dto.assignedDriverId) {
      await this.assertDriverEligible(tenantId, dto.assignedDriverId);
    }

    const vehicle = await this.repo.createVehicle({
      tenantId,
      registrationNo: dto.registrationNo,
      vehicleType: dto.vehicleType,
      capacityKg: dto.capacityKg,
      fuelType: dto.fuelType ?? null,
      assignedDriverId: dto.assignedDriverId ?? null,
      notes: dto.notes ?? null,
    });

    return this.toDto(vehicle);
  }

  public async getVehicleById(tenantId: string, id: string): Promise<VehicleDto> {
    const vehicle = await this.repo.findVehicleById(tenantId, id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle', id);
    }
    return this.toDto(vehicle);
  }

  public async getVehicles(
    tenantId: string,
    filter: VehicleFilterParams
  ): Promise<{ items: VehicleDto[]; totalCount: number; page: number; pageSize: number }> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 8;

    const { vehicles, totalCount } = await this.repo.findVehicles(tenantId, {
      ...filter,
      page,
      pageSize,
    });

    return {
      items: vehicles.map((v) => this.toDto(v)),
      totalCount,
      page,
      pageSize,
    };
  }

  public async updateVehicle(
    tenantId: string,
    id: string,
    dto: UpdateVehicleInput
  ): Promise<VehicleDto> {
    const existing = await this.repo.findVehicleById(tenantId, id);
    if (!existing) {
      throw new NotFoundError('Vehicle', id);
    }

    if (dto.registrationNo && dto.registrationNo !== existing.registrationNo) {
      const duplicate = await this.repo.findVehicleByRegNo(tenantId, dto.registrationNo);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(`Vehicle with registration '${dto.registrationNo}' already exists`);
      }
    }

    if (dto.assignedDriverId && dto.assignedDriverId !== existing.assignedDriverId) {
      await this.assertDriverEligible(tenantId, dto.assignedDriverId);
    }

    const updateData: UpdateVehicleData = {};
    if (dto.registrationNo !== undefined) updateData.registrationNo = dto.registrationNo;
    if (dto.vehicleType !== undefined) updateData.vehicleType = dto.vehicleType;
    if (dto.capacityKg !== undefined) updateData.capacityKg = dto.capacityKg;
    if (dto.fuelType !== undefined) updateData.fuelType = dto.fuelType;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.assignedDriverId !== undefined) updateData.assignedDriverId = dto.assignedDriverId;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.repo.updateVehicle(tenantId, id, updateData);
    return this.toDto(updated);
  }

  public async deleteVehicle(tenantId: string, id: string): Promise<void> {
    const vehicle = await this.repo.findVehicleById(tenantId, id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle', id);
    }

    if (vehicle._count && vehicle._count.routes > 0) {
      throw new ConflictError(
        'Cannot delete vehicle with route dispatch history. Update vehicle status to RETIRED instead.'
      );
    }

    await this.repo.deleteVehicle(tenantId, id);
  }

  public async getEligibleDrivers(tenantId: string): Promise<DriverSummaryDto[]> {
    return this.repo.findEligibleDrivers(tenantId);
  }

  private async assertDriverEligible(tenantId: string, driverId: string): Promise<void> {
    const eligibleDrivers = await this.repo.findEligibleDrivers(tenantId);
    const isEligible = eligibleDrivers.some((d) => d.id === driverId);
    if (!isEligible) {
      throw new ValidationError({
        assignedDriverId: ['Assigned driver must be an active staff member with DRIVER or FIELD_WORKER role'],
      });
    }
  }

  private toDto(v: VehicleWithRelations): VehicleDto {
    return {
      id: v.id,
      tenantId: v.tenantId,
      registrationNo: v.registrationNo,
      vehicleType: v.vehicleType,
      capacityKg: v.capacityKg,
      fuelType: v.fuelType,
      status: v.status,
      assignedDriverId: v.assignedDriverId,
      assignedDriver: v.assignedDriver
        ? {
            id: v.assignedDriver.id,
            fullName: v.assignedDriver.fullName,
            phone: v.assignedDriver.phone,
            email: v.assignedDriver.email,
          }
        : null,
      routesCount: v._count?.routes ?? 0,
      notes: v.notes,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    };
  }
}

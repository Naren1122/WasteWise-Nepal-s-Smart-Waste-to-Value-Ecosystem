import { prisma } from '../../shared/database/prisma.service.js';
import type { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';
import type {
  IFleetRepository,
  CreateVehicleData,
  UpdateVehicleData,
  VehicleFilterParams,
  VehicleWithRelations,
  DriverSummaryDto,
} from './fleet.types.js';

const vehicleInclude = {
  assignedDriver: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      photoUrl: true,
      age: true,
    },
  },
  _count: {
    select: { routes: true },
  },
} as const;

export class FleetRepository implements IFleetRepository {
  public async createVehicle(data: CreateVehicleData): Promise<VehicleWithRelations> {
    return prisma.vehicle.create({
      data: {
        tenantId: data.tenantId,
        registrationNo: data.registrationNo,
        vehicleType: data.vehicleType,
        capacityKg: data.capacityKg,
        fuelType: data.fuelType ?? null,
        assignedDriverId: data.assignedDriverId ?? null,
        notes: data.notes ?? null,
      },
      include: vehicleInclude,
    });
  }

  public async findVehicleById(tenantId: string, id: string): Promise<VehicleWithRelations | null> {
    return prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: vehicleInclude,
    });
  }

  public async findVehicleByRegNo(tenantId: string, registrationNo: string): Promise<VehicleWithRelations | null> {
    return prisma.vehicle.findFirst({
      where: { tenantId, registrationNo },
      include: vehicleInclude,
    });
  }

  public async findVehicles(
    tenantId: string,
    filter: VehicleFilterParams
  ): Promise<{ vehicles: VehicleWithRelations[]; totalCount: number }> {
    const where: Prisma.VehicleWhereInput = { tenantId };

    if (filter.vehicleType) where.vehicleType = filter.vehicleType;
    if (filter.status) where.status = filter.status;
    if (filter.assignedDriverId) where.assignedDriverId = filter.assignedDriverId;
    if (filter.search) {
      where.OR = [
        { registrationNo: { contains: filter.search, mode: 'insensitive' } },
        { notes: { contains: filter.search, mode: 'insensitive' } },
        {
          assignedDriver: {
            fullName: { contains: filter.search, mode: 'insensitive' },
          },
        },
        {
          assignedDriver: {
            phone: { contains: filter.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 8;

    const [vehicles, totalCount] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: vehicleInclude,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { vehicles, totalCount };
  }

  public async updateVehicle(
    tenantId: string,
    id: string,
    data: UpdateVehicleData
  ): Promise<VehicleWithRelations> {
    return prisma.vehicle.update({
      where: { id, tenantId },
      data: {
        ...(data.registrationNo !== undefined && { registrationNo: data.registrationNo }),
        ...(data.vehicleType !== undefined && { vehicleType: data.vehicleType }),
        ...(data.capacityKg !== undefined && { capacityKg: data.capacityKg }),
        ...(data.fuelType !== undefined && { fuelType: data.fuelType }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.assignedDriverId !== undefined && { assignedDriverId: data.assignedDriverId }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: vehicleInclude,
    });
  }

  public async deleteVehicle(tenantId: string, id: string): Promise<void> {
    await prisma.vehicle.delete({
      where: { id, tenantId },
    });
  }

  public async findEligibleDrivers(tenantId: string): Promise<DriverSummaryDto[]> {
    return prisma.user.findMany({
      where: {
        tenantId,
        role: { in: [Role.DRIVER, Role.FIELD_WORKER] },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        photoUrl: true,
        age: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }
}


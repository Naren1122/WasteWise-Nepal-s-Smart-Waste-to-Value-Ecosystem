import { prisma } from '../../shared/database/prisma.service.js';
import type { Prisma } from '@prisma/client';
import type {
  ISchedulesRepository,
  CreateCollectionScheduleData,
  UpdateCollectionScheduleData,
  CollectionScheduleWithRelations,
  ScheduledPickupWithRelations,
  PickupStatus,
  WasteType,
} from './schedules.types.js';

const scheduleInclude = {
  ward: { select: { wardNumber: true, officeAddress: true } },
  zone: { select: { id: true, name: true, code: true } },
} as const;

const pickupInclude = {
  ward: { select: { wardNumber: true } },
  property: {
    select: {
      id: true,
      streetAddress: true,
      houseNumber: true,
      propertyType: true,
      latitude: true,
      longitude: true,
    },
  },
} as const;

export class SchedulesRepository implements ISchedulesRepository {
  public async createSchedule(data: CreateCollectionScheduleData): Promise<CollectionScheduleWithRelations> {
    return prisma.collectionSchedule.create({
      data: {
        tenantId: data.tenantId,
        wardId: data.wardId,
        zoneId: data.zoneId ?? null,
        wasteType: data.wasteType,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive ?? true,
      },
      include: scheduleInclude,
    });
  }

  public async findScheduleById(tenantId: string, id: string): Promise<CollectionScheduleWithRelations | null> {
    return prisma.collectionSchedule.findFirst({
      where: { id, tenantId },
      include: scheduleInclude,
    });
  }

  public async findSchedulesByWard(tenantId: string, wardId: string): Promise<CollectionScheduleWithRelations[]> {
    return prisma.collectionSchedule.findMany({
      where: { tenantId, wardId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: scheduleInclude,
    });
  }

  public async findAllActiveSchedules(
    tenantId: string,
    dayOfWeek?: number
  ): Promise<CollectionScheduleWithRelations[]> {
    const where: Prisma.CollectionScheduleWhereInput = {
      tenantId,
      isActive: true,
      ...(dayOfWeek !== undefined ? { dayOfWeek } : {}),
    };

    return prisma.collectionSchedule.findMany({
      where,
      orderBy: [{ wardId: 'asc' }, { startTime: 'asc' }],
      include: scheduleInclude,
    });
  }

  public async updateSchedule(
    tenantId: string,
    id: string,
    data: UpdateCollectionScheduleData
  ): Promise<CollectionScheduleWithRelations> {
    return prisma.collectionSchedule.update({
      where: { id, tenantId },
      data: {
        ...(data.wasteType !== undefined && { wasteType: data.wasteType }),
        ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: scheduleInclude,
    });
  }

  public async deleteSchedule(tenantId: string, id: string): Promise<void> {
    await prisma.collectionSchedule.delete({
      where: { id, tenantId },
    });
  }

  public async createBatchPickups(
    tenantId: string,
    pickups: Array<{
      tenantId: string;
      wardId: string;
      propertyId?: string | null;
      scheduleId?: string | null;
      pickupDate: Date;
      wasteType: WasteType;
      status: PickupStatus;
    }>
  ): Promise<number> {
    const result = await prisma.scheduledPickup.createMany({
      data: pickups,
    });
    return result.count;
  }

  public async findExistingPickupsCount(
    tenantId: string,
    wardId: string,
    pickupDate: Date
  ): Promise<number> {
    const startOfDay = new Date(pickupDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(pickupDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return prisma.scheduledPickup.count({
      where: {
        tenantId,
        wardId,
        pickupDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }

  public async findPickupsByDateRange(
    tenantId: string,
    wardId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<ScheduledPickupWithRelations[]> {
    return prisma.scheduledPickup.findMany({
      where: {
        tenantId,
        ...(wardId ? { wardId } : {}),
        pickupDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ pickupDate: 'asc' }, { wardId: 'asc' }],
      include: pickupInclude,
    });
  }
}

import type { Prisma } from '@prisma/client';
import { WasteType, PickupStatus } from '@prisma/client';

export { WasteType, PickupStatus };

export type CollectionScheduleWithRelations = Prisma.CollectionScheduleGetPayload<{
  include: {
    ward: { select: { wardNumber: true; officeAddress: true } };
    zone: { select: { id: true; name: true; code: true } };
  };
}>;

export type ScheduledPickupWithRelations = Prisma.ScheduledPickupGetPayload<{
  include: {
    ward: { select: { wardNumber: true } };
    property: {
      select: {
        id: true;
        streetAddress: true;
        houseNumber: true;
        propertyType: true;
        latitude: true;
        longitude: true;
      };
    };
  };
}>;

export interface CollectionScheduleDto {
  id: string;
  tenantId: string;
  wardId: string;
  wardNumber: number;
  zoneId: string | null;
  zoneName: string | null;
  wasteType: WasteType;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCollectionScheduleData {
  tenantId: string;
  wardId: string;
  zoneId?: string | null;
  wasteType: WasteType;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface UpdateCollectionScheduleData {
  wasteType?: WasteType | undefined;
  dayOfWeek?: number | undefined;
  startTime?: string | undefined;
  endTime?: string | undefined;
  isActive?: boolean | undefined;
}

export interface ScheduledPickupDto {
  id: string;
  tenantId: string;
  wardId: string;
  wardNumber: number;
  propertyId: string | null;
  propertyAddress: string | null;
  scheduleId: string | null;
  pickupDate: Date;
  wasteType: WasteType;
  status: PickupStatus;
  notes: string | null;
  createdAt: Date;
}

export interface GeneratePickupsOptions {
  tenantId: string;
  wardId?: string;
  targetDate: Date;
}

export interface ISchedulesRepository {
  createSchedule(data: CreateCollectionScheduleData): Promise<CollectionScheduleWithRelations>;
  findScheduleById(tenantId: string, id: string): Promise<CollectionScheduleWithRelations | null>;
  findSchedulesByWard(tenantId: string, wardId: string): Promise<CollectionScheduleWithRelations[]>;
  findAllActiveSchedules(tenantId: string, dayOfWeek?: number): Promise<CollectionScheduleWithRelations[]>;
  updateSchedule(tenantId: string, id: string, data: UpdateCollectionScheduleData): Promise<CollectionScheduleWithRelations>;
  deleteSchedule(tenantId: string, id: string): Promise<void>;
  createBatchPickups(tenantId: string, pickups: Array<{
    tenantId: string;
    wardId: string;
    propertyId?: string | null;
    scheduleId?: string | null;
    pickupDate: Date;
    wasteType: WasteType;
    status: PickupStatus;
  }>): Promise<number>;
  findPickupsByDateRange(tenantId: string, wardId: string | undefined, startDate: Date, endDate: Date): Promise<ScheduledPickupWithRelations[]>;
  findExistingPickupsCount(tenantId: string, wardId: string, pickupDate: Date): Promise<number>;
}

import { SchedulesRepository } from './schedules.repository.js';
import { WardRepository } from '../wards/wards.repository.js';
import { PropertyRepository } from '../properties/properties.repository.js';
import type {
  ISchedulesRepository,
  CollectionScheduleDto,
  ScheduledPickupDto,
  CollectionScheduleWithRelations,
  ScheduledPickupWithRelations,
} from './schedules.types.js';
import type {
  CreateCollectionScheduleInput,
  UpdateCollectionScheduleInput,
  GeneratePickupsInput,
  CalendarQueryInput,
} from './schedules.schema.js';
import { NotFoundError, ConflictError } from '../../shared/errors/app-error.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export class SchedulesService {
  constructor(
    private readonly repo: ISchedulesRepository = new SchedulesRepository(),
    private readonly wardRepo = new WardRepository(),
    private readonly propertyRepo = new PropertyRepository()
  ) {}

  public async createSchedule(tenantId: string, dto: CreateCollectionScheduleInput): Promise<CollectionScheduleDto> {
    const ward = await this.wardRepo.findWardById(tenantId, dto.wardId);
    if (!ward) throw new NotFoundError('Ward in municipality', dto.wardId);

    const existing = await this.repo.findSchedulesByWard(tenantId, dto.wardId);
    const hasDuplicate = existing.some(
      (s) => s.dayOfWeek === dto.dayOfWeek && s.wasteType === dto.wasteType && s.isActive
    );
    if (hasDuplicate) {
      throw new ConflictError(
        `Active schedule for ${dto.wasteType} on ${DAYS_OF_WEEK[dto.dayOfWeek]} already exists for Ward ${ward.wardNumber}`
      );
    }

    const schedule = await this.repo.createSchedule({
      tenantId,
      wardId: dto.wardId,
      zoneId: dto.zoneId ?? null,
      wasteType: dto.wasteType,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      isActive: dto.isActive ?? true,
    });

    return this.toScheduleDto(schedule);
  }

  public async listSchedules(tenantId: string, wardId?: string): Promise<CollectionScheduleDto[]> {
    if (wardId) {
      const ward = await this.wardRepo.findWardById(tenantId, wardId);
      if (!ward) throw new NotFoundError('Ward in municipality', wardId);
    }
    const schedules = await this.repo.findSchedules(tenantId, wardId);
    return schedules.map((s) => this.toScheduleDto(s));
  }

  public async getSchedulesByWard(tenantId: string, wardId: string): Promise<CollectionScheduleDto[]> {
    const ward = await this.wardRepo.findWardById(tenantId, wardId);
    if (!ward) throw new NotFoundError('Ward in municipality', wardId);

    const schedules = await this.repo.findSchedulesByWard(tenantId, wardId);
    return schedules.map((s) => this.toScheduleDto(s));
  }

  public async updateSchedule(
    tenantId: string,
    id: string,
    dto: UpdateCollectionScheduleInput
  ): Promise<CollectionScheduleDto> {
    const existing = await this.repo.findScheduleById(tenantId, id);
    if (!existing) throw new NotFoundError('Collection schedule', id);

    const updated = await this.repo.updateSchedule(tenantId, id, dto);
    return this.toScheduleDto(updated);
  }

  public async deleteSchedule(tenantId: string, id: string): Promise<void> {
    const existing = await this.repo.findScheduleById(tenantId, id);
    if (!existing) throw new NotFoundError('Collection schedule', id);

    await this.repo.deleteSchedule(tenantId, id);
  }

  public async generateDailyPickups(
    tenantId: string,
    dto: GeneratePickupsInput
  ): Promise<{ generatedCount: number; message: string }> {
    const dayOfWeek = dto.targetDate.getUTCDay();
    const schedules = await this.repo.findAllActiveSchedules(tenantId, dayOfWeek);
    const filteredSchedules = dto.wardId
      ? schedules.filter((s) => s.wardId === dto.wardId)
      : schedules;

    if (filteredSchedules.length === 0) {
      return { generatedCount: 0, message: `No active pickup rules found for ${DAYS_OF_WEEK[dayOfWeek]}` };
    }

    let totalCreated = 0;
    for (const schedule of filteredSchedules) {
      const alreadyGenerated = await this.repo.findExistingPickupsCount(
        tenantId,
        schedule.wardId,
        dto.targetDate
      );
      if (alreadyGenerated > 0) continue;

      const { properties } = await this.propertyRepo.findProperties(tenantId, {
        wardId: schedule.wardId,
        status: 'ACTIVE',
        pageSize: 100,
      });

      const records = properties.map((prop) => ({
        tenantId,
        wardId: schedule.wardId,
        propertyId: prop.id,
        scheduleId: schedule.id,
        pickupDate: dto.targetDate,
        wasteType: schedule.wasteType,
        status: 'SCHEDULED' as const,
      }));

      if (records.length > 0) {
        const count = await this.repo.createBatchPickups(tenantId, records);
        totalCreated += count;
      }
    }

    return {
      generatedCount: totalCreated,
      message: `Successfully generated ${totalCreated} scheduled pickups for ${DAYS_OF_WEEK[dayOfWeek]}`,
    };
  }

  public async getCalendarPickups(
    tenantId: string,
    query: CalendarQueryInput
  ): Promise<ScheduledPickupDto[]> {
    const pickups = await this.repo.findPickupsByDateRange(
      tenantId,
      query.wardId,
      query.startDate,
      query.endDate
    );
    return pickups.map((p) => this.toPickupDto(p));
  }

  private toScheduleDto(s: CollectionScheduleWithRelations): CollectionScheduleDto {
    return {
      id: s.id,
      tenantId: s.tenantId,
      wardId: s.wardId,
      wardNumber: s.ward.wardNumber,
      zoneId: s.zoneId,
      zoneName: s.zone?.name ?? null,
      wasteType: s.wasteType,
      dayOfWeek: s.dayOfWeek,
      dayName: DAYS_OF_WEEK[s.dayOfWeek] ?? 'Unknown',
      startTime: s.startTime,
      endTime: s.endTime,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  private toPickupDto(p: ScheduledPickupWithRelations): ScheduledPickupDto {
    return {
      id: p.id,
      tenantId: p.tenantId,
      wardId: p.wardId,
      wardNumber: p.ward.wardNumber,
      propertyId: p.propertyId,
      propertyAddress: p.property ? `${p.property.houseNumber ?? ''} ${p.property.streetAddress}`.trim() : null,
      scheduleId: p.scheduleId,
      pickupDate: p.pickupDate,
      wasteType: p.wasteType,
      status: p.status,
      notes: p.notes,
      createdAt: p.createdAt,
    };
  }
}

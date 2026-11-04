import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchedulesService } from '../schedules.service.js';
import type { ISchedulesRepository } from '../schedules.types.js';
import type { IWardRepository } from '../../wards/wards.types.js';
import type { IPropertyRepository } from '../../properties/properties.types.js';
import { WasteType, PropertyType } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../../shared/errors/app-error.js';

describe('SchedulesService', () => {
  let mockRepo: ISchedulesRepository;
  let mockWardRepo: IWardRepository;
  let mockPropertyRepo: IPropertyRepository;
  let service: SchedulesService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const wardId = '00000000-0000-0000-0000-000000000002';

  const mockWard = {
    id: wardId,
    tenantId,
    wardNumber: 4,
    officeAddress: 'Baluwatar, Kathmandu',
    contactPhone: '+977-01-4435678',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { users: 0, serviceZones: 0, properties: 5 },
  };

  const mockSchedule = {
    id: 'sched-01',
    tenantId,
    wardId,
    zoneId: null,
    wasteType: WasteType.ORGANIC,
    dayOfWeek: 0, // Sunday
    startTime: '07:00',
    endTime: '10:00',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ward: { wardNumber: 4, officeAddress: 'Baluwatar' },
    zone: null,
  };

  beforeEach(() => {
    mockRepo = {
      createSchedule: vi.fn(),
      findScheduleById: vi.fn(),
      findSchedulesByWard: vi.fn(),
      findAllActiveSchedules: vi.fn(),
      updateSchedule: vi.fn(),
      deleteSchedule: vi.fn(),
      createBatchPickups: vi.fn(),
      findPickupsByDateRange: vi.fn(),
      findExistingPickupsCount: vi.fn(),
    };

    mockWardRepo = {
      createWard: vi.fn(),
      findWardById: vi.fn(),
      findWardByNumber: vi.fn(),
      findAllWards: vi.fn(),
      updateWard: vi.fn(),
      deleteWard: vi.fn(),
    };

    mockPropertyRepo = {
      createProperty: vi.fn(),
      findPropertyById: vi.fn(),
      findPropertiesByUserId: vi.fn(),
      findProperties: vi.fn(),
      updateProperty: vi.fn(),
      deleteProperty: vi.fn(),
      verifyWardExists: vi.fn(),
      verifyZoneExists: vi.fn(),
    };

    service = new SchedulesService(mockRepo, mockWardRepo, mockPropertyRepo);
  });

  it('should create a collection schedule rule successfully', async () => {
    vi.mocked(mockWardRepo.findWardById).mockResolvedValue(mockWard);
    vi.mocked(mockRepo.findSchedulesByWard).mockResolvedValue([]);
    vi.mocked(mockRepo.createSchedule).mockResolvedValue(mockSchedule);

    const result = await service.createSchedule(tenantId, {
      wardId,
      wasteType: WasteType.ORGANIC,
      dayOfWeek: 0,
      startTime: '07:00',
      endTime: '10:00',
    });

    expect(result.dayName).toBe('Sunday');
    expect(result.wasteType).toBe(WasteType.ORGANIC);
    expect(mockRepo.createSchedule).toHaveBeenCalledOnce();
  });

  it('should throw ConflictError if active schedule for same ward, day and stream exists', async () => {
    vi.mocked(mockWardRepo.findWardById).mockResolvedValue(mockWard);
    vi.mocked(mockRepo.findSchedulesByWard).mockResolvedValue([mockSchedule]);

    await expect(
      service.createSchedule(tenantId, {
        wardId,
        wasteType: WasteType.ORGANIC,
        dayOfWeek: 0,
        startTime: '08:00',
        endTime: '11:00',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should generate daily pickups for matching weekday and active properties', async () => {
    // 2026-11-08 is a Sunday (UTC day 0)
    const targetDate = new Date('2026-11-08T00:00:00.000Z');

    vi.mocked(mockRepo.findAllActiveSchedules).mockResolvedValue([mockSchedule]);
    vi.mocked(mockRepo.findExistingPickupsCount).mockResolvedValue(0);
    vi.mocked(mockPropertyRepo.findProperties).mockResolvedValue({
      properties: [
        {
          id: 'prop-1',
          tenantId,
          wardId,
          zoneId: null,
          userId: 'u-1',
          propertyType: PropertyType.RESIDENTIAL,
          status: 'ACTIVE',
          houseNumber: '1',
          streetAddress: 'Street 1',
          latitude: 27.7,
          longitude: 85.3,
          qrCode: null,
          contactName: 'User 1',
          contactPhone: '9800000001',
          createdAt: new Date(),
          updatedAt: new Date(),
          ward: { wardNumber: 4 },
          zone: null,
        },
      ],
      totalCount: 1,
    });
    vi.mocked(mockRepo.createBatchPickups).mockResolvedValue(1);

    const result = await service.generateDailyPickups(tenantId, { targetDate });

    expect(result.generatedCount).toBe(1);
    expect(mockRepo.createBatchPickups).toHaveBeenCalledOnce();
  });

  it('should skip duplicate generation if manifest already generated for that day', async () => {
    const targetDate = new Date('2026-11-08T00:00:00.000Z');

    vi.mocked(mockRepo.findAllActiveSchedules).mockResolvedValue([mockSchedule]);
    vi.mocked(mockRepo.findExistingPickupsCount).mockResolvedValue(10); // already generated

    const result = await service.generateDailyPickups(tenantId, { targetDate });

    expect(result.generatedCount).toBe(0);
    expect(mockRepo.createBatchPickups).not.toHaveBeenCalled();
  });
});

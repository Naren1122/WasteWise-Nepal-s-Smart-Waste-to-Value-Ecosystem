import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoutesService } from '../routes.service.js';
import type { IRoutesRepository, RouteWithRelations, RouteStopWithRelations } from '../routes.types.js';
import { RouteStatus, StopStatus, WasteType, VehicleType } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../../shared/errors/app-error.js';

describe('RoutesService', () => {
  let mockRepo: IRoutesRepository;
  let service: RoutesService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const wardId = '00000000-0000-0000-0000-000000000002';
  const routeId = '00000000-0000-0000-0000-000000000003';
  const stopId = '00000000-0000-0000-0000-000000000004';
  const driverId = '00000000-0000-0000-0000-000000000005';
  const vehicleId = '00000000-0000-0000-0000-000000000006';

  const mockRoute: RouteWithRelations = {
    id: routeId,
    tenantId,
    wardId,
    zoneId: null,
    vehicleId,
    driverId,
    routeDate: new Date('2026-11-05'),
    wasteType: WasteType.ORGANIC,
    status: RouteStatus.DRAFT,
    startTime: null,
    endTime: null,
    notes: 'Morning organic route',
    createdAt: new Date(),
    updatedAt: new Date(),
    ward: { id: wardId, wardNumber: 1 },
    zone: null,
    vehicle: { id: vehicleId, registrationNo: 'BA 1 JA 1234', vehicleType: VehicleType.COMPACTOR },
    driver: { id: driverId, fullName: 'Ram Bahadur', phone: '+9779851000003' },
    stops: [
      {
        id: stopId,
        tenantId,
        routeId,
        sequenceOrder: 1,
        propertyId: '00000000-0000-0000-0000-000000000007',
        bulkyRequestId: null,
        status: StopStatus.PENDING,
        failureReason: null,
        proofPhotoUrl: null,
        latitude: 27.7172,
        longitude: 85.324,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        property: {
          id: '00000000-0000-0000-0000-000000000007',
          streetAddress: 'Baluwatar Marg',
          houseNumber: '12B',
          latitude: 27.7172,
          longitude: 85.324,
        },
      },
    ],
  };

  const mockStop: RouteStopWithRelations = {
    ...mockRoute.stops[0]!,
    property: mockRoute.stops[0]!.property,
  };

  beforeEach(() => {
    mockRepo = {
      createRoute: vi.fn(),
      findRouteById: vi.fn(),
      findRoutes: vi.fn(),
      updateRoute: vi.fn(),
      findActiveDriverRoute: vi.fn(),
      findSubscribedPropertiesForWard: vi.fn(),
      findScheduledBulkyForWard: vi.fn(),
      createRouteStops: vi.fn(),
      updateRouteStop: vi.fn(),
      batchSyncRouteStops: vi.fn(),
    };
    service = new RoutesService(mockRepo);
  });

  describe('generateDailyRoute', () => {
    it('should throw ValidationError if no properties or bulky pickups exist', async () => {
      vi.mocked(mockRepo.findSubscribedPropertiesForWard).mockResolvedValue([]);
      vi.mocked(mockRepo.findScheduledBulkyForWard).mockResolvedValue([]);

      await expect(
        service.generateDailyRoute(tenantId, {
          wardId,
          routeDate: new Date('2026-11-05'),
          wasteType: WasteType.ORGANIC,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should generate route and sequence stops combining houses and bulky pickups', async () => {
      vi.mocked(mockRepo.findSubscribedPropertiesForWard).mockResolvedValue([
        { id: 'prop-1', streetAddress: 'Baluwatar', houseNumber: '12', latitude: 27.7, longitude: 85.3 },
      ]);
      vi.mocked(mockRepo.findScheduledBulkyForWard).mockResolvedValue([
        { id: 'bulky-1', propertyId: 'prop-2', property: { streetAddress: 'Naxal', houseNumber: '4', latitude: 27.71, longitude: 85.32 } },
      ]);
      vi.mocked(mockRepo.createRoute).mockResolvedValue(mockRoute);
      vi.mocked(mockRepo.createRouteStops).mockResolvedValue();
      vi.mocked(mockRepo.findRouteById).mockResolvedValue(mockRoute);

      const result = await service.generateDailyRoute(tenantId, {
        wardId,
        routeDate: new Date('2026-11-05'),
        wasteType: WasteType.ORGANIC,
      });

      expect(mockRepo.createRouteStops).toHaveBeenCalledWith(
        tenantId,
        routeId,
        expect.arrayContaining([
          expect.objectContaining({ sequenceOrder: 1, propertyId: 'prop-1' }),
          expect.objectContaining({ sequenceOrder: 2, bulkyRequestId: 'bulky-1' }),
        ])
      );
      expect(result.id).toBe(routeId);
    });
  });

  describe('updateRouteStatus', () => {
    it('should record startTime when status is set to IN_PROGRESS', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue(mockRoute);
      vi.mocked(mockRepo.updateRoute).mockResolvedValue({
        ...mockRoute,
        status: RouteStatus.IN_PROGRESS,
        startTime: new Date(),
      });

      const result = await service.updateRouteStatus(tenantId, routeId, {
        status: RouteStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(RouteStatus.IN_PROGRESS);
      expect(mockRepo.updateRoute).toHaveBeenCalledWith(
        tenantId,
        routeId,
        expect.objectContaining({ status: RouteStatus.IN_PROGRESS, startTime: expect.any(Date) })
      );
    });
  });

  describe('updateStopStatus', () => {
    it('should throw ValidationError if status is REJECTED without failureReason', async () => {
      await expect(
        service.updateStopStatus(tenantId, stopId, {
          status: StopStatus.REJECTED,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should update stop status when reason is provided', async () => {
      vi.mocked(mockRepo.updateRouteStop).mockResolvedValue({
        ...mockStop,
        status: StopStatus.REJECTED,
        failureReason: 'Contaminated with hazardous chemicals',
      });

      const result = await service.updateStopStatus(tenantId, stopId, {
        status: StopStatus.REJECTED,
        failureReason: 'Contaminated with hazardous chemicals',
      });

      expect(result.status).toBe(StopStatus.REJECTED);
      expect(result.failureReason).toBe('Contaminated with hazardous chemicals');
    });
  });

  describe('batchSyncOfflineStops', () => {
    it('should synchronize queued offline stops and return confirmation count', async () => {
      vi.mocked(mockRepo.batchSyncRouteStops).mockResolvedValue(5);

      const result = await service.batchSyncOfflineStops(tenantId, {
        updates: [
          { stopId: 'stop-1', status: StopStatus.COLLECTED, completedAt: new Date() },
          { stopId: 'stop-2', status: StopStatus.COLLECTED, completedAt: new Date() },
        ],
      });

      expect(result.syncedCount).toBe(5);
      expect(result.message).toContain('5 stops');
    });
  });
});


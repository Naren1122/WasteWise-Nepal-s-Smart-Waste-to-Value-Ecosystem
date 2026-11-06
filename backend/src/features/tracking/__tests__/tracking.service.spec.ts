import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingService } from '../tracking.service.js';
import type { ITrackingRepository } from '../tracking.types.js';
import { ForbiddenError } from '../../../shared/errors/app-error.js';

describe('TrackingService', () => {
  let mockRepo: ITrackingRepository;
  let service: TrackingService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const driverId = '00000000-0000-0000-0000-000000000002';
  const vehicleId = '00000000-0000-0000-0000-000000000003';
  const routeId = '00000000-0000-0000-0000-000000000004';

  beforeEach(() => {
    mockRepo = {
      recordLocation: vi.fn(),
      findLatestVehicleLocation: vi.fn(),
      findActiveFleetPositions: vi.fn(),
      findRouteBreadcrumbs: vi.fn(),
      verifyActiveRoute: vi.fn(),
    };
    service = new TrackingService(mockRepo);
  });

  describe('Shift-Boundary Guard', () => {
    it('should throw ForbiddenError when driver transmits GPS for an inactive or unassigned route', async () => {
      vi.mocked(mockRepo.verifyActiveRoute).mockResolvedValue(false);

      await expect(
        service.ingestLocation(tenantId, driverId, {
          vehicleId,
          routeId,
          latitude: 27.7172,
          longitude: 85.324,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(mockRepo.recordLocation).not.toHaveBeenCalled();
    });

    it('should allow transmission when route is confirmed active for the driver', async () => {
      vi.mocked(mockRepo.verifyActiveRoute).mockResolvedValue(true);
      vi.mocked(mockRepo.findLatestVehicleLocation).mockResolvedValue(null);
      vi.mocked(mockRepo.recordLocation).mockResolvedValue({
        id: 'loc-1',
        tenantId,
        vehicleId,
        routeId,
        driverId,
        latitude: 27.7172,
        longitude: 85.324,
        speedKmh: 35,
        headingDeg: 90,
        recordedAt: new Date(),
      });

      const result = await service.ingestLocation(tenantId, driverId, {
        vehicleId,
        routeId,
        latitude: 27.7172,
        longitude: 85.324,
        speedKmh: 35,
        headingDeg: 90,
      });

      expect(result.isThrottled).toBe(false);
      expect(result.telemetry.latitude).toBe(27.7172);
      expect(mockRepo.recordLocation).toHaveBeenCalledOnce();
    });
  });

  describe('10m / 30s Ingestion Throttling', () => {
    it('should throttle and skip database write when movement < 10m and < 30s elapsed', async () => {
      const now = new Date();
      vi.mocked(mockRepo.verifyActiveRoute).mockResolvedValue(true);
      vi.mocked(mockRepo.findLatestVehicleLocation).mockResolvedValue({
        id: 'loc-prev',
        tenantId,
        vehicleId,
        routeId,
        driverId,
        latitude: 27.7172,
        longitude: 85.324,
        speedKmh: 0,
        headingDeg: 0,
        recordedAt: new Date(now.getTime() - 10_000), // 10 seconds ago
      });

      // Jitter movement: ~2 meters
      const result = await service.ingestLocation(tenantId, driverId, {
        vehicleId,
        routeId,
        latitude: 27.71721,
        longitude: 85.32401,
        recordedAt: now.toISOString(),
      });

      expect(result.isThrottled).toBe(true);
      expect(mockRepo.recordLocation).not.toHaveBeenCalled();
    });

    it('should persist when vehicle moved more than 10 meters even if < 30s elapsed', async () => {
      const now = new Date();
      vi.mocked(mockRepo.verifyActiveRoute).mockResolvedValue(true);
      vi.mocked(mockRepo.findLatestVehicleLocation).mockResolvedValue({
        id: 'loc-prev',
        tenantId,
        vehicleId,
        routeId,
        driverId,
        latitude: 27.7172,
        longitude: 85.324,
        speedKmh: 0,
        headingDeg: 0,
        recordedAt: new Date(now.getTime() - 5_000), // 5 seconds ago
      });
      vi.mocked(mockRepo.recordLocation).mockResolvedValue({
        id: 'loc-2',
        tenantId,
        vehicleId,
        routeId,
        driverId,
        latitude: 27.7185,
        longitude: 85.3255,
        speedKmh: 30,
        headingDeg: 45,
        recordedAt: now,
      });

      // Significant movement: ~200 meters
      const result = await service.ingestLocation(tenantId, driverId, {
        vehicleId,
        routeId,
        latitude: 27.7185,
        longitude: 85.3255,
        recordedAt: now.toISOString(),
      });

      expect(result.isThrottled).toBe(false);
      expect(mockRepo.recordLocation).toHaveBeenCalledOnce();
    });
  });

  describe('Fleet Positions & Breadcrumbs Queries', () => {
    it('should query active fleet positions via repository', async () => {
      vi.mocked(mockRepo.findActiveFleetPositions).mockResolvedValue([
        {
          status: 'ON_ROUTE',
          vehicleId,
          registrationNo: 'BA 1 JA 1234',
          driverName: 'Ram Bahadur',
          routeId,
          wasteType: 'ORGANIC',
          latitude: 27.7172,
          longitude: 85.324,
          speedKmh: 25,
          headingDeg: 180,
          lastHeartbeat: new Date().toISOString(),
        },
      ]);

      const positions = await service.getActiveFleetPositions(tenantId);
      expect(positions).toHaveLength(1);
      expect(positions[0]?.status).toBe('ON_ROUTE');
    });

    it('should query route breadcrumbs with limit parameter', async () => {
      vi.mocked(mockRepo.findRouteBreadcrumbs).mockResolvedValue([
        { id: 'b-1', latitude: 27.71, longitude: 85.32, speedKmh: 20, recordedAt: new Date().toISOString() },
      ]);

      const breadcrumbs = await service.getRouteBreadcrumbs(tenantId, routeId, 50);
      expect(breadcrumbs).toHaveLength(1);
      expect(mockRepo.findRouteBreadcrumbs).toHaveBeenCalledWith(tenantId, routeId, 50);
    });
  });
});

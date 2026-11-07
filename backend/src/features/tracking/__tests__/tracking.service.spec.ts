import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingService } from '../tracking.service.js';
import type { ITrackingRepository } from '../tracking.types.js';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../../shared/errors/app-error.js';
import { Role, RouteStatus } from '@prisma/client';

vi.mock('../../../shared/database/redis.service.js', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
  isRedisReady: vi.fn(() => false),
}));

describe('TrackingService', () => {
  let mockRepo: ITrackingRepository;
  let service: TrackingService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const driverId = '00000000-0000-0000-0000-000000000002';
  const otherDriverId = '00000000-0000-0000-0000-000000000088';
  const vehicleId = '00000000-0000-0000-0000-000000000003';
  const routeId = '00000000-0000-0000-0000-000000000004';
  const citizenId = '00000000-0000-0000-0000-000000000009';

  beforeEach(() => {
    mockRepo = {
      recordLocation: vi.fn(),
      findLatestVehicleLocation: vi.fn(),
      findActiveFleetPositions: vi.fn(),
      findRouteBreadcrumbs: vi.fn(),
      findActiveRoute: vi.fn(),
      findRouteById: vi.fn(),
      isCitizenAssignedToRoute: vi.fn(),
      findUserStatus: vi.fn().mockResolvedValue('ACTIVE'),
      purgeOldLocations: vi.fn().mockResolvedValue(0),
    };
    service = new TrackingService(mockRepo);
  });

  describe('Shift-Boundary Guard & Account Status (Spec #10)', () => {
    it('should throw ForbiddenError when driver account is suspended or inactive', async () => {
      vi.mocked(mockRepo.findUserStatus).mockResolvedValue('INACTIVE');

      await expect(
        service.ingestLocation(tenantId, driverId, {
          vehicleId,
          latitude: 27.7172,
          longitude: 85.324,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(mockRepo.findActiveRoute).not.toHaveBeenCalled();
      expect(mockRepo.recordLocation).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when driver transmits GPS without an active in-progress shift', async () => {
      vi.mocked(mockRepo.findActiveRoute).mockResolvedValue(null);

      await expect(
        service.ingestLocation(tenantId, driverId, {
          vehicleId,
          latitude: 27.7172,
          longitude: 85.324,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(mockRepo.recordLocation).not.toHaveBeenCalled();
    });

    it('should allow transmission and use server-derived routeId when shift is active', async () => {
      vi.mocked(mockRepo.findActiveRoute).mockResolvedValue({ id: routeId });
      vi.mocked(mockRepo.findLatestVehicleLocation).mockResolvedValue(null);
      vi.mocked(mockRepo.recordLocation).mockResolvedValue({
        location: {
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
        },
        recorded: true,
      });

      const result = await service.ingestLocation(tenantId, driverId, {
        vehicleId,
        routeId: 'spoofed-route-id', // Ignored in favor of server-derived route
        latitude: 27.7172,
        longitude: 85.324,
        speedKmh: 35,
        headingDeg: 90,
      });

      expect(result.isThrottled).toBe(false);
      expect(result.telemetry.routeId).toBe(routeId);
      expect(result.telemetry.latitude).toBe(27.7172);
      expect(mockRepo.recordLocation).toHaveBeenCalledOnce();
    });

    it('should broadcast delta to ops and citizen-safe payload (redacting speed and driverId) to route room', async () => {
      const mockPublisher = { publishPosition: vi.fn() };
      service.setPublisher(mockPublisher);

      vi.mocked(mockRepo.findActiveRoute).mockResolvedValue({ id: routeId });
      vi.mocked(mockRepo.findLatestVehicleLocation).mockResolvedValue(null);
      vi.mocked(mockRepo.recordLocation).mockResolvedValue({
        location: {
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
        },
        recorded: true,
      });

      await service.ingestLocation(tenantId, driverId, {
        vehicleId,
        latitude: 27.7172,
        longitude: 85.324,
        speedKmh: 35,
        headingDeg: 90,
      });

      expect(mockPublisher.publishPosition).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          vehicleId,
          routeId,
          latitude: 27.7172,
          longitude: 85.324,
          speedKmh: 35,
          headingDeg: 90,
        }),
        expect.objectContaining({
          vehicleId,
          routeId,
          latitude: 27.7172,
          longitude: 85.324,
          headingDeg: 90,
        })
      );

      // Verify citizen payload does NOT leak driverId or speedKmh (Item 1)
      const routePayload = mockPublisher.publishPosition.mock.calls[0]?.[2];
      expect(routePayload).toBeDefined();
      expect((routePayload as Record<string, unknown>).driverId).toBeUndefined();
      expect((routePayload as Record<string, unknown>).speedKmh).toBeUndefined();
    });

    it('should clamp future timestamps within 5 minutes to server time and persist them', async () => {
      vi.mocked(mockRepo.findActiveRoute).mockResolvedValue({ id: routeId });
      vi.mocked(mockRepo.findLatestVehicleLocation).mockResolvedValue(null);
      vi.mocked(mockRepo.recordLocation).mockResolvedValue({
        location: {
          id: 'loc-clamped',
          tenantId,
          vehicleId,
          routeId,
          driverId,
          latitude: 27.7172,
          longitude: 85.324,
          speedKmh: 30,
          headingDeg: 45,
          recordedAt: new Date(),
        },
        recorded: true,
      });

      const twoMinutesInFuture = new Date(Date.now() + 120_000);

      const result = await service.ingestLocation(tenantId, driverId, {
        vehicleId,
        latitude: 27.7172,
        longitude: 85.324,
        recordedAt: twoMinutesInFuture.toISOString(),
      });

      expect(result.isThrottled).toBe(false);
      expect(mockRepo.recordLocation).toHaveBeenCalledOnce();
      // RecordedAt passed to repo was clamped to server time (not future date)
      const passedDate = vi.mocked(mockRepo.recordLocation).mock.calls[0]?.[0].recordedAt;
      expect(passedDate?.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should reject timestamps more than 5 minutes (tolerance) in the future with BadRequestError', async () => {
      vi.mocked(mockRepo.findActiveRoute).mockResolvedValue({ id: routeId });

      const wayTooFarFuture = new Date(Date.now() + 350_000); // ~5.8 minutes ahead

      await expect(
        service.ingestLocation(tenantId, driverId, {
          vehicleId,
          latitude: 27.7172,
          longitude: 85.324,
          recordedAt: wayTooFarFuture.toISOString(),
        })
      ).rejects.toThrow(BadRequestError);

      expect(mockRepo.recordLocation).not.toHaveBeenCalled();
    });

    it('should reject timestamps older than 24 hours with BadRequestError', async () => {
      vi.mocked(mockRepo.findActiveRoute).mockResolvedValue({ id: routeId });

      const ancientDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

      await expect(
        service.ingestLocation(tenantId, driverId, {
          vehicleId,
          latitude: 27.7172,
          longitude: 85.324,
          recordedAt: ancientDate.toISOString(),
        })
      ).rejects.toThrow(BadRequestError);

      expect(mockRepo.recordLocation).not.toHaveBeenCalled();
    });

    it('should ignore duplicate recordedAt without publishing (P2002 handling)', async () => {
      const mockPublisher = { publishPosition: vi.fn() };
      service.setPublisher(mockPublisher);

      vi.mocked(mockRepo.findActiveRoute).mockResolvedValue({ id: routeId });
      vi.mocked(mockRepo.findLatestVehicleLocation).mockResolvedValue(null);
      // Repo caught P2002 and returned recorded: false
      vi.mocked(mockRepo.recordLocation).mockResolvedValue({
        location: null,
        recorded: false,
      });

      const result = await service.ingestLocation(tenantId, driverId, {
        vehicleId,
        latitude: 27.7172,
        longitude: 85.324,
      });

      expect(result.isDuplicate).toBe(true);
      expect(mockPublisher.publishPosition).not.toHaveBeenCalled();
    });

    it('should persist out-of-order points for history but skip live broadcast to prevent jumping backward', async () => {
      const mockPublisher = { publishPosition: vi.fn() };
      service.setPublisher(mockPublisher);

      const latestDate = new Date();
      const pastDate = new Date(latestDate.getTime() - 15_000); // 15 seconds older than latest

      vi.mocked(mockRepo.findActiveRoute).mockResolvedValue({ id: routeId });
      vi.mocked(mockRepo.findLatestVehicleLocation).mockResolvedValue({
        id: 'loc-latest',
        tenantId,
        vehicleId,
        routeId,
        driverId,
        latitude: 27.718,
        longitude: 85.325,
        speedKmh: 40,
        headingDeg: 100,
        recordedAt: latestDate,
      });

      vi.mocked(mockRepo.recordLocation).mockResolvedValue({
        location: {
          id: 'loc-past',
          tenantId,
          vehicleId,
          routeId,
          driverId,
          latitude: 27.7172,
          longitude: 85.324,
          speedKmh: 35,
          headingDeg: 90,
          recordedAt: pastDate,
        },
        recorded: true,
      });

      const result = await service.ingestLocation(tenantId, driverId, {
        vehicleId,
        latitude: 27.7172,
        longitude: 85.324,
        recordedAt: pastDate.toISOString(),
      });

      expect(result.isThrottled).toBe(false);
      expect(mockRepo.recordLocation).toHaveBeenCalledOnce();
      // Should NOT broadcast out-of-order points to live room
      expect(mockPublisher.publishPosition).not.toHaveBeenCalled();
    });
  });

  describe('10m / 30s Ingestion Throttling', () => {
    it('should throttle and skip database write when movement < 10m and < 30s elapsed', async () => {
      const now = new Date();
      vi.mocked(mockRepo.findActiveRoute).mockResolvedValue({ id: routeId });
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
        latitude: 27.71721,
        longitude: 85.32401,
        recordedAt: now.toISOString(),
      });

      expect(result.isThrottled).toBe(true);
      expect(mockRepo.recordLocation).not.toHaveBeenCalled();
    });

    it('should persist when vehicle moved more than 10 meters even if < 30s elapsed', async () => {
      const now = new Date();
      vi.mocked(mockRepo.findActiveRoute).mockResolvedValue({ id: routeId });
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
        location: {
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
        },
        recorded: true,
      });

      // Significant movement: ~200 meters
      const result = await service.ingestLocation(tenantId, driverId, {
        vehicleId,
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
          isStale: false,
        },
      ]);

      const positions = await service.getActiveFleetPositions(tenantId);
      expect(positions).toHaveLength(1);
      expect(positions[0]?.status).toBe('ON_ROUTE');
    });

    it('should throw NotFoundError if route does not exist in tenant', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue(null);

      await expect(
        service.getRouteBreadcrumbs({
          tenantId,
          routeId,
          userId: driverId,
          role: Role.MUNICIPAL_ADMIN,
          limit: 50,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError (not ForbiddenError) if citizen does not have scheduled stop on route (Item 8)', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue({
        id: routeId,
        wardId: 'ward-1',
        driverId: null,
        status: RouteStatus.IN_PROGRESS,
      });
      vi.mocked(mockRepo.isCitizenAssignedToRoute).mockResolvedValue(false);

      await expect(
        service.getRouteBreadcrumbs({
          tenantId,
          routeId,
          userId: citizenId,
          role: Role.CITIZEN,
          limit: 50,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should query route breadcrumbs and preserve speed for municipal admin', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue({
        id: routeId,
        wardId: 'ward-1',
        driverId: null,
        status: RouteStatus.IN_PROGRESS,
      });
      vi.mocked(mockRepo.findRouteBreadcrumbs).mockResolvedValue([
        { id: 'b-1', latitude: 27.71, longitude: 85.32, speedKmh: 42, recordedAt: new Date().toISOString() },
      ]);

      const breadcrumbs = await service.getRouteBreadcrumbs({
        tenantId,
        routeId,
        userId: driverId,
        role: Role.MUNICIPAL_ADMIN,
        limit: 50,
      });
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0]?.speedKmh).toBe(42);
    });

    it('should query route breadcrumbs and redact speed to null for citizens', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue({
        id: routeId,
        wardId: 'ward-1',
        driverId: null,
        status: RouteStatus.IN_PROGRESS,
      });
      vi.mocked(mockRepo.isCitizenAssignedToRoute).mockResolvedValue(true);
      vi.mocked(mockRepo.findRouteBreadcrumbs).mockResolvedValue([
        { id: 'b-1', latitude: 27.71, longitude: 85.32, speedKmh: 42, recordedAt: new Date().toISOString() },
      ]);

      const breadcrumbs = await service.getRouteBreadcrumbs({
        tenantId,
        routeId,
        userId: citizenId,
        role: Role.CITIZEN,
        limit: 50,
      });
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0]?.speedKmh).toBeNull();
    });
  });

  describe('Route Authorization & Access Verification', () => {
    it('should return false if route does not exist in the tenant', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue(null);

      const hasAccess = await service.verifyRouteAccess(tenantId, routeId, driverId, Role.MUNICIPAL_ADMIN);
      expect(hasAccess).toBe(false);
      expect(mockRepo.findRouteById).toHaveBeenCalledWith(tenantId, routeId);
    });

    it('should grant access to municipal admin, dispatcher, and assigned driver', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue({
        id: routeId,
        wardId: 'ward-1',
        driverId: driverId,
        status: RouteStatus.IN_PROGRESS,
      });

      const adminAccess = await service.verifyRouteAccess(tenantId, routeId, driverId, Role.MUNICIPAL_ADMIN);
      const dispatcherAccess = await service.verifyRouteAccess(tenantId, routeId, driverId, Role.DISPATCHER);
      const assignedDriverAccess = await service.verifyRouteAccess(tenantId, routeId, driverId, Role.DRIVER);
      const otherDriverAccess = await service.verifyRouteAccess(tenantId, routeId, otherDriverId, Role.DRIVER);

      expect(adminAccess).toBe(true);
      expect(dispatcherAccess).toBe(true);
      expect(assignedDriverAccess).toBe(true);
      expect(otherDriverAccess).toBe(false); // Other driver is denied access (Item 2)
      expect(mockRepo.isCitizenAssignedToRoute).not.toHaveBeenCalled();
    });

    it('should restrict WARD_OFFICER to routes matching their wardId and deny if wardId is missing (fail-closed)', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue({
        id: routeId,
        wardId: 'ward-1',
        driverId: null,
        status: RouteStatus.IN_PROGRESS,
      });

      const sameWardAccess = await service.verifyRouteAccess(tenantId, routeId, 'ward-officer-1', Role.WARD_OFFICER, 'ward-1');
      const diffWardAccess = await service.verifyRouteAccess(tenantId, routeId, 'ward-officer-2', Role.WARD_OFFICER, 'ward-2');
      const noWardAccess = await service.verifyRouteAccess(tenantId, routeId, 'ward-officer-3', Role.WARD_OFFICER, null);
      const undefinedWardAccess = await service.verifyRouteAccess(tenantId, routeId, 'ward-officer-4', Role.WARD_OFFICER, undefined);

      expect(sameWardAccess).toBe(true);
      expect(diffWardAccess).toBe(false);
      expect(noWardAccess).toBe(false);
      expect(undefinedWardAccess).toBe(false);
    });

    it('should deny FIELD_WORKER from route room access (Item 9)', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue({
        id: routeId,
        wardId: 'ward-1',
        driverId: null,
        status: RouteStatus.IN_PROGRESS,
      });

      const fieldWorkerAccess = await service.verifyRouteAccess(tenantId, routeId, 'fw-1', Role.FIELD_WORKER);
      expect(fieldWorkerAccess).toBe(false);
    });

    it('should deny access to citizen if citizen is not served by that route', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue({
        id: routeId,
        wardId: 'ward-1',
        driverId: null,
        status: RouteStatus.IN_PROGRESS,
      });
      vi.mocked(mockRepo.isCitizenAssignedToRoute).mockResolvedValue(false);

      const citizenAccess = await service.verifyRouteAccess(tenantId, routeId, citizenId, Role.CITIZEN);
      expect(citizenAccess).toBe(false);
      expect(mockRepo.isCitizenAssignedToRoute).toHaveBeenCalledWith(tenantId, routeId, citizenId);
    });

    it('should grant access to citizen if route contains their property stop or pickup', async () => {
      vi.mocked(mockRepo.findRouteById).mockResolvedValue({
        id: routeId,
        wardId: 'ward-1',
        driverId: null,
        status: RouteStatus.IN_PROGRESS,
      });
      vi.mocked(mockRepo.isCitizenAssignedToRoute).mockResolvedValue(true);

      const citizenAccess = await service.verifyRouteAccess(tenantId, routeId, citizenId, Role.CITIZEN);
      expect(citizenAccess).toBe(true);
      expect(mockRepo.isCitizenAssignedToRoute).toHaveBeenCalledWith(tenantId, routeId, citizenId);
    });
  });
});

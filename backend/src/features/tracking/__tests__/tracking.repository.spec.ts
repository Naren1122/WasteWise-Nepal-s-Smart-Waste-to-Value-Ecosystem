import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingRepository } from '../tracking.repository.js';
import { prisma } from '../../../shared/database/prisma.service.js';
import { VehicleStatus, RouteStatus } from '@prisma/client';

vi.mock('../../../shared/database/prisma.service.js', () => ({
  prisma: {
    vehicle: {
      findMany: vi.fn(),
    },
    vehicleLocation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    route: {
      findFirst: vi.fn(),
    },
    routeStop: {
      findFirst: vi.fn(),
    },
  },
}));

describe('TrackingRepository Fleet & Breadcrumbs Logic', () => {
  let repo: TrackingRepository;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const vehicleId1 = '00000000-0000-0000-0000-000000000002';
  const vehicleId2 = '00000000-0000-0000-0000-000000000003';
  const vehicleId3 = '00000000-0000-0000-0000-000000000004';
  const routeId = '00000000-0000-0000-0000-000000000005';

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new TrackingRepository();
  });

  describe('findActiveFleetPositions', () => {
    it('should exclude RETIRED vehicles and correctly compute isStale and IDLE statuses', async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 30_000); // 30s ago (fresh)
      const staleDate = new Date(now.getTime() - 150_000); // 2.5 min ago (stale)

      vi.mocked(prisma.vehicle.findMany).mockResolvedValueOnce([
        // Vehicle 1: ON_ROUTE with active route and fresh location
        {
          id: vehicleId1,
          tenantId,
          registrationNo: 'BA 1 JA 1111',
          status: VehicleStatus.ON_ROUTE,
          assignedDriver: { id: 'd-1', fullName: 'Hari Thapa' },
          routes: [{ id: routeId, wasteType: 'ORGANIC' }],
          locations: [
            {
              id: 'loc-1',
              latitude: 27.7172,
              longitude: 85.324,
              speedKmh: 20,
              headingDeg: 90,
              recordedAt: recentDate,
            },
          ],
        } as any,
        // Vehicle 2: ON_ROUTE but route ended / no active route -> should map to IDLE with isStale: true
        {
          id: vehicleId2,
          tenantId,
          registrationNo: 'BA 1 JA 2222',
          status: VehicleStatus.ON_ROUTE,
          assignedDriver: { id: 'd-2', fullName: 'Shyam Shrestha' },
          routes: [],
          locations: [
            {
              id: 'loc-2',
              latitude: 27.719,
              longitude: 85.325,
              speedKmh: 0,
              headingDeg: 0,
              recordedAt: staleDate,
            },
          ],
        } as any,
        // Vehicle 3: AVAILABLE with no locations -> should have isStale: true
        {
          id: vehicleId3,
          tenantId,
          registrationNo: 'BA 1 JA 3333',
          status: VehicleStatus.AVAILABLE,
          assignedDriver: null,
          routes: [],
          locations: [],
        } as any,
      ]);

      const positions = await repo.findActiveFleetPositions(tenantId);

      // Verify query excludes RETIRED vehicles
      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          status: { not: VehicleStatus.RETIRED },
        },
        include: expect.any(Object),
        orderBy: { registrationNo: 'asc' },
      });

      expect(positions).toHaveLength(3);

      // Vehicle 1: ON_ROUTE and fresh
      expect(positions[0]).toMatchObject({
        vehicleId: vehicleId1,
        status: 'ON_ROUTE',
        isStale: false,
      });

      // Vehicle 2: IDLE and stale
      expect(positions[1]).toMatchObject({
        vehicleId: vehicleId2,
        status: 'IDLE',
        isStale: true,
      });

      // Vehicle 3: AVAILABLE (depot/parked) is not considered stale
      expect(positions[2]).toMatchObject({
        vehicleId: vehicleId3,
        status: 'AVAILABLE',
        isStale: false,
      });
    });
  });

  describe('findRouteBreadcrumbs', () => {
    it('should query latest points with desc order and return them in chronological order', async () => {
      const p1 = { id: 'p-1', latitude: 27.71, longitude: 85.31, speedKmh: 10, recordedAt: new Date('2026-11-06T10:00:00Z') };
      const p2 = { id: 'p-2', latitude: 27.72, longitude: 85.32, speedKmh: 20, recordedAt: new Date('2026-11-06T10:05:00Z') };
      const p3 = { id: 'p-3', latitude: 27.73, longitude: 85.33, speedKmh: 30, recordedAt: new Date('2026-11-06T10:10:00Z') };

      // DB returns in desc order (p3 latest, then p2, then p1)
      vi.mocked(prisma.vehicleLocation.findMany).mockResolvedValueOnce([p3, p2, p1] as any);

      const breadcrumbs = await repo.findRouteBreadcrumbs(tenantId, routeId, 3);

      expect(prisma.vehicleLocation.findMany).toHaveBeenCalledWith({
        where: { tenantId, routeId },
        orderBy: { recordedAt: 'desc' },
        take: 3,
        select: expect.any(Object),
      });

      // Reversed to chronological order (p1 -> p2 -> p3)
      expect(breadcrumbs[0]?.id).toBe('p-1');
      expect(breadcrumbs[1]?.id).toBe('p-2');
      expect(breadcrumbs[2]?.id).toBe('p-3');
    });
  });

  describe('recordLocation (Duplicate P2002 Protection)', () => {
    it('should insert telemetry record and return recorded: true', async () => {
      const mockSaved = {
        id: 'loc-1',
        tenantId,
        vehicleId: vehicleId1,
        routeId,
        driverId: 'd-1',
        latitude: 27.71,
        longitude: 85.32,
        speedKmh: 20,
        headingDeg: 90,
        recordedAt: new Date(),
      };
      vi.mocked(prisma.vehicleLocation.create).mockResolvedValueOnce(mockSaved as any);

      const result = await repo.recordLocation({
        tenantId,
        vehicleId: vehicleId1,
        latitude: 27.71,
        longitude: 85.32,
      });

      expect(result.recorded).toBe(true);
      expect(result.location?.id).toBe('loc-1');
    });

    it('should catch Prisma P2002 and return recorded: false without throwing', async () => {
      const p2002Error = new Error('Unique constraint failed') as any;
      p2002Error.code = 'P2002';
      Object.setPrototypeOf(p2002Error, (await import('@prisma/client')).Prisma.PrismaClientKnownRequestError.prototype);
      vi.mocked(prisma.vehicleLocation.create).mockRejectedValueOnce(p2002Error);

      const result = await repo.recordLocation({
        tenantId,
        vehicleId: vehicleId1,
        latitude: 27.71,
        longitude: 85.32,
      });

      expect(result.recorded).toBe(false);
      expect(result.location).toBeNull();
    });
  });

  describe('findUserStatus', () => {
    it('should return UserStatus when user exists in DB', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ status: 'ACTIVE' } as any);
      const status = await repo.findUserStatus('user-1');
      expect(status).toBe('ACTIVE');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { status: true },
      });
    });

    it('should return null when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      const status = await repo.findUserStatus('user-none');
      expect(status).toBeNull();
    });
  });

  describe('purgeOldLocations (Batched Non-locking Deletion)', () => {
    it('should delete stale telemetry in batches until exhausted', async () => {
      vi.mocked(prisma.vehicleLocation.findMany)
        .mockResolvedValueOnce([{ id: 'loc-1' }, { id: 'loc-2' }] as any)
        .mockResolvedValueOnce([] as any); // Second batch is empty

      vi.mocked(prisma.vehicleLocation.deleteMany).mockResolvedValueOnce({ count: 2 });

      const deletedCount = await repo.purgeOldLocations(30, 2, 10, 0);

      expect(deletedCount).toBe(2);
      expect(prisma.vehicleLocation.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.vehicleLocation.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['loc-1', 'loc-2'] } },
      });
    });
  });
});


import { prisma } from '../../shared/database/prisma.service.js';
import { RouteStatus, VehicleStatus, Prisma, type VehicleLocation, type UserStatus } from '@prisma/client';
import type {
  ITrackingRepository,
  SaveTelemetryData,
  LiveVehicleState,
  RouteBreadcrumbDto,
  RecordLocationResult,
} from './tracking.types.js';

export class TrackingRepository implements ITrackingRepository {
  public async recordLocation(
    data: SaveTelemetryData
  ): Promise<RecordLocationResult> {
    try {
      const location = await prisma.vehicleLocation.create({
        data: {
          tenantId: data.tenantId,
          vehicleId: data.vehicleId,
          routeId: data.routeId ?? null,
          driverId: data.driverId ?? null,
          latitude: data.latitude,
          longitude: data.longitude,
          speedKmh: data.speedKmh ?? null,
          headingDeg: data.headingDeg ?? null,
          recordedAt: data.recordedAt ?? new Date(),
        },
      });
      return { location, recorded: true };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        console.debug('[TrackingRepository] Duplicate telemetry point ignored (P2002 unique constraint)');
        return { location: null, recorded: false };
      }
      throw err;
    }
  }

  public async findLatestVehicleLocation(
    tenantId: string,
    vehicleId: string
  ): Promise<VehicleLocation | null> {
    return prisma.vehicleLocation.findFirst({
      where: { tenantId, vehicleId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  public async findActiveFleetPositions(tenantId: string): Promise<LiveVehicleState[]> {
    const STALE_HEARTBEAT_THRESHOLD_MS = 120_000; // 2 minutes
    const now = Date.now();

    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId,
        status: { not: VehicleStatus.RETIRED },
      },
      include: {
        assignedDriver: {
          select: { id: true, fullName: true },
        },
        routes: {
          where: { status: RouteStatus.IN_PROGRESS },
          take: 1,
          select: { id: true, wasteType: true },
        },
        locations: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { registrationNo: 'asc' },
    });

    return vehicles.map((v): LiveVehicleState => {
      const activeRoute = v.routes[0];
      const latestLoc = v.locations[0];

      // isStale is evaluated strictly for active ON_ROUTE vehicles (Item 9)
      const isStale = v.status === VehicleStatus.ON_ROUTE
        ? (latestLoc ? now - latestLoc.recordedAt.getTime() > STALE_HEARTBEAT_THRESHOLD_MS : true)
        : false;

      if (v.status === VehicleStatus.ON_ROUTE && activeRoute && latestLoc) {
        return {
          status: 'ON_ROUTE',
          vehicleId: v.id,
          registrationNo: v.registrationNo,
          driverName: v.assignedDriver?.fullName ?? 'Unassigned Driver',
          routeId: activeRoute.id,
          wasteType: activeRoute.wasteType,
          latitude: latestLoc.latitude,
          longitude: latestLoc.longitude,
          speedKmh: latestLoc.speedKmh ?? 0,
          headingDeg: latestLoc.headingDeg ?? 0,
          lastHeartbeat: latestLoc.recordedAt.toISOString(),
          isStale,
        };
      }

      // If status is ON_ROUTE but has no active route or location, report as IDLE
      let mappedStatus: 'IDLE' | 'MAINTENANCE' | 'AVAILABLE';
      if (v.status === VehicleStatus.MAINTENANCE) {
        mappedStatus = 'MAINTENANCE';
      } else if (v.status === VehicleStatus.ON_ROUTE) {
        mappedStatus = 'IDLE';
      } else {
        mappedStatus = 'AVAILABLE';
      }

      return {
        status: mappedStatus,
        vehicleId: v.id,
        registrationNo: v.registrationNo,
        driverName: v.assignedDriver?.fullName ?? null,
        latitude: latestLoc?.latitude ?? null,
        longitude: latestLoc?.longitude ?? null,
        lastHeartbeat: latestLoc?.recordedAt.toISOString() ?? null,
        isStale,
      };
    });
  }

  public async findRouteBreadcrumbs(
    tenantId: string,
    routeId: string,
    limit: number = 100
  ): Promise<RouteBreadcrumbDto[]> {
    const records = await prisma.vehicleLocation.findMany({
      where: { tenantId, routeId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        speedKmh: true,
        recordedAt: true,
      },
    });

    return records.reverse().map((r) => ({
      id: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      speedKmh: r.speedKmh,
      recordedAt: r.recordedAt.toISOString(),
    }));
  }

  public async findActiveRoute(
    tenantId: string,
    driverId: string,
    vehicleId: string
  ): Promise<{ id: string } | null> {
    return prisma.route.findFirst({
      where: {
        tenantId,
        driverId,
        vehicleId,
        status: RouteStatus.IN_PROGRESS,
      },
      select: { id: true },
    });
  }

  public async findRouteById(
    tenantId: string,
    routeId: string
  ): Promise<{ id: string; wardId: string; driverId: string | null; status: RouteStatus } | null> {
    return prisma.route.findFirst({
      where: { id: routeId, tenantId },
      select: { id: true, wardId: true, driverId: true, status: true },
    });
  }

  public async isCitizenAssignedToRoute(
    tenantId: string,
    routeId: string,
    citizenId: string
  ): Promise<boolean> {
    const matchingStop = await prisma.routeStop.findFirst({
      where: {
        tenantId,
        routeId,
        OR: [
          { property: { userId: citizenId } },
          { bulkyRequest: { userId: citizenId } },
        ],
      },
      select: { id: true },
    });

    return Boolean(matchingStop);
  }

  public async findUserStatus(userId: string): Promise<UserStatus | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    return user?.status ?? null;
  }

  /**
   * Data Retention Cleanup (Item 20 & Spec #20):
   * Deletes vehicle telemetry records older than retentionDays in non-locking batches.
   * Includes a max-batches guard and a short delay between batches to protect DB performance.
   */
  public async purgeOldLocations(
    retentionDays: number = 30,
    batchSize: number = 5000,
    maxBatches: number = 50,
    batchDelayMs: number = 50
  ): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    let totalDeleted = 0;
    let batchesRun = 0;

    while (batchesRun < maxBatches) {
      const staleBatch = await prisma.vehicleLocation.findMany({
        where: { recordedAt: { lt: cutoffDate } },
        select: { id: true },
        take: batchSize,
      });

      if (staleBatch.length === 0) break;

      const deleteResult = await prisma.vehicleLocation.deleteMany({
        where: { id: { in: staleBatch.map((s) => s.id) } },
      });

      totalDeleted += deleteResult.count;
      batchesRun++;

      if (deleteResult.count < batchSize) break;
      if (batchDelayMs > 0 && batchesRun < maxBatches) {
        await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
      }
    }

    return totalDeleted;
  }
}

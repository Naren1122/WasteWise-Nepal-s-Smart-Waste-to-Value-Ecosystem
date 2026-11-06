import { prisma } from '../../shared/database/prisma.service.js';
import type { Prisma } from '@prisma/client';
import { RouteStatus } from '@prisma/client';
import type {
  ITrackingRepository,
  SaveTelemetryData,
  LiveVehicleState,
  RouteBreadcrumbDto,
} from './tracking.types.js';

export class TrackingRepository implements ITrackingRepository {
  public async recordLocation(
    data: SaveTelemetryData
  ): Promise<Prisma.VehicleLocationGetPayload<object>> {
    return prisma.vehicleLocation.create({
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
  }

  public async findLatestVehicleLocation(
    tenantId: string,
    vehicleId: string
  ): Promise<Prisma.VehicleLocationGetPayload<object> | null> {
    return prisma.vehicleLocation.findFirst({
      where: { tenantId, vehicleId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  public async findActiveFleetPositions(tenantId: string): Promise<LiveVehicleState[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId },
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

      if (v.status === 'ON_ROUTE' && activeRoute && latestLoc) {
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
        };
      }

      return {
        status: v.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE',
        vehicleId: v.id,
        registrationNo: v.registrationNo,
        driverName: v.assignedDriver?.fullName ?? null,
        latitude: latestLoc?.latitude ?? null,
        longitude: latestLoc?.longitude ?? null,
        lastHeartbeat: latestLoc?.recordedAt.toISOString() ?? null,
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
      orderBy: { recordedAt: 'asc' },
      take: limit,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        speedKmh: true,
        recordedAt: true,
      },
    });

    return records.map((r) => ({
      id: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      speedKmh: r.speedKmh,
      recordedAt: r.recordedAt.toISOString(),
    }));
  }

  public async verifyActiveRoute(
    tenantId: string,
    routeId: string,
    driverId: string,
    vehicleId: string
  ): Promise<boolean> {
    const route = await prisma.route.findFirst({
      where: {
        id: routeId,
        tenantId,
        driverId,
        vehicleId,
        status: RouteStatus.IN_PROGRESS,
      },
      select: { id: true },
    });

    return Boolean(route);
  }
}

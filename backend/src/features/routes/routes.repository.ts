import { prisma } from '../../shared/database/prisma.service.js';
import type { Prisma } from '@prisma/client';
import type {
  IRoutesRepository, GenerateRouteData, UpdateRouteData,
  RouteFilterParams, RouteWithRelations, RouteStopWithRelations,
  OfflineStopSyncItem, WasteType, StopStatus,
} from './routes.types.js';

type StopUpdateData = {
  status: StopStatus;
  failureReason?: string | null;
  proofPhotoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  completedAt?: Date | null;
  notes?: string | null;
};

const routeInclude = {
  ward: { select: { id: true, wardNumber: true } },
  zone: { select: { id: true, name: true, code: true } },
  vehicle: { select: { id: true, registrationNo: true, vehicleType: true } },
  driver: { select: { id: true, fullName: true, phone: true } },
  stops: {
    include: {
      property: {
        select: { id: true, streetAddress: true, houseNumber: true, latitude: true, longitude: true },
      },
    },
    orderBy: { sequenceOrder: 'asc' as const },
  },
} as const;

export class RoutesRepository implements IRoutesRepository {
  public async createRoute(data: GenerateRouteData): Promise<RouteWithRelations> {
    return prisma.route.create({
      data: {
        tenantId: data.tenantId,
        wardId: data.wardId,
        zoneId: data.zoneId ?? null,
        vehicleId: data.vehicleId ?? null,
        driverId: data.driverId ?? null,
        routeDate: data.routeDate,
        wasteType: data.wasteType,
        notes: data.notes ?? null,
        status: 'DRAFT',
      },
      include: routeInclude,
    });
  }

  public async findRouteById(tenantId: string, id: string): Promise<RouteWithRelations | null> {
    return prisma.route.findFirst({ where: { id, tenantId }, include: routeInclude });
  }

  public async findRoutes(
    tenantId: string,
    filter: RouteFilterParams
  ): Promise<{ routes: RouteWithRelations[]; totalCount: number }> {
    const where: Prisma.RouteWhereInput = { tenantId };
    if (filter.wardId) where.wardId = filter.wardId;
    if (filter.vehicleId) where.vehicleId = filter.vehicleId;
    if (filter.driverId) where.driverId = filter.driverId;
    if (filter.status) where.status = filter.status;
    if (filter.routeDate) where.routeDate = filter.routeDate;

    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;

    const [routes, totalCount] = await Promise.all([
      prisma.route.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ routeDate: 'desc' }, { createdAt: 'desc' }],
        include: routeInclude,
      }),
      prisma.route.count({ where }),
    ]);

    return { routes, totalCount };
  }

  public async updateRoute(tenantId: string, id: string, data: UpdateRouteData): Promise<RouteWithRelations> {
    return prisma.route.update({
      where: { id, tenantId },
      data: {
        ...(data.vehicleId !== undefined && { vehicleId: data.vehicleId }),
        ...(data.driverId !== undefined && { driverId: data.driverId }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: routeInclude,
    });
  }

  public async findActiveDriverRoute(tenantId: string, driverId: string, date: Date): Promise<RouteWithRelations | null> {
    return prisma.route.findFirst({
      where: { tenantId, driverId, routeDate: date, status: { in: ['DISPATCHED', 'IN_PROGRESS'] } },
      include: routeInclude,
    });
  }

  public async findSubscribedPropertiesForWard(
    tenantId: string,
    wardId: string,
    wasteType: WasteType
  ): Promise<Array<{ id: string; streetAddress: string; houseNumber: string | null; latitude: number; longitude: number }>> {
    return prisma.property.findMany({
      where: {
        tenantId,
        wardId,
        status: 'ACTIVE',
        subscriptions: { some: { status: 'ACTIVE', plan: { wasteType } } },
      },
      select: { id: true, streetAddress: true, houseNumber: true, latitude: true, longitude: true },
      orderBy: [{ streetAddress: 'asc' }, { houseNumber: 'asc' }],
    });
  }

  public async findScheduledBulkyForWard(
    tenantId: string,
    wardId: string,
    date: Date
  ): Promise<Array<{ id: string; propertyId: string; property: { streetAddress: string; houseNumber: string | null; latitude: number; longitude: number } }>> {
    return prisma.bulkyWasteRequest.findMany({
      where: { tenantId, status: 'SCHEDULED', scheduledDate: date, property: { wardId } },
      select: {
        id: true,
        propertyId: true,
        property: {
          select: { streetAddress: true, houseNumber: true, latitude: true, longitude: true },
        },
      },
    });
  }

  public async createRouteStops(
    tenantId: string,
    routeId: string,
    stops: Array<{
      sequenceOrder: number;
      propertyId?: string | null;
      bulkyRequestId?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    }>
  ): Promise<void> {
    await prisma.routeStop.createMany({
      data: stops.map((s) => ({
        tenantId,
        routeId,
        sequenceOrder: s.sequenceOrder,
        propertyId: s.propertyId ?? null,
        bulkyRequestId: s.bulkyRequestId ?? null,
        latitude: s.latitude ?? null,
        longitude: s.longitude ?? null,
        status: 'PENDING',
      })),
    });
  }

  public async updateRouteStop(
    tenantId: string,
    stopId: string,
    data: StopUpdateData
  ): Promise<RouteStopWithRelations> {
    return prisma.routeStop.update({
      where: { id: stopId, tenantId },
      data: {
        status: data.status,
        ...(data.failureReason !== undefined && { failureReason: data.failureReason }),
        ...(data.proofPhotoUrl !== undefined && { proofPhotoUrl: data.proofPhotoUrl }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        property: {
          select: { id: true, streetAddress: true, houseNumber: true, latitude: true, longitude: true },
        },
      },
    });
  }

  public async batchSyncRouteStops(
    tenantId: string,
    updates: OfflineStopSyncItem[]
  ): Promise<number> {
    const ops = updates.map((u) =>
      prisma.routeStop.updateMany({
        where: { id: u.stopId, tenantId },
        data: {
          status: u.status,
          failureReason: u.failureReason ?? null,
          proofPhotoUrl: u.proofPhotoUrl ?? null,
          latitude: u.latitude ?? null,
          longitude: u.longitude ?? null,
          completedAt: u.completedAt,
          notes: u.notes ?? null,
        },
      })
    );
    const results = await prisma.$transaction(ops);
    return results.reduce((acc, r) => acc + r.count, 0);
  }
}

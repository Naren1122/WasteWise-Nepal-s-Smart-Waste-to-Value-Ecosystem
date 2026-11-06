import { RoutesRepository } from './routes.repository.js';
import type {
  IRoutesRepository,
  RouteDto,
  RouteStopDto,
  RouteWithRelations,
  RouteStopWithRelations,
  RouteFilterParams,
} from './routes.types.js';
import type {
  GenerateDailyRouteInput,
  UpdateRouteStatusInput,
  UpdateStopStatusInput,
  BatchOfflineSyncInput,
} from './routes.schema.js';
import {
  NotFoundError,
  ValidationError,
} from '../../shared/errors/app-error.js';

export class RoutesService {
  constructor(private readonly repo: IRoutesRepository = new RoutesRepository()) {}

  public async generateDailyRoute(tenantId: string, input: GenerateDailyRouteInput): Promise<RouteDto> {
    const [properties, bulkyRequests] = await Promise.all([
      this.repo.findSubscribedPropertiesForWard(tenantId, input.wardId, input.wasteType),
      this.repo.findScheduledBulkyForWard(tenantId, input.wardId, input.routeDate),
    ]);

    if (properties.length === 0 && bulkyRequests.length === 0) {
      throw new ValidationError({
        wardId: ['No active subscribed premises or scheduled bulky requests found for this ward'],
      });
    }

    const route = await this.repo.createRoute({
      tenantId,
      wardId: input.wardId,
      zoneId: input.zoneId ?? null,
      vehicleId: input.vehicleId ?? null,
      driverId: input.driverId ?? null,
      routeDate: input.routeDate,
      wasteType: input.wasteType,
      notes: input.notes ?? null,
    });

    let sequence = 1;
    const stopsToCreate = [
      ...properties.map((p) => ({
        sequenceOrder: sequence++,
        propertyId: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
      ...bulkyRequests.map((b) => ({
        sequenceOrder: sequence++,
        bulkyRequestId: b.id,
        propertyId: b.propertyId,
        latitude: b.property.latitude,
        longitude: b.property.longitude,
      })),
    ];

    await this.repo.createRouteStops(tenantId, route.id, stopsToCreate);
    const populated = await this.repo.findRouteById(tenantId, route.id);
    return this.toRouteDto(populated ?? route);
  }

  public async getRouteById(tenantId: string, id: string): Promise<RouteDto> {
    const route = await this.repo.findRouteById(tenantId, id);
    if (!route) throw new NotFoundError('Route', id);
    return this.toRouteDto(route);
  }

  public async getRoutes(
    tenantId: string,
    filter: RouteFilterParams
  ): Promise<{ items: RouteDto[]; totalCount: number; page: number; pageSize: number }> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const { routes, totalCount } = await this.repo.findRoutes(tenantId, { ...filter, page, pageSize });

    return {
      items: routes.map((r) => this.toRouteDto(r)),
      totalCount,
      page,
      pageSize,
    };
  }

  public async updateRouteStatus(
    tenantId: string,
    id: string,
    input: UpdateRouteStatusInput
  ): Promise<RouteDto> {
    const route = await this.repo.findRouteById(tenantId, id);
    if (!route) throw new NotFoundError('Route', id);

    const startTime = input.status === 'IN_PROGRESS' && !route.startTime ? new Date() : undefined;
    const endTime = input.status === 'COMPLETED' ? new Date() : undefined;

    const updated = await this.repo.updateRoute(tenantId, id, {
      ...(input.vehicleId !== undefined && { vehicleId: input.vehicleId }),
      ...(input.driverId !== undefined && { driverId: input.driverId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(input.notes !== undefined && { notes: input.notes }),
    });

    return this.toRouteDto(updated);
  }

  public async updateStopStatus(
    tenantId: string,
    stopId: string,
    input: UpdateStopStatusInput
  ): Promise<RouteStopDto> {
    if ((input.status === 'MISSED' || input.status === 'REJECTED') && !input.failureReason?.trim()) {
      throw new ValidationError({
        failureReason: ['A failure reason is required when marking a stop as MISSED or REJECTED'],
      });
    }

    const updated = await this.repo.updateRouteStop(tenantId, stopId, {
      status: input.status,
      failureReason: input.failureReason ?? null,
      proofPhotoUrl: input.proofPhotoUrl ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      completedAt: input.completedAt ?? new Date(),
      notes: input.notes ?? null,
    });

    return this.toStopDto(updated);
  }

  public async batchSyncOfflineStops(
    tenantId: string,
    input: BatchOfflineSyncInput
  ): Promise<{ syncedCount: number; message: string }> {
    const count = await this.repo.batchSyncRouteStops(tenantId, input.updates);
    return {
      syncedCount: count,
      message: `Successfully synchronized ${count} stops from offline field queue`,
    };
  }

  public async getActiveDriverRoute(tenantId: string, driverId: string, date: Date): Promise<RouteDto | null> {
    const route = await this.repo.findActiveDriverRoute(tenantId, driverId, date);
    return route ? this.toRouteDto(route) : null;
  }

  private toRouteDto(r: RouteWithRelations): RouteDto {
    const completedCount = r.stops.filter((s) => s.status === 'COLLECTED').length;
    return {
      id: r.id,
      tenantId: r.tenantId,
      wardId: r.wardId,
      wardNumber: r.ward.wardNumber,
      zoneId: r.zoneId,
      zoneName: r.zone?.name,
      vehicleId: r.vehicleId,
      vehicleRegistrationNo: r.vehicle?.registrationNo,
      vehicleType: r.vehicle?.vehicleType,
      driverId: r.driverId,
      driverName: r.driver?.fullName,
      driverPhone: r.driver?.phone,
      routeDate: r.routeDate,
      wasteType: r.wasteType,
      status: r.status,
      startTime: r.startTime,
      endTime: r.endTime,
      notes: r.notes,
      stopsCount: r.stops.length,
      completedStopsCount: completedCount,
      stops: r.stops.map((s) => ({
        id: s.id,
        routeId: s.routeId,
        sequenceOrder: s.sequenceOrder,
        propertyId: s.propertyId,
        propertyAddress: s.property?.streetAddress ?? null,
        houseNumber: s.property?.houseNumber ?? null,
        bulkyRequestId: s.bulkyRequestId,
        status: s.status,
        failureReason: s.failureReason,
        proofPhotoUrl: s.proofPhotoUrl,
        latitude: s.latitude,
        longitude: s.longitude,
        completedAt: s.completedAt,
        notes: s.notes,
      })),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private toStopDto(s: RouteStopWithRelations): RouteStopDto {
    return {
      id: s.id,
      routeId: s.routeId,
      sequenceOrder: s.sequenceOrder,
      propertyId: s.propertyId,
      propertyAddress: s.property?.streetAddress ?? null,
      houseNumber: s.property?.houseNumber ?? null,
      bulkyRequestId: s.bulkyRequestId,
      status: s.status,
      failureReason: s.failureReason,
      proofPhotoUrl: s.proofPhotoUrl,
      latitude: s.latitude,
      longitude: s.longitude,
      completedAt: s.completedAt,
      notes: s.notes,
    };
  }
}


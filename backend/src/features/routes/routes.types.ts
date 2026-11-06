import type { Prisma } from '@prisma/client';
import { RouteStatus, StopStatus, WasteType, VehicleType } from '@prisma/client';

export { RouteStatus, StopStatus, WasteType, VehicleType };

export interface RouteStopDto {
  id: string;
  routeId: string;
  sequenceOrder: number;
  propertyId: string | null;
  propertyAddress: string | null;
  houseNumber: string | null;
  bulkyRequestId: string | null;
  status: StopStatus;
  failureReason: string | null;
  proofPhotoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  completedAt: Date | null;
  notes: string | null;
}

export type RouteWithRelations = Prisma.RouteGetPayload<{
  include: {
    ward: { select: { id: true; wardNumber: true } };
    zone: { select: { id: true; name: true; code: true } };
    vehicle: { select: { id: true; registrationNo: true; vehicleType: true } };
    driver: { select: { id: true; fullName: true; phone: true } };
    stops: {
      include: {
        property: {
          select: {
            id: true;
            streetAddress: true;
            houseNumber: true;
            latitude: true;
            longitude: true;
          };
        };
      };
      orderBy: { sequenceOrder: 'asc' };
    };
  };
}>;

export type RouteStopWithRelations = Prisma.RouteStopGetPayload<{
  include: {
    property: {
      select: {
        id: true;
        streetAddress: true;
        houseNumber: true;
        latitude: true;
        longitude: true;
      };
    };
  };
}>;

export interface RouteDto {
  id: string;
  tenantId: string;
  wardId: string;
  wardNumber: number;
  zoneId: string | null;
  zoneName?: string | null | undefined;
  vehicleId: string | null;
  vehicleRegistrationNo?: string | null | undefined;
  vehicleType?: VehicleType | null | undefined;
  driverId: string | null;
  driverName?: string | null | undefined;
  driverPhone?: string | null | undefined;
  routeDate: Date;
  wasteType: WasteType;
  status: RouteStatus;
  startTime: Date | null;
  endTime: Date | null;
  notes: string | null;
  stopsCount: number;
  completedStopsCount: number;
  stops?: RouteStopDto[] | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateRouteData {
  tenantId: string;
  wardId: string;
  zoneId?: string | null | undefined;
  vehicleId?: string | null | undefined;
  driverId?: string | null | undefined;
  routeDate: Date;
  wasteType: WasteType;
  notes?: string | null | undefined;
}

export interface UpdateRouteData {
  vehicleId?: string | null | undefined;
  driverId?: string | null | undefined;
  status?: RouteStatus | undefined;
  startTime?: Date | null | undefined;
  endTime?: Date | null | undefined;
  notes?: string | null | undefined;
}

export interface OfflineStopSyncItem {
  stopId: string;
  status: StopStatus;
  failureReason?: string | null | undefined;
  proofPhotoUrl?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  completedAt: Date;
  notes?: string | null | undefined;
}

export interface RouteFilterParams {
  wardId?: string | undefined;
  vehicleId?: string | undefined;
  driverId?: string | undefined;
  status?: RouteStatus | undefined;
  routeDate?: Date | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface IRoutesRepository {
  createRoute(data: GenerateRouteData): Promise<RouteWithRelations>;
  findRouteById(tenantId: string, id: string): Promise<RouteWithRelations | null>;
  findRoutes(
    tenantId: string,
    filter: RouteFilterParams
  ): Promise<{ routes: RouteWithRelations[]; totalCount: number }>;
  updateRoute(tenantId: string, id: string, data: UpdateRouteData): Promise<RouteWithRelations>;
  findActiveDriverRoute(tenantId: string, driverId: string, date: Date): Promise<RouteWithRelations | null>;
  findSubscribedPropertiesForWard(
    tenantId: string,
    wardId: string,
    wasteType: WasteType
  ): Promise<Array<{ id: string; streetAddress: string; houseNumber: string | null; latitude: number; longitude: number }>>;
  findScheduledBulkyForWard(
    tenantId: string,
    wardId: string,
    date: Date
  ): Promise<Array<{ id: string; propertyId: string; property: { streetAddress: string; houseNumber: string | null; latitude: number; longitude: number } }>>;
  createRouteStops(
    tenantId: string,
    routeId: string,
    stops: Array<{
      sequenceOrder: number;
      propertyId?: string | null;
      bulkyRequestId?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    }>
  ): Promise<void>;
  updateRouteStop(
    tenantId: string,
    stopId: string,
    data: {
      status: StopStatus;
      failureReason?: string | null | undefined;
      proofPhotoUrl?: string | null | undefined;
      latitude?: number | null | undefined;
      longitude?: number | null | undefined;
      completedAt?: Date | null | undefined;
      notes?: string | null | undefined;
    }
  ): Promise<RouteStopWithRelations>;
  batchSyncRouteStops(tenantId: string, updates: OfflineStopSyncItem[]): Promise<number>;
}


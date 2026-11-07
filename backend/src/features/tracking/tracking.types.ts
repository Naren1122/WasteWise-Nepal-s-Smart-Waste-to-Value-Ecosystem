import type { RouteStatus, Role, VehicleLocation, UserStatus } from '@prisma/client';
import type { GpsLocationIngestDto } from './tracking.schema.js';

/**
 * WasteWise Phase 5: Real-Time GPS Tracking & Live Map Gateway Domain Types
 * Strict TypeScript: Zero `any`, typed events & discriminated unions.
 */

export interface GpsTelemetryDto {
  vehicleId: string;
  routeId?: string | null;
  driverId?: string | null;
  latitude: number;
  longitude: number;
  speedKmh?: number | null;
  headingDeg?: number | null;
  recordedAt: string;
}

/**
 * Lightweight real-time coordinate delta emitted over WebSockets to central ops room.
 * Clients merge deltas into their cached fleet state from `GET /tracking/fleet`
 * to avoid wiping out metadata like registrationNo, driverName, or wasteType.
 */
export interface VehiclePositionDelta {
  vehicleId: string;
  routeId: string | null;
  latitude: number;
  longitude: number;
  speedKmh: number | null;
  headingDeg: number | null;
  recordedAt: string;
}

/**
 * Citizen-safe location broadcast emitted to public route rooms.
 * Strictly redacts driverId and speedKmh to preserve driver privacy and operational security.
 */
export interface RouteLocationBroadcastDto {
  vehicleId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  headingDeg: number | null;
  recordedAt: string;
}

export type LiveVehicleState =
  | {
      status: 'ON_ROUTE';
      vehicleId: string;
      registrationNo: string;
      driverName: string;
      routeId: string;
      wasteType: string;
      latitude: number;
      longitude: number;
      speedKmh: number;
      headingDeg: number;
      lastHeartbeat: string;
      isStale?: boolean;
    }
  | {
      status: 'IDLE' | 'MAINTENANCE' | 'AVAILABLE';
      vehicleId: string;
      registrationNo: string;
      driverName?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      lastHeartbeat?: string | null;
      isStale?: boolean;
    };

export interface RouteBreadcrumbDto {
  id: string;
  latitude: number;
  longitude: number;
  speedKmh?: number | null;
  recordedAt: string;
}

export type IngestGpsLocationInput = GpsLocationIngestDto;

export interface RecordLocationResult {
  location: VehicleLocation | null;
  recorded: boolean;
}

export interface IngestLocationResult {
  telemetry: GpsTelemetryDto;
  isThrottled: boolean;
  isDuplicate?: boolean;
}

export interface GetRouteBreadcrumbsOptions {
  tenantId: string;
  routeId: string;
  userId: string;
  role: Role;
  wardId?: string | null | undefined;
  limit?: number | undefined;
}

export interface SaveTelemetryData {
  tenantId: string;
  vehicleId: string;
  routeId?: string | null;
  driverId?: string | null;
  latitude: number;
  longitude: number;
  speedKmh?: number | null;
  headingDeg?: number | null;
  recordedAt?: Date;
}

export interface ITrackingRepository {
  recordLocation(data: SaveTelemetryData): Promise<RecordLocationResult>;
  findLatestVehicleLocation(tenantId: string, vehicleId: string): Promise<VehicleLocation | null>;
  findActiveFleetPositions(tenantId: string): Promise<LiveVehicleState[]>;
  findRouteBreadcrumbs(tenantId: string, routeId: string, limit?: number): Promise<RouteBreadcrumbDto[]>;
  findActiveRoute(tenantId: string, driverId: string, vehicleId: string): Promise<{ id: string } | null>;
  findRouteById(tenantId: string, routeId: string): Promise<{ id: string; wardId: string; driverId: string | null; status: RouteStatus } | null>;
  isCitizenAssignedToRoute(tenantId: string, routeId: string, citizenId: string): Promise<boolean>;
  findUserStatus(userId: string): Promise<UserStatus | null>;
  purgeOldLocations(
    retentionDays?: number,
    batchSize?: number,
    maxBatches?: number,
    batchDelayMs?: number
  ): Promise<number>;
}

export interface ITrackingPublisher {
  publishPosition(tenantId: string, delta: VehiclePositionDelta, routeBroadcast?: RouteLocationBroadcastDto | null): void;
}

/**
 * Socket.IO Strongly Typed Client-to-Server and Server-to-Client Event Map
 */
export interface ServerToClientEvents {
  'vehicle:location_update': (payload: VehiclePositionDelta) => void;
  'route:location_broadcast': (payload: RouteLocationBroadcastDto) => void;
  'tracking:error': (error: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'join:ops_room': (tenantId: string) => void;
  'leave:ops_room': (tenantId: string) => void;
  'join:route_room': (routeId: string) => void;
  'leave:route_room': (routeId: string) => void;
  'telemetry:stream': (payload: IngestGpsLocationInput) => void;
}

export interface SocketData {
  userId: string;
  tenantId: string;
  role: Role;
  wardId?: string | null | undefined;
  tokenExp?: number | undefined;
}

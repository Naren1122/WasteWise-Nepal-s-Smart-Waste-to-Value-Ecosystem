import type { Prisma } from '@prisma/client';
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
    }
  | {
      status: 'IDLE' | 'MAINTENANCE' | 'AVAILABLE';
      vehicleId: string;
      registrationNo: string;
      driverName?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      lastHeartbeat?: string | null;
    };

export interface RouteBreadcrumbDto {
  id: string;
  latitude: number;
  longitude: number;
  speedKmh?: number | null;
  recordedAt: string;
}

export type IngestGpsLocationInput = GpsLocationIngestDto;

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

export interface LiveVehicleFilterParams {
  routeId?: string;
  vehicleId?: string;
  limit?: number;
}

export interface ITrackingRepository {
  recordLocation(data: SaveTelemetryData): Promise<Prisma.VehicleLocationGetPayload<object>>;
  findLatestVehicleLocation(tenantId: string, vehicleId: string): Promise<Prisma.VehicleLocationGetPayload<object> | null>;
  findActiveFleetPositions(tenantId: string): Promise<LiveVehicleState[]>;
  findRouteBreadcrumbs(tenantId: string, routeId: string, limit?: number): Promise<RouteBreadcrumbDto[]>;
  verifyActiveRoute(tenantId: string, routeId: string, driverId: string, vehicleId: string): Promise<boolean>;
}

/**
 * Socket.IO Strongly Typed Client-to-Server and Server-to-Client Event Map
 */
export interface ServerToClientEvents {
  'vehicle:location_update': (payload: LiveVehicleState) => void;
  'route:location_broadcast': (payload: GpsTelemetryDto) => void;
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
  role: string;
}

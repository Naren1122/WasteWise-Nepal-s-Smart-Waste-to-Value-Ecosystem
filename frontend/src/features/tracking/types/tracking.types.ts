/**
 * WasteWise Phase 5: Real-Time GPS Tracking & Live Map Types
 * Zero `any`, discriminated unions, strict typing.
 */

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

export interface VehiclePositionDelta {
  vehicleId: string;
  routeId: string | null;
  latitude: number;
  longitude: number;
  speedKmh: number | null;
  headingDeg: number | null;
  recordedAt: string;
}

export interface RouteBreadcrumb {
  id: string;
  latitude: number;
  longitude: number;
  speedKmh?: number | null;
  recordedAt: string;
}

export interface GpsTelemetry {
  vehicleId: string;
  routeId?: string | null;
  driverId?: string | null;
  latitude: number;
  longitude: number;
  speedKmh?: number | null;
  headingDeg?: number | null;
  recordedAt: string;
}

export interface TrackingFilter {
  search?: string;
  status?: 'ALL' | 'ON_ROUTE' | 'AVAILABLE' | 'MAINTENANCE';
}


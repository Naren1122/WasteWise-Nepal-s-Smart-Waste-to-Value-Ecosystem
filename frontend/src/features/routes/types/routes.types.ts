import { z } from 'zod';
import type { WasteType } from '@/features/schedules/types/schedules.types';
import type { VehicleType } from '@/features/fleet/types/fleet.types';

export const ROUTE_STATUSES = [
  'DRAFT',
  'DISPATCHED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export type RouteStatus = (typeof ROUTE_STATUSES)[number];

export const STOP_STATUSES = [
  'PENDING',
  'COLLECTED',
  'PARTIAL',
  'MISSED',
  'REJECTED',
] as const;
export type StopStatus = (typeof STOP_STATUSES)[number];

export interface RouteStop {
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
  completedAt: string | null;
  notes: string | null;
}

export interface Route {
  id: string;
  tenantId: string;
  wardId: string;
  wardNumber: number;
  zoneId: string | null;
  zoneName?: string | null;
  vehicleId: string | null;
  vehicleRegistrationNo?: string | null;
  vehicleType?: VehicleType | null;
  driverId: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  routeDate: string;
  wasteType: WasteType;
  status: RouteStatus;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  stopsCount: number;
  completedStopsCount: number;
  stops?: RouteStop[];
  createdAt: string;
  updatedAt: string;
}

export const generateDailyRouteSchema = z.object({
  wardId: z.string().uuid('Please select a valid ward'),
  zoneId: z.string().uuid().optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  driverId: z.string().uuid().optional().nullable(),
  routeDate: z.string().min(1, 'Route date is required'),
  wasteType: z.enum(['ORGANIC', 'RECYCLABLE', 'HAZARDOUS', 'BULKY']),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});
export type GenerateDailyRouteInput = z.infer<typeof generateDailyRouteSchema>;

export interface UpdateRouteStatusInput {
  status?: RouteStatus;
  vehicleId?: string | null;
  driverId?: string | null;
  notes?: string | null;
}

export interface UpdateStopStatusInput {
  status: StopStatus;
  failureReason?: string | null;
  proofPhotoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  completedAt?: string;
  notes?: string | null;
}

export interface OfflineStopSyncItem {
  stopId: string;
  status: StopStatus;
  failureReason?: string | null;
  proofPhotoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  completedAt: string;
  notes?: string | null;
}

export interface RouteFilterParams {
  wardId?: string;
  vehicleId?: string;
  driverId?: string;
  status?: RouteStatus;
  routeDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedRoutesData {
  routes: Route[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


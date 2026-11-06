import { z } from 'zod';
import { RouteStatus, StopStatus, WasteType } from '@prisma/client';

export const GenerateDailyRouteSchema = z.object({
  wardId: z.string().uuid('Invalid ward ID format'),
  zoneId: z.string().uuid('Invalid zone ID format').optional().nullable(),
  vehicleId: z.string().uuid('Invalid vehicle ID format').optional().nullable(),
  driverId: z.string().uuid('Invalid driver ID format').optional().nullable(),
  routeDate: z.coerce.date({ invalid_type_error: 'Route date must be a valid date' }),
  wasteType: z.nativeEnum(WasteType, {
    errorMap: () => ({ message: 'Invalid waste type stream' }),
  }),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});

export const UpdateRouteStatusSchema = z.object({
  status: z.nativeEnum(RouteStatus, {
    errorMap: () => ({ message: 'Invalid route operational status' }),
  }).optional(),
  vehicleId: z.string().uuid('Invalid vehicle ID format').optional().nullable(),
  driverId: z.string().uuid('Invalid driver ID format').optional().nullable(),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});

export const UpdateStopStatusSchema = z.object({
  status: z.nativeEnum(StopStatus, {
    errorMap: () => ({ message: 'Invalid stop completion status' }),
  }),
  failureReason: z.string().trim().max(255).optional().nullable(),
  proofPhotoUrl: z.string().trim().url('Proof photo must be a valid URL').optional().nullable().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  completedAt: z.coerce.date().optional(),
  notes: z.string().trim().max(255).optional().nullable(),
});

export const OfflineStopItemSchema = z.object({
  stopId: z.string().uuid('Invalid stop ID format'),
  status: z.nativeEnum(StopStatus, {
    errorMap: () => ({ message: 'Invalid stop completion status' }),
  }),
  failureReason: z.string().trim().max(255).optional().nullable(),
  proofPhotoUrl: z.string().trim().max(500).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  completedAt: z.coerce.date({ required_error: 'Offline completed timestamp is required' }),
  notes: z.string().trim().max(255).optional().nullable(),
});

export const BatchOfflineSyncSchema = z.object({
  updates: z
    .array(OfflineStopItemSchema)
    .min(1, 'At least one stop record required for offline sync')
    .max(500, 'Batch sync exceeds limit of 500 stops per request'),
});

export const RouteFilterSchema = z.object({
  wardId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  status: z.nativeEnum(RouteStatus).optional(),
  routeDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type GenerateDailyRouteInput = z.infer<typeof GenerateDailyRouteSchema>;
export type UpdateRouteStatusInput = z.infer<typeof UpdateRouteStatusSchema>;
export type UpdateStopStatusInput = z.infer<typeof UpdateStopStatusSchema>;
export type BatchOfflineSyncInput = z.infer<typeof BatchOfflineSyncSchema>;
export type RouteFilterInput = z.infer<typeof RouteFilterSchema>;


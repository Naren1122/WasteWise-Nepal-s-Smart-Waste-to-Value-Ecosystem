import { z } from 'zod';

/**
 * WasteWise Phase 5: GPS Tracking Validation Schemas
 * Strict validation with coordinate ranges and UUID enforcement.
 */

export const GpsLocationIngestSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle UUID format'),
  routeId: z.string().uuid('Invalid route UUID format').optional(),
  latitude: z
    .number({ required_error: 'Latitude is required', invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number({ required_error: 'Longitude is required', invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  speedKmh: z
    .number({ invalid_type_error: 'Speed must be a number' })
    .nonnegative('Speed cannot be negative')
    .max(200, 'Speed exceeds plausible threshold (max 200 km/h)')
    .optional(),
  headingDeg: z
    .number({ invalid_type_error: 'Heading must be a number' })
    .min(0, 'Heading must be between 0 and 360 degrees')
    .max(360, 'Heading must be between 0 and 360 degrees')
    .optional(),
  recordedAt: z.string().datetime('RecordedAt must be an ISO 8601 timestamp').optional(),
});

export const RouteBreadcrumbsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional().default(100),
});

export const RouteIdParamSchema = z.object({
  routeId: z.string().uuid('Invalid route UUID format'),
});

export const VehicleIdParamSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle UUID format'),
});

export type GpsLocationIngestDto = z.infer<typeof GpsLocationIngestSchema>;
export type RouteBreadcrumbsQueryDto = z.infer<typeof RouteBreadcrumbsQuerySchema>;

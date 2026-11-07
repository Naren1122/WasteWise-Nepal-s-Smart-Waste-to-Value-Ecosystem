import { z } from 'zod';
import { TrackingRepository } from './tracking.repository.js';
import type {
  ITrackingRepository,
  IngestGpsLocationInput,
  IngestLocationResult,
  GpsTelemetryDto,
  LiveVehicleState,
  RouteBreadcrumbDto,
  VehiclePositionDelta,
  RouteLocationBroadcastDto,
  ITrackingPublisher,
  GetRouteBreadcrumbsOptions,
} from './tracking.types.js';
import { haversineDistanceMeters } from '../../shared/utils/geo.util.js';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../shared/errors/app-error.js';
import { redis, isRedisReady } from '../../shared/database/redis.service.js';
import { env } from '../../shared/config/env.js';
import { Role } from '@prisma/client';

const CachedVehiclePositionSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.string(),
});

export class TrackingService {
  private publisher: ITrackingPublisher | undefined;

  constructor(
    private readonly repo: ITrackingRepository = new TrackingRepository(),
    publisher?: ITrackingPublisher | undefined
  ) {
    this.publisher = publisher;
  }

  public setPublisher(publisher: ITrackingPublisher | undefined): void {
    this.publisher = publisher;
  }

  /**
   * Ingests a GPS telemetry point from a driver device.
   * Enforces:
   * - Driver active account status check (Spec #10)
   * - Server-derived shift boundary guard (Item 7 & 16)
   * - Configurable future tolerance with server-time clamping and ancient timestamp rejection (Item 7)
   * - Duplicate telemetry handling (P2002) without broadcast
   * - Out-of-order/historical point handling without live map regression (Item 3)
   * - 10m/30s ingestion throttling to protect database
   * - Safe publisher invocation without breaking saved pings (Item 7)
   */
  public async ingestLocation(
    tenantId: string,
    driverId: string,
    input: IngestGpsLocationInput
  ): Promise<IngestLocationResult> {
    // 0. Verify driver account is still ACTIVE (Spec #10)
    await this.assertDriverActive(driverId);

    // 1. Shift-Boundary Guard: Check Redis cache first, then fall back to DB (Items 7 & 16)
    let activeRoute: { id: string } | null = null;
    const activeRouteCacheKey = `tenant:${tenantId}:active-route:d:${driverId}:v:${input.vehicleId}`;

    if (isRedisReady()) {
      try {
        const cachedRouteId = await redis.get(activeRouteCacheKey);
        if (cachedRouteId) {
          activeRoute = { id: cachedRouteId };
        }
      } catch (err) {
        console.debug('[Redis] Failed to read active route cache:', err);
      }
    }

    if (!activeRoute) {
      activeRoute = await this.repo.findActiveRoute(tenantId, driverId, input.vehicleId);
      if (!activeRoute) {
        throw new ForbiddenError(
          'Location transmission rejected: Driver is not assigned to an active in-progress route for this vehicle'
        );
      }
      if (isRedisReady()) {
        redis
          .set(activeRouteCacheKey, activeRoute.id, 'EX', 60)
          .catch((err) => console.debug('[Redis] Failed to cache active route:', err));
      }
    }
    const resolvedRouteId = activeRoute.id;

    // 2. Client Timestamp Validation & Future Clamping (Item 7):
    // If recordedAt is up to GPS_FUTURE_TOLERANCE_SECONDS ahead, clamp it to server time; reject beyond.
    const now = Date.now();
    let recordedAtDate = input.recordedAt ? new Date(input.recordedAt) : new Date(now);
    const toleranceMs = (env.GPS_FUTURE_TOLERANCE_SECONDS ?? 300) * 1000;
    const diffMs = recordedAtDate.getTime() - now;

    if (diffMs > toleranceMs) {
      throw new BadRequestError(
        `Location timestamp cannot be more than ${env.GPS_FUTURE_TOLERANCE_SECONDS ?? 300} seconds in the future`
      );
    }

    // Clamp slight future clock skew to server time
    if (diffMs > 0) {
      recordedAtDate = new Date(now);
    }

    const recordedAtMs = recordedAtDate.getTime();
    if (now - recordedAtMs > 24 * 60 * 60 * 1000) {
      throw new BadRequestError('Location timestamp is too old (exceeds 24 hours)');
    }

    // 3. Throttling Filter: Check Redis for latest position first (validated via Zod)
    let lastLocation: { latitude: number; longitude: number; recordedAt: Date } | null = null;
    const posCacheKey = `tenant:${tenantId}:vehicle:${input.vehicleId}:pos`;

    if (isRedisReady()) {
      try {
        const cachedPos = await redis.get(posCacheKey);
        if (cachedPos) {
          const parsedJson: unknown = JSON.parse(cachedPos);
          const validated = CachedVehiclePositionSchema.safeParse(parsedJson);
          if (validated.success) {
            lastLocation = {
              latitude: validated.data.latitude,
              longitude: validated.data.longitude,
              recordedAt: new Date(validated.data.recordedAt),
            };
          } else {
            console.debug('[Redis] Invalid cached vehicle position schema, ignoring cache:', posCacheKey);
          }
        }
      } catch (err) {
        console.debug('[Redis] Failed to read position cache:', err);
      }
    }

    if (!lastLocation) {
      const dbLocation = await this.repo.findLatestVehicleLocation(tenantId, input.vehicleId);
      if (dbLocation) {
        lastLocation = {
          latitude: dbLocation.latitude,
          longitude: dbLocation.longitude,
          recordedAt: dbLocation.recordedAt,
        };
      }
    }

    // 4. Check for Out-Of-Order / Backwards time travel (Item 3)
    const isOutOfOrder = lastLocation !== null && recordedAtMs <= lastLocation.recordedAt.getTime();

    if (!isOutOfOrder && lastLocation) {
      const distanceMeters = haversineDistanceMeters(
        lastLocation.latitude,
        lastLocation.longitude,
        input.latitude,
        input.longitude
      );
      const timeDeltaMs = recordedAtMs - lastLocation.recordedAt.getTime();

      // Skip database persistence if vehicle moved <10m and <30s elapsed
      if (distanceMeters < env.GPS_THROTTLE_MIN_METERS && timeDeltaMs < env.GPS_THROTTLE_MAX_MS) {
        return {
          telemetry: {
            vehicleId: input.vehicleId,
            routeId: resolvedRouteId,
            driverId,
            latitude: input.latitude,
            longitude: input.longitude,
            speedKmh: input.speedKmh ?? null,
            headingDeg: input.headingDeg ?? null,
            recordedAt: recordedAtDate.toISOString(),
          },
          isThrottled: true,
        };
      }
    }

    // 5. Persist telemetry record to database (catches unique constraint duplicate P2002)
    const { location: saved, recorded } = await this.repo.recordLocation({
      tenantId,
      vehicleId: input.vehicleId,
      routeId: resolvedRouteId,
      driverId,
      latitude: input.latitude,
      longitude: input.longitude,
      speedKmh: input.speedKmh ?? null,
      headingDeg: input.headingDeg ?? null,
      recordedAt: recordedAtDate,
    });

    // If duplicate point (P2002), skip cache update and live broadcast (Item 3)
    if (!recorded || !saved) {
      return {
        telemetry: {
          vehicleId: input.vehicleId,
          routeId: resolvedRouteId,
          driverId,
          latitude: input.latitude,
          longitude: input.longitude,
          speedKmh: input.speedKmh ?? null,
          headingDeg: input.headingDeg ?? null,
          recordedAt: recordedAtDate.toISOString(),
        },
        isThrottled: false,
        isDuplicate: true,
      };
    }

    const telemetry: GpsTelemetryDto = {
      vehicleId: saved.vehicleId,
      routeId: saved.routeId,
      driverId: saved.driverId,
      latitude: saved.latitude,
      longitude: saved.longitude,
      speedKmh: saved.speedKmh,
      headingDeg: saved.headingDeg,
      recordedAt: saved.recordedAt.toISOString(),
    };

    // 6. Out-of-order points: Persisted for history, but do NOT update latest cache or broadcast (Item 3)
    if (isOutOfOrder) {
      return {
        telemetry,
        isThrottled: false,
      };
    }

    // 7. Update latest vehicle position in Redis (5-minute TTL)
    if (isRedisReady()) {
      redis
        .set(posCacheKey, JSON.stringify(telemetry), 'EX', 300)
        .catch((err) => console.debug('[Redis] Failed to cache vehicle position:', err));
    }

    // 8. Broadcast to central ops room & citizen-safe route broadcast (Items 1, 7, 12, 13)
    const delta: VehiclePositionDelta = {
      vehicleId: saved.vehicleId,
      routeId: saved.routeId,
      latitude: saved.latitude,
      longitude: saved.longitude,
      speedKmh: saved.speedKmh,
      headingDeg: saved.headingDeg,
      recordedAt: saved.recordedAt.toISOString(),
    };

    const routeBroadcast: RouteLocationBroadcastDto | null = saved.routeId
      ? {
          vehicleId: saved.vehicleId,
          routeId: saved.routeId,
          latitude: saved.latitude,
          longitude: saved.longitude,
          headingDeg: saved.headingDeg,
          recordedAt: saved.recordedAt.toISOString(),
        }
      : null;

    if (this.publisher) {
      try {
        this.publisher.publishPosition(tenantId, delta, routeBroadcast);
      } catch (pubErr) {
        console.warn('[TrackingService] Failed to publish location delta (database record preserved):', pubErr);
      }
    }

    return {
      telemetry,
      isThrottled: false,
    };
  }

  public async getActiveFleetPositions(tenantId: string): Promise<LiveVehicleState[]> {
    return this.repo.findActiveFleetPositions(tenantId);
  }

  /**
   * Retrieves historical route breadcrumbs with tenant verification,
   * citizen stop validation, and speed redaction for citizen privacy (Items 1 & 8).
   * Takes a unified options object and performs a single route lookup.
   */
  public async getRouteBreadcrumbs(
    options: GetRouteBreadcrumbsOptions
  ): Promise<RouteBreadcrumbDto[]> {
    const { tenantId, routeId, userId, role, wardId, limit = 100 } = options;

    const route = await this.repo.findRouteById(tenantId, routeId);
    if (!route) {
      throw new NotFoundError('Route', routeId);
    }

    const hasAccess = await this.canAccessRoute(route, tenantId, userId, role, wardId);
    if (!hasAccess) {
      // For citizens, return NotFoundError to prevent route existence disclosure (Item 8)
      if (role === Role.CITIZEN) {
        throw new NotFoundError('Route', routeId);
      }
      throw new ForbiddenError('Access denied: You do not have permission to view breadcrumbs for this route');
    }

    const rawBreadcrumbs = await this.repo.findRouteBreadcrumbs(tenantId, routeId, limit);

    // Redact speed for citizens (Item 8)
    if (role === Role.CITIZEN) {
      return rawBreadcrumbs.map((b) => ({
        id: b.id,
        latitude: b.latitude,
        longitude: b.longitude,
        speedKmh: null,
        recordedAt: b.recordedAt,
      }));
    }

    return rawBreadcrumbs;
  }

  /**
   * Verifies whether a user has permission to subscribe to real-time route updates
   * or view route breadcrumbs (Items 2 & 9).
   */
  public async verifyRouteAccess(
    tenantId: string,
    routeId: string,
    userId: string,
    role: Role,
    wardId?: string | null
  ): Promise<boolean> {
    const route = await this.repo.findRouteById(tenantId, routeId);
    if (!route) {
      return false;
    }
    return this.canAccessRoute(route, tenantId, userId, role, wardId);
  }

  /**
   * Evaluates role-scoped access to a route (Fail-closed pattern).
   */
  private async canAccessRoute(
    route: { id: string; wardId: string; driverId: string | null },
    tenantId: string,
    userId: string,
    role: Role,
    wardId?: string | null
  ): Promise<boolean> {
    // Drivers can only monitor their own route (Item 2)
    if (role === Role.DRIVER) {
      return route.driverId === userId;
    }

    // Ward Officers can only monitor routes in their ward (fail-closed if wardId is missing)
    if (role === Role.WARD_OFFICER) {
      return Boolean(wardId) && route.wardId === wardId;
    }

    // Citizens must have an assigned stop or pickup on that route
    if (role === Role.CITIZEN) {
      return this.repo.isCitizenAssignedToRoute(tenantId, route.id, userId);
    }

    // FIELD_WORKER is strictly restricted from live route monitoring (Item 9).
    // Field workers interact via assigned bin/bulky task workflows rather than route streams.
    if (role === Role.FIELD_WORKER) {
      return false;
    }

    // Municipal Admins, Dispatchers, Super Admins have tenant-wide route access
    return role === Role.MUNICIPAL_ADMIN || role === Role.DISPATCHER || role === Role.SUPER_ADMIN;
  }

  /**
   * Verifies that the driver is currently ACTIVE, utilizing a 60-second Redis cache (Spec #10 & Item 5).
   * Fully decoupled: queries repo.findUserStatus instead of direct prisma import.
   */
  private async assertDriverActive(driverId: string): Promise<void> {
    const statusKey = `user:${driverId}:status`;

    if (isRedisReady()) {
      try {
        const cached = await redis.get(statusKey);
        if (cached === 'ACTIVE') return;
        if (cached === 'INACTIVE' || cached === 'SUSPENDED') {
          throw new ForbiddenError('Driver account is deactivated or suspended');
        }
      } catch (err) {
        if (err instanceof ForbiddenError) throw err;
        console.debug('[TrackingService] Failed to read cached user status from Redis:', err);
      }
    }

    const status = await this.repo.findUserStatus(driverId);

    if (status !== 'ACTIVE') {
      if (isRedisReady()) {
        redis
          .set(statusKey, status ?? 'INACTIVE', 'EX', 60)
          .catch((err) => console.debug('[TrackingService] Failed to cache user status in Redis:', err));
      }
      throw new ForbiddenError('Driver account is deactivated or suspended');
    }

    if (isRedisReady()) {
      redis
        .set(statusKey, 'ACTIVE', 'EX', 60)
        .catch((err) => console.debug('[TrackingService] Failed to cache user status in Redis:', err));
    }
  }
}

import { TrackingRepository } from './tracking.repository.js';
import type {
  ITrackingRepository,
  IngestGpsLocationInput,
  GpsTelemetryDto,
  LiveVehicleState,
  RouteBreadcrumbDto,
} from './tracking.types.js';
import { haversineDistanceMeters } from '../../shared/utils/geo.util.js';
import { ForbiddenError } from '../../shared/errors/app-error.js';

export class TrackingService {
  private static readonly MIN_DISTANCE_METERS = 10;
  private static readonly MAX_TIME_WINDOW_MS = 30_000;

  constructor(private readonly repo: ITrackingRepository = new TrackingRepository()) {}

  /**
   * Ingests a GPS telemetry point from a driver device.
   * Enforces Shift-Boundary Guard & 10m/30s Ingestion Throttling.
   */
  public async ingestLocation(
    tenantId: string,
    driverId: string,
    input: IngestGpsLocationInput
  ): Promise<{ telemetry: GpsTelemetryDto; isThrottled: boolean }> {
    // 1. Shift-Boundary Guard: Enforce driver privacy
    if (input.routeId) {
      const isShiftActive = await this.repo.verifyActiveRoute(
        tenantId,
        input.routeId,
        driverId,
        input.vehicleId
      );

      if (!isShiftActive) {
        throw new ForbiddenError(
          'Location transmission rejected: Route is not active or driver is not assigned'
        );
      }
    }

    // 2. Throttling Filter: Check distance & time since last heartbeat
    const lastLocation = await this.repo.findLatestVehicleLocation(tenantId, input.vehicleId);
    const recordedAtDate = input.recordedAt ? new Date(input.recordedAt) : new Date();

    if (lastLocation) {
      const distanceMeters = haversineDistanceMeters(
        lastLocation.latitude,
        lastLocation.longitude,
        input.latitude,
        input.longitude
      );

      const timeDeltaMs = recordedAtDate.getTime() - lastLocation.recordedAt.getTime();

      // If moved < 10m and < 30s elapsed, throttle persistence to save bandwidth and DB churn
      if (distanceMeters < TrackingService.MIN_DISTANCE_METERS && timeDeltaMs < TrackingService.MAX_TIME_WINDOW_MS) {
        return {
          telemetry: {
            vehicleId: input.vehicleId,
            routeId: input.routeId ?? null,
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

    // 3. Persist new telemetry record
    const saved = await this.repo.recordLocation({
      tenantId,
      vehicleId: input.vehicleId,
      routeId: input.routeId ?? null,
      driverId,
      latitude: input.latitude,
      longitude: input.longitude,
      speedKmh: input.speedKmh ?? null,
      headingDeg: input.headingDeg ?? null,
      recordedAt: recordedAtDate,
    });

    return {
      telemetry: {
        vehicleId: saved.vehicleId,
        routeId: saved.routeId,
        driverId: saved.driverId,
        latitude: saved.latitude,
        longitude: saved.longitude,
        speedKmh: saved.speedKmh,
        headingDeg: saved.headingDeg,
        recordedAt: saved.recordedAt.toISOString(),
      },
      isThrottled: false,
    };
  }

  public async getActiveFleetPositions(tenantId: string): Promise<LiveVehicleState[]> {
    return this.repo.findActiveFleetPositions(tenantId);
  }

  public async getRouteBreadcrumbs(
    tenantId: string,
    routeId: string,
    limit: number = 100
  ): Promise<RouteBreadcrumbDto[]> {
    return this.repo.findRouteBreadcrumbs(tenantId, routeId, limit);
  }
}

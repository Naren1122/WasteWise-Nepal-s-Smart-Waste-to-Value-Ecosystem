import { TrackingRepository } from './tracking.repository.js';
import { env } from '../../shared/config/env.js';

/**
 * WasteWise Telemetry Retention Job (Spec #20 & Item 4)
 * Runs daily to delete historical GPS breadcrumbs older than GPS_RETENTION_DAYS (default 30).
 * Executes in small non-locking batches with delay to avoid DB performance spikes.
 */
export class TrackingRetentionScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(private readonly repo: TrackingRepository = new TrackingRepository()) {}

  public start(): void {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // Run first cleanup 1 minute after boot to allow startup stabilization
    const initialDelayMs = 60_000;

    this.timer = setTimeout(() => {
      this.executePurge();
      this.timer = setInterval(() => this.executePurge(), ONE_DAY_MS);
    }, initialDelayMs);

    console.log(
      `[TrackingRetentionScheduler] Scheduled daily telemetry retention job (retention: ${env.GPS_RETENTION_DAYS} days)`
    );
  }

  public async executePurge(): Promise<number> {
    if (this.isRunning) {
      console.warn('[TrackingRetentionScheduler] Previous purge cycle still active, skipping execution');
      return 0;
    }

    this.isRunning = true;
    try {
      const deletedCount = await this.repo.purgeOldLocations(env.GPS_RETENTION_DAYS, 5000, 50, 50);
      if (deletedCount > 0) {
        console.log(
          `[TrackingRetentionScheduler] Purged ${deletedCount} stale GPS records older than ${env.GPS_RETENTION_DAYS} days`
        );
      }
      return deletedCount;
    } catch (err) {
      console.error('[TrackingRetentionScheduler] Error during scheduled telemetry purge:', err);
      return 0;
    } finally {
      this.isRunning = false;
    }
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const trackingRetentionScheduler = new TrackingRetentionScheduler();


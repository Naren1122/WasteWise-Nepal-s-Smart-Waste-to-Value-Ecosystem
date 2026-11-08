import { prisma } from '../../shared/database/prisma.service.js';
import { redis } from '../../shared/database/redis.service.js';

export interface ComponentCheck {
  status: 'UP' | 'DOWN';
  latencyMs: number;
  message?: string | undefined;
}

export interface MemoryCheck {
  status: 'NORMAL' | 'HIGH_PRESSURE';
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
}

export interface ReadinessResult {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: ComponentCheck;
    redis: ComponentCheck;
    memory: MemoryCheck;
  };
}

export class HealthService {
  async checkDatabase(): Promise<ComponentCheck> {
    const start = performance.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latencyMs = Number((performance.now() - start).toFixed(2));
      return { status: 'UP', latencyMs };
    } catch (err: unknown) {
      const latencyMs = Number((performance.now() - start).toFixed(2));
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'DOWN', latencyMs, message };
    }
  }

  async checkRedis(): Promise<ComponentCheck> {
    const start = performance.now();
    try {
      const pong = await redis.ping();
      const latencyMs = Number((performance.now() - start).toFixed(2));
      if (pong === 'PONG') {
        return { status: 'UP', latencyMs };
      }
      return { status: 'DOWN', latencyMs, message: `Unexpected ping response: ${pong}` };
    } catch (err: unknown) {
      const latencyMs = Number((performance.now() - start).toFixed(2));
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'DOWN', latencyMs, message };
    }
  }

  checkMemory(): MemoryCheck {
    const mem = process.memoryUsage();
    const heapUsedMb = Number((mem.heapUsed / (1024 * 1024)).toFixed(2));
    const heapTotalMb = Number((mem.heapTotal / (1024 * 1024)).toFixed(2));
    const rssMb = Number((mem.rss / (1024 * 1024)).toFixed(2));

    const status = heapUsedMb > 600 ? 'HIGH_PRESSURE' : 'NORMAL';
    return { status, heapUsedMb, heapTotalMb, rssMb };
  }

  async getReadiness(): Promise<ReadinessResult> {
    const [database, redisCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const memory = this.checkMemory();

    let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
    if (database.status === 'DOWN') {
      status = 'UNHEALTHY';
    } else if (redisCheck.status === 'DOWN' || memory.status === 'HIGH_PRESSURE') {
      status = 'DEGRADED';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(1)),
      checks: {
        database,
        redis: redisCheck,
        memory,
      },
    };
  }
}

export const healthService = new HealthService();


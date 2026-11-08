import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from '../health.service.js';
import { prisma } from '../../../shared/database/prisma.service.js';
import { redis } from '../../../shared/database/redis.service.js';

vi.mock('../../../shared/database/prisma.service.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../../../shared/database/redis.service.js', () => ({
  redis: {
    ping: vi.fn(),
  },
}));

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new HealthService();
  });

  describe('checkDatabase', () => {
    it('returns UP status with latency when query succeeds', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]);

      const res = await service.checkDatabase();

      expect(res.status).toBe('UP');
      expect(res.latencyMs).toBeGreaterThanOrEqual(0);
      expect(res.message).toBeUndefined();
    });

    it('returns DOWN status with error message when query fails', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection timeout'));

      const res = await service.checkDatabase();

      expect(res.status).toBe('DOWN');
      expect(res.message).toBe('Connection timeout');
    });
  });

  describe('checkRedis', () => {
    it('returns UP status when ping returns PONG', async () => {
      vi.mocked(redis.ping).mockResolvedValueOnce('PONG');

      const res = await service.checkRedis();

      expect(res.status).toBe('UP');
      expect(res.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('returns DOWN status when redis ping rejects', async () => {
      vi.mocked(redis.ping).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const res = await service.checkRedis();

      expect(res.status).toBe('DOWN');
      expect(res.message).toBe('ECONNREFUSED');
    });
  });

  describe('checkMemory', () => {
    it('evaluates process memory correctly', () => {
      const res = service.checkMemory();

      expect(res.heapUsedMb).toBeGreaterThan(0);
      expect(res.heapTotalMb).toBeGreaterThan(0);
      expect(['NORMAL', 'HIGH_PRESSURE']).toContain(res.status);
    });
  });

  describe('getReadiness', () => {
    it('returns HEALTHY when all components are UP', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]);
      vi.mocked(redis.ping).mockResolvedValueOnce('PONG');

      const res = await service.getReadiness();

      expect(res.status).toBe('HEALTHY');
      expect(res.checks.database.status).toBe('UP');
      expect(res.checks.redis.status).toBe('UP');
    });

    it('returns UNHEALTHY when database is DOWN', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('DB unreachable'));
      vi.mocked(redis.ping).mockResolvedValueOnce('PONG');

      const res = await service.getReadiness();

      expect(res.status).toBe('UNHEALTHY');
      expect(res.checks.database.status).toBe('DOWN');
    });

    it('returns DEGRADED when database is UP but redis is DOWN', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]);
      vi.mocked(redis.ping).mockRejectedValueOnce(new Error('Redis unreachable'));

      const res = await service.getReadiness();

      expect(res.status).toBe('DEGRADED');
      expect(res.checks.database.status).toBe('UP');
      expect(res.checks.redis.status).toBe('DOWN');
    });
  });
});


import { Redis } from 'ioredis';
import { env } from '../config/env.js';

/**
 * WasteWise Shared Redis Client (ioredis)
 * Supports TLS (rediss://), auto-reconnect, and error-resilient graceful fallback.
 */
class RedisService {
  private static client: Redis | null = null;
  private static isConnected: boolean = false;

  public static getInstance(): Redis {
    if (!RedisService.client) {
      RedisService.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
        retryStrategy(times: number) {
          if (times > 5) {
            console.warn('[Redis] Max reconnection attempts reached. Continuing in degraded fallback mode.');
            return null; // stop reconnecting to avoid spamming
          }
          return Math.min(times * 500, 3000);
        },
      });

      RedisService.client.on('connect', () => {
        RedisService.isConnected = true;
        console.log('[Redis] Connected to Upstash / Redis instance successfully');
      });

      RedisService.client.on('error', (err: Error) => {
        RedisService.isConnected = false;
        console.warn(`[Redis] Connection warning: ${err.message}`);
      });
    }

    return RedisService.client;
  }

  public static isReady(): boolean {
    return RedisService.isConnected;
  }

  public static async close(): Promise<void> {
    if (RedisService.client) {
      await RedisService.client.quit().catch(() => {});
      RedisService.client = null;
      RedisService.isConnected = false;
    }
  }
}

export const redis = RedisService.getInstance();
export const isRedisReady = RedisService.isReady;
export const closeRedis = RedisService.close;


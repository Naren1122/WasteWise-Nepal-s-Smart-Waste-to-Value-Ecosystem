import { describe, it, expect, vi } from 'vitest';
import { TokenBucketRateLimiter } from '../rate-limiter.js';

describe('TokenBucketRateLimiter', () => {
  it('should allow burst up to maxTokens', () => {
    const limiter = new TokenBucketRateLimiter(5, 1);

    for (let i = 0; i < 5; i++) {
      expect(limiter.tryAcquire()).toBe(true);
    }

    // 6th immediate request should be rejected
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('should refill tokens over elapsed time', () => {
    vi.useFakeTimers();
    try {
      const limiter = new TokenBucketRateLimiter(2, 1); // 1 token per second, max 2

      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(false);

      // Advance by 1 second -> 1 token refilled
      vi.advanceTimersByTime(1000);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(false);

      // Advance by 2.5 seconds -> capped at maxTokens (2)
      vi.advanceTimersByTime(2500);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});


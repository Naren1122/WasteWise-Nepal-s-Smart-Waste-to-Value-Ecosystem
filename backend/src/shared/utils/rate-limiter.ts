/**
 * In-memory Token Bucket Rate Limiter.
 * Used for per-socket and per-connection rate limiting to guard against DoS attacks.
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    public readonly maxTokens: number = 5,
    public readonly refillRatePerSec: number = 1
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Attempts to consume specified tokens. Returns true if allowed, false if limit exceeded.
   */
  public tryAcquire(cost: number = 1): boolean {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsedSec * this.refillRatePerSec);
    this.lastRefill = now;

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  public getAvailableTokens(): number {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    return Math.min(this.maxTokens, this.tokens + elapsedSec * this.refillRatePerSec);
  }
}


/**
 * RateLimitConfig defines the rate limit boundaries.
 */
export interface RateLimitConfig {
  maxRequests: number; // Maximum number of requests allowed
  windowMs: number; // Time window in milliseconds
}

/**
 * RateLimitResult contains the result of a rate limit check.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAfter: number; // Milliseconds until the window resets
  retryAfter?: number; // Seconds to retry after (for 429 responses)
}

/**
 * In-memory rate limiter using sliding window algorithm.
 * Suitable for single-instance deployments.
 * For distributed deployments, use RedisRateLimiter instead.
 */
export class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private config: RateLimitConfig,
    private cleanupInterval: number = 60000 // Clean old entries every minute
  ) {
    // Periodic cleanup of expired entries
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Check if a request is allowed for the given key.
   * @param key Unique identifier (e.g., IP address, user ID)
   * @returns RateLimitResult with allow decision and metadata
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get request timestamps for this key
    let timestamps = this.requests.get(key) || [];

    // Remove old requests outside the window
    timestamps = timestamps.filter((t) => t > windowStart);

    // Check if limit exceeded
    const allowed = timestamps.length < this.config.maxRequests;

    if (allowed) {
      timestamps.push(now);
    }

    // Update the map
    if (timestamps.length > 0) {
      this.requests.set(key, timestamps);
    } else {
      this.requests.delete(key);
    }

    // Calculate metadata
    const remaining = Math.max(0, this.config.maxRequests - timestamps.length);
    const oldestRequest = timestamps[0] || now;
    const resetAfter = Math.max(0, oldestRequest + this.config.windowMs - now);
    const retryAfter = Math.ceil(resetAfter / 1000); // Convert to seconds

    return {
      allowed,
      remaining,
      resetAfter,
      retryAfter: retryAfter > 0 ? retryAfter : undefined,
    };
  }

  /**
   * Reset the rate limit for a specific key.
   * @param key The key to reset
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data.
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Remove entries that have expired from memory.
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter((t) => t > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else if (validTimestamps.length < timestamps.length) {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

/**
 * Minimal structural type describing the subset of the Redis (Upstash) client
 * used by the rate limiter. Keeps the limiter decoupled from a specific client.
 */
interface RedisLike {
  zcount(key: string, min: number, max: string): Promise<number>;
  zadd(
    key: string,
    member: { score: number; member: string }
  ): Promise<unknown>;
  expire(key: string, seconds: number): Promise<unknown>;
  zrange(
    key: string,
    start: number,
    stop: number,
    opts: { withScores: boolean }
  ): Promise<Array<{ score: number; member?: string }>>;
  del(...keys: string[]): Promise<unknown>;
  keys(pattern: string): Promise<string[]>;
}

/**
 * Redis-backed rate limiter for distributed deployments.
 * Uses Upstash Redis for serverless environments.
 */
export class RedisRateLimiter {
  private redis: RedisLike;

  constructor(redisClient: RedisLike, private config: RateLimitConfig) {
    this.redis = redisClient;
  }

  /**
   * Check if a request is allowed for the given key.
   * @param key Unique identifier (e.g., IP address, user ID)
   * @returns RateLimitResult with allow decision and metadata
   */
  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const redisKey = `ratelimit:${key}`;

    // Get current request count in window using ZCOUNT
    const count = await this.redis.zcount(
      redisKey,
      windowStart,
      "+inf"
    );

    const allowed = count < this.config.maxRequests;

    if (allowed) {
      // Add current request with timestamp as score
      await this.redis.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
      // Set expiration to window size
      await this.redis.expire(redisKey, Math.ceil(this.config.windowMs / 1000));
    }

    const remaining = Math.max(0, this.config.maxRequests - count - (allowed ? 1 : 0));
    
    // Get oldest request in window
    const oldestMembers = await this.redis.zrange(redisKey, 0, 0, {
      withScores: true,
    });
    
    const oldestScore = oldestMembers[0]?.score || now;
    const resetAfter = Math.max(0, oldestScore + this.config.windowMs - now);
    const retryAfter = Math.ceil(resetAfter / 1000);

    return {
      allowed,
      remaining,
      resetAfter,
      retryAfter: retryAfter > 0 ? retryAfter : undefined,
    };
  }

  /**
   * Reset the rate limit for a specific key.
   * @param key The key to reset
   */
  async reset(key: string): Promise<void> {
    await this.redis.del(`ratelimit:${key}`);
  }

  /**
   * Clear all rate limit data.
   */
  async clear(): Promise<void> {
    // This is dangerous for multi-tenant systems; use with caution
    const keys = await this.redis.keys("ratelimit:*");
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

/**
 * Factory function to create the appropriate rate limiter.
 */
export function createRateLimiter(
  config: RateLimitConfig
): InMemoryRateLimiter | RedisRateLimiter {
  // Check for Redis client in environment (Upstash Redis)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = require("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return new RedisRateLimiter(redis, config);
    } catch (err) {
      console.warn(
        "Failed to initialize Redis rate limiter, falling back to in-memory:",
        err
      );
    }
  }

  return new InMemoryRateLimiter(config);
}

/**
 * Extract client IP from NextRequest headers.
 * Tries multiple headers in order: x-forwarded-for, x-real-ip, remote-addr
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Fallback - this won't work in serverless but helps in development
  return "unknown";
}

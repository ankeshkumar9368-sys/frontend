import { redis, isRedisAvailable } from './redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory fallback for rate limiting
const memoryLimiter: Record<string, { count: number, reset: number }> = {};

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const resetTime = now + windowSeconds;

  // 1. Redis is available
  if (isRedisAvailable) {
    try {
      const redisKey = `ratelimit:${key}`;
      const results = await redis
        .multi()
        .set(redisKey, 0, 'EX', windowSeconds, 'NX')
        .incr(redisKey)
        .ttl(redisKey)
        .exec();

      if (results) {
        const count = results[1][1] as number;
        const ttl = results[2][1] as number;
        return { success: count <= limit, limit, remaining: Math.max(0, limit - count), reset: now + ttl };
      }
    } catch (e) {
      console.warn('Rate Limiter Redis Error, falling back to memory.');
    }
  }

  // 2. Memory Fallback (Dev/No-Redis mode)
  if (!memoryLimiter[key] || memoryLimiter[key].reset < now) {
    memoryLimiter[key] = { count: 0, reset: resetTime };
  }

  memoryLimiter[key].count++;
  
  return {
    success: memoryLimiter[key].count <= limit,
    limit,
    remaining: Math.max(0, limit - memoryLimiter[key].count),
    reset: memoryLimiter[key].reset
  };
}

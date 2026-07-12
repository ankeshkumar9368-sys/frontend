import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

const redisConfig = redisUrl ? redisUrl : {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
};

// BullMQ requires maxRetriesPerRequest to be null
const commonOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false, // Recommended for BullMQ + Cloud Redis
};

let redis: any;
let isRedisAvailable = false;

try {
  if (redisUrl) {
    redis = new Redis(redisUrl, commonOptions);
  } else {
    redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      ...commonOptions
    });
  }
  redis.on('error', (err: any) => {
    // Only log once to avoid spamming
    if (isRedisAvailable) console.warn('⚠️ Redis connection lost.');
    isRedisAvailable = false;
  });
  redis.on('connect', () => {
    isRedisAvailable = true;
    console.log('✅ Connected to Redis (Upstash/Local)');
  });
} catch (e) {
  console.warn('⚠️ Critical Redis initialization error.');
}

// In-memory store for fallback
const memoryStore: Record<string, string> = {};

export const getCache = async (key: string) => {
  if (isRedisAvailable) return redis.get(key).then((d: any) => d ? JSON.parse(d) : null);
  return memoryStore[key] ? JSON.parse(memoryStore[key]) : null;
};

export const setCache = async (key: string, value: any, ttlSeconds = 3600 * 24) => {
  const str = JSON.stringify(value);
  if (isRedisAvailable) await redis.set(key, str, 'EX', ttlSeconds);
  memoryStore[key] = str;
};

export { redis, isRedisAvailable };
export default redis;

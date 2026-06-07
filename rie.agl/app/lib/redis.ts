import Redis from 'ioredis';

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = parseInt(process.env.REDIS_PORT || '6379');
const password = process.env.REDIS_PASSWORD || undefined;

export const redisConfig = {
  host,
  port,
  password,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableOfflineQueue: false,  // Fail fast if Redis is down
  connectTimeout: 2000,       // Timeout after 2 seconds
};

// Initialize shared connection client
let redisConnection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisConnection) {
    redisConnection = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    });
    
    redisConnection.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redisConnection.on('connect', () => {
      console.log('[Redis] Connected to instance successfully.');
    });
  }
  return redisConnection;
}

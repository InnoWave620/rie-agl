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
  connectTimeout: 5000,       // 5 seconds timeout for cloud DB
  tls: host.includes('upstash.io') ? {} : undefined,
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
      connectTimeout: 5000,
      tls: host.includes('upstash.io') ? {} : undefined,
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

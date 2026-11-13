import Redis from "ioredis";

// In-memory fallback so login/signup still works even if local Redis is stopped
const memoryFallback = new Map<string, string>();

const globalForRedis = global as unknown as {
  redisClient?: Redis;
  isRedisConnected?: boolean;
};

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const client =
  globalForRedis.redisClient ||
  new Redis(redisUrl, {
    family: 4, // Force IPv4 to prevent internalConnectMultiple AggregateError
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 2) {
        // Stop spamming AggregateError if Redis server is not running
        return null;
      }
      return Math.min(times * 200, 1000);
    },
  });

if (!globalForRedis.redisClient) {
  client.on("connect", () => {
    globalForRedis.isRedisConnected = true;
  });

  client.on("error", (err) => {
    globalForRedis.isRedisConnected = false;
    console.warn("⚠️ Redis connection unavailable, using in-memory session fallback.");
  });

  globalForRedis.redisClient = client;
}

// Unified wrapper used by src/lib/auth.ts
export const redis = {
  async keys(pattern: string): Promise<string[]> {
    if (globalForRedis.isRedisConnected && client.status === "ready") {
      try {
        return await client.keys(pattern);
      } catch {
        // Fall through to memory fallback
      }
    }
    const prefix = pattern.replace("*", "");
    return Array.from(memoryFallback.keys()).filter((k) => k.startsWith(prefix));
  },
  async set(key: string, value: string, mode?: string, duration?: number) {
    if (globalForRedis.isRedisConnected && client.status === "ready") {
      try {
        if (mode === "EX" && duration) {
          return await client.set(key, value, "EX", duration);
        }
        return await client.set(key, value);
      } catch {
        // Fall through to memory fallback
      }
    }
    memoryFallback.set(key, value);
    return "OK";
  },

  async get(key: string): Promise<string | null> {
    if (globalForRedis.isRedisConnected && client.status === "ready") {
      try {
        return await client.get(key);
      } catch {
        // Fall through to memory fallback
      }
    }
    return memoryFallback.get(key) ?? null;
  },

  async del(key: string) {
    if (globalForRedis.isRedisConnected && client.status === "ready") {
      try {
        return await client.del(key);
      } catch {
        // Fall through to memory fallback
      }
    }
    memoryFallback.delete(key);
    return 1;
  },
};

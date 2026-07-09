const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');

let redisClient;
let apiRedisStore;
let aiRedisStore;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false
    });
    
    redisClient.on('error', (err) => {
      // Handle connection errors quietly
    });

    redisClient.on('ready', () => {
      try {
        const { RedisStore } = require('rate-limit-redis');
        apiRedisStore = new RedisStore({
          sendCommand: async (...args) => redisClient.call(...args),
          prefix: 'rl:api:'
        });
        aiRedisStore = new RedisStore({
          sendCommand: async (...args) => redisClient.call(...args),
          prefix: 'rl:ai:'
        });
        console.log('Redis rate limiting stores initialized successfully.');
      } catch (err) {
        console.warn('Failed to initialize Redis stores on ready:', err.message);
      }
    });
  } catch (err) {
    console.warn('Could not initialize Redis client.');
  }
}

/**
 * Custom Proxy Store that handles Redis fallback to MemoryStore
 */
class ProxyStore {
  constructor(getRedisStore) {
    this.memoryStore = new rateLimit.MemoryStore();
    this.getRedisStore = getRedisStore;
  }

  init(options) {
    this.memoryStore.init(options);
  }

  async increment(key) {
    const redisStore = this.getRedisStore();
    if (redisStore && redisClient && redisClient.status === 'ready') {
      try {
        return await redisStore.increment(key);
      } catch (err) {
        // Fallback to memory on failure
      }
    }
    return await this.memoryStore.increment(key);
  }

  async decrement(key) {
    const redisStore = this.getRedisStore();
    if (redisStore && redisClient && redisClient.status === 'ready') {
      try {
        return await redisStore.decrement(key);
      } catch (err) {
        // Fallback
      }
    }
    return await this.memoryStore.decrement(key);
  }

  async resetKey(key) {
    const redisStore = this.getRedisStore();
    if (redisStore && redisClient && redisClient.status === 'ready') {
      try {
        return await redisStore.resetKey(key);
      } catch (err) {
        // Fallback
      }
    }
    return await this.memoryStore.resetKey(key);
  }
}

const apiLimiter = rateLimit.rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ProxyStore(() => apiRedisStore),
  message: { error: 'Too many requests. Please try again after 15 minutes.' }
});

const aiLimiter = rateLimit.rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ProxyStore(() => aiRedisStore),
  message: { error: 'AI generation rate limit reached. Please wait a minute before requesting again.' }
});

module.exports = { apiLimiter, aiLimiter };

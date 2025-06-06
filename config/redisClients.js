// redisClients.js
import Redis from 'ioredis';

// Redis configuration options
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  // Add TLS options if needed
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
};

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  connect() {
    try {
      this.client = new Redis(REDIS_CONFIG);

      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('Redis client connection closed');
        this.isConnected = false;
      });

      return this.client;
    } catch (error) {
      console.error('Failed to create Redis client:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.client) {
      return this.connect();
    }
    return this.client;
  }

  async quit() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
    }
  }
}

// Create and export a singleton instance
const redisClient = new RedisClient();
export default redisClient.getClient();

// Export the class for testing purposes
export { RedisClient };

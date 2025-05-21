const { createClient } = require('redis');
const config = require('../config');
const logger = require('./logger');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.client = createClient({
                url: config.redis.url
            });

            this.client.on('error', (err) => {
                logger.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                logger.info('Redis Client Connected');
                this.isConnected = true;
            });

            await this.client.connect();
        } catch (error) {
            logger.error('Redis Connection Error:', error);
            this.isConnected = false;
        }
    }

    async get(key) {
        try {
            if (!this.isConnected) return null;
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Redis Get Error:', error);
            return null;
        }
    }

    async set(key, value, expireIn = 3600) {
        try {
            if (!this.isConnected) return false;
            await this.client.set(key, JSON.stringify(value), {
                EX: expireIn
            });
            return true;
        } catch (error) {
            logger.error('Redis Set Error:', error);
            return false;
        }
    }

    async delete(key) {
        try {
            if (!this.isConnected) return false;
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Redis Delete Error:', error);
            return false;
        }
    }

    async clearCache() {
        try {
            if (!this.isConnected) return false;
            await this.client.flushAll();
            return true;
        } catch (error) {
            logger.error('Redis Clear Cache Error:', error);
            return false;
        }
    }
}

const redisClient = new RedisClient();
module.exports = redisClient;

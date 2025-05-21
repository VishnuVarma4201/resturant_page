const redisClient = require('../utils/redis');
const logger = require('../utils/logger');

const cache = (duration = 3600) => {
    return async (req, res, next) => {
        // Skip caching for non-GET requests or authenticated routes
        if (req.method !== 'GET' || req.user) {
            return next();
        }

        // Create a unique cache key including query parameters
        const key = `cache:${req.originalUrl || req.url}:${JSON.stringify(req.query)}`;

        try {
            const cachedResponse = await redisClient.get(key);
            
            if (cachedResponse) {
                // Add cache headers
                res.set('X-Cache', 'HIT');
                return res.json(JSON.parse(cachedResponse));
            }
            res.set('X-Cache', 'MISS');

            // Store original send function
            const originalSend = res.json;

            // Override res.json method
            res.json = function (body) {
                // Restore original send
                res.json = originalSend;

                // Cache the response
                redisClient.set(key, JSON.stringify(body), duration)
                    .catch(err => logger.error('Cache Set Error:', err));

                // Send the response
                return res.json.call(this, body);
            };

            next();
        } catch (error) {
            logger.error('Cache Middleware Error:', error);
            next();
        }
    };
};

const clearCache = (pattern) => {
    return async (req, res, next) => {
        try {
            if (pattern) {
                // Clear specific pattern
                const keys = await redisClient.client.keys(pattern);
                if (keys.length > 0) {
                    await Promise.all(keys.map(key => redisClient.delete(key)));
                    logger.debug(`Cleared cache for pattern: ${pattern}`);
                }
            } else {
                // Clear all cache
                await redisClient.clearCache();
                logger.debug('Cleared all cache');
            }
        } catch (error) {
            logger.error('Clear Cache Error:', error);
        }
        next();
    };
};

module.exports = {
    cache,
    clearCache
};

const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { logger } = require('./error-handler');

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: { error: message },
    handler: (req, res, _next, options) => {
        logger.warn(`Rate limit exceeded: ${req.ip}`);
        res.status(429).json(options.message);
    }
});

// Different rate limits for different endpoints
const limiters = {
    general: createRateLimiter(15 * 60 * 1000, 100, 'Too many requests, please try again later'),
    auth: createRateLimiter(60 * 60 * 1000, 5, 'Too many login attempts'),
    booking: createRateLimiter(60 * 60 * 1000, 10, 'Booking limit reached'),
    api: {
        tickets: createRateLimiter(60 * 1000, 30, 'Too many ticket requests'),
        payments: createRateLimiter(60 * 1000, 5, 'Too many payment attempts'),
        admin: createRateLimiter(15 * 60 * 1000, 50, 'Too many admin requests')
    }
};

// Compression middleware
const compressionMiddleware = compression({
    level: 6,
    threshold: 100 * 1024, // 100kb
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
});

// Add burst handling
const burstLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 10, // max 10 requests per second
    message: { error: 'Too many requests in a short time' }
});

module.exports = {
    limiters,
    compressionMiddleware,
    burstLimiter
};
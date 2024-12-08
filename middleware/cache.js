const { logger } = require('./error-handler');

const cacheControl = (duration) => {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.set('Cache-Control', `public, max-age=${duration}`);
            logger.debug(`Cache-Control set for ${req.path}: ${duration}s`);
        }
        next();
    };
};

// Different cache durations for different types of content
const cacheMiddleware = {
    static: cacheControl(24 * 60 * 60), // 24 hours for static files
    dynamic: cacheControl(5 * 60), // 5 minutes for dynamic content
    slots: cacheControl(2 * 60), // 2 minutes for slot availability
    prices: cacheControl(60 * 60), // 1 hour for ticket prices
    news: cacheControl(10 * 60), // 10 minutes for news items
    noCache: (req, res, next) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        next();
    }
};

// Add cache buster for admin routes
const adminCacheBuster = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};

module.exports = {
    ...cacheMiddleware,
    adminCacheBuster
};
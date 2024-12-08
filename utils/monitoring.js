const { logger } = require('../middleware/error-handler');
const os = require('os');

class Monitoring {
    constructor() {
        this.metrics = {
            startTime: Date.now(),
            requests: 0,
            errors: 0,
            bookings: 0
        };
    }

    trackRequest() {
        this.metrics.requests++;
    }

    trackError() {
        this.metrics.errors++;
    }

    trackBooking() {
        this.metrics.bookings++;
    }

    getMetrics() {
        const uptime = Date.now() - this.metrics.startTime;
        return {
            uptime,
            requests: this.metrics.requests,
            errors: this.metrics.errors,
            bookings: this.metrics.bookings,
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem()
            },
            cpu: os.loadavg()
        };
    }

    logMetrics() {
        const metrics = this.getMetrics();
        logger.info('System metrics:', metrics);
    }

    checkThresholds() {
        const metrics = this.getMetrics();

        // Memory usage alert (if over 90%)
        const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100;
        if (memoryUsagePercent > 90) {
            logger.error('ALERT: High memory usage', {
                usage: `${memoryUsagePercent.toFixed(2)}%`,
                free: `${(metrics.memory.free / 1024 / 1024).toFixed(2)}MB`
            });
        }

        // Error rate alert (if over 5%)
        const errorRate = (metrics.errors / metrics.requests) * 100;
        if (errorRate > 5) {
            logger.error('ALERT: High error rate', {
                rate: `${errorRate.toFixed(2)}%`,
                errors: metrics.errors,
                requests: metrics.requests
            });
        }

        // CPU load alert (if over 80%)
        if (metrics.cpu[0] > 80) {
            logger.error('ALERT: High CPU usage', {
                load: metrics.cpu[0].toFixed(2)
            });
        }
    }
}

const monitor = new Monitoring();

// Log metrics every 5 minutes
setInterval(() => {
    monitor.logMetrics();
    monitor.checkThresholds();
}, 5 * 60 * 1000);

module.exports = monitor;
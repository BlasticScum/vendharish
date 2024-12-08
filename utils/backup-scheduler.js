const cron = require('node-cron');
const createBackup = require('../scripts/backup');
const cleanup = require('../scripts/cleanup');
const { logger } = require('../middleware/error-handler');

// Schedule daily backup at 2 AM
cron.schedule('0 2 * * *', async () => {
    try {
        logger.info('Starting scheduled backup...');
        await createBackup();
        logger.info('Scheduled backup completed');

        // Run cleanup after backup
        await cleanup();
        logger.info('Cleanup completed');
    } catch (error) {
        logger.error('Scheduled backup failed:', error);
    }
});

// Schedule weekly full backup on Sunday at 3 AM
cron.schedule('0 3 * * 0', async () => {
    try {
        logger.info('Starting weekly full backup...');
        await createBackup({ full: true });
        logger.info('Weekly full backup completed');
    } catch (error) {
        logger.error('Weekly backup failed:', error);
    }
});
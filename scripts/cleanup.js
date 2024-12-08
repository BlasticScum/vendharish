const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../middleware/error-handler');

const MAX_AGE_DAYS = 30;

async function cleanup() {
    const directories = [
        path.join(__dirname, '../logs'),
        path.join(__dirname, '../backups')
    ];

    const now = Date.now();
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    for (const dir of directories) {
        try {
            const files = await fs.readdir(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);

                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    logger.info(`Deleted old file: ${file}`);
                }
            }
        } catch (error) {
            logger.error(`Cleanup error in ${dir}:`, error);
        }
    }
}

if (require.main === module) {
    cleanup();
}

module.exports = cleanup;
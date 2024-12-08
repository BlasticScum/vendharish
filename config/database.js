const mysql = require('mysql');
const { logger } = require('../middleware/error-handler');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    timezone: 'UTC',
    ssl: process.env.NODE_ENV === 'production'
});

// Promisify pool query
pool.queryAsync = function (sql, values) {
    return new Promise((resolve, reject) => {
        pool.query(sql, values, (error, results) => {
            if (error) {
                logger.error('Database error:', error);
                return reject(error);
            }
            resolve(results);
        });
    });
};

// Monitor pool events
pool.on('connection', () => {
    logger.info('New database connection established');
});

pool.on('error', (err) => {
    logger.error('Database pool error:', err);
});

module.exports = pool;
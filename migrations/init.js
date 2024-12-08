const mysql = require('mysql');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function connectWithRetry(retries = MAX_RETRIES) {
    const connection = mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        port: process.env.MYSQLPORT,
        multipleStatements: true
    });

    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                console.error(`Failed to connect to database (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, err);
                if (retries > 1) {
                    console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
                    setTimeout(() => {
                        connectWithRetry(retries - 1)
                            .then(resolve)
                            .catch(reject);
                    }, RETRY_DELAY);
                } else {
                    reject(err);
                }
            } else {
                console.log('Connected to database successfully');
                resolve(connection);
            }
        });
    });
}

async function runMigrations() {
    try {
        const connection = await connectWithRetry();
        const sqlFile = path.join(__dirname, '../db.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('Running migrations...');
        connection.query(sql, (err, results) => {
            if (err) {
                console.error('Error running migrations:', err);
                process.exit(1);
            }
            console.log('Migrations completed successfully');
            connection.end();
            process.exit(0);
        });
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();
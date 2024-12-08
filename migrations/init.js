const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

// First connection without database to create it if needed
const initialConnection = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    port: process.env.MYSQLPORT,
    multipleStatements: true
});

// Read SQL file content
const fs = require('fs');
const path = require('path');
const sqlFile = path.join(__dirname, '../db.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

async function runMigrations() {
    try {
        // First, create database if it doesn't exist
        await new Promise((resolve, reject) => {
            initialConnection.connect((err) => {
                if (err) {
                    console.error('Error connecting to MySQL:', err);
                    reject(err);
                    return;
                }
                console.log('Connected to MySQL server');

                initialConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQLDATABASE}`, (err) => {
                    if (err) {
                        console.error('Error creating database:', err);
                        reject(err);
                        return;
                    }
                    console.log('Database created or already exists');
                    initialConnection.end();
                    resolve();
                });
            });
        });

        // Now connect with database selected
        const connection = mysql.createConnection({
            host: process.env.MYSQLHOST,
            user: process.env.MYSQLUSER,
            password: process.env.MYSQLPASSWORD,
            database: process.env.MYSQLDATABASE,
            port: process.env.MYSQLPORT,
            multipleStatements: true
        });

        await new Promise((resolve, reject) => {
            connection.connect((err) => {
                if (err) {
                    console.error('Error connecting to database:', err);
                    reject(err);
                    return;
                }
                console.log('Connected to database. Running migrations...');

                connection.query(sql, (err, results) => {
                    if (err) {
                        console.error('Error running migrations:', err);
                        reject(err);
                        return;
                    }
                    console.log('Migrations completed successfully');
                    connection.end();
                    resolve();
                });
            });
        });
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();
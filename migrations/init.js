const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    port: process.env.MYSQLPORT,
    multipleStatements: true // Enable multiple statements for migrations
});

// Read SQL file content
const fs = require('fs');
const path = require('path');
const sqlFile = path.join(__dirname, '../db.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Run migrations
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }

    console.log('Connected to database. Running migrations...');

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error running migrations:', err);
            process.exit(1);
        }

        console.log('Migrations completed successfully');
        connection.end();
    });
}); 
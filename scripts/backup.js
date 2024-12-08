const mysqldump = require('mysqldump');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config();

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const filePath = path.join(backupDir, `backup-${timestamp}.sql`);

    try {
        await mysqldump({
            connection: {
                host: process.env.MYSQLHOST,
                user: process.env.MYSQLUSER,
                password: process.env.MYSQLPASSWORD,
                database: process.env.MYSQLDATABASE,
                port: process.env.MYSQLPORT
            },
            dumpToFile: filePath
        });
        console.log(`Backup created successfully: ${filePath}`);
    } catch (error) {
        console.error('Backup failed:', error);
    }
}

// Run backup if script is called directly
if (require.main === module) {
    createBackup();
}

module.exports = createBackup; 
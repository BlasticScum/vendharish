const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/health', async (req, res) => {
    try {
        // Check database connection
        await pool.queryAsync('SELECT 1');

        // Check system settings
        const settings = await pool.queryAsync('SELECT * FROM settings');

        res.json({
            status: 'healthy',
            database: 'connected',
            settings: settings.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router;
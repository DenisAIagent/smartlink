const express = require('express');
const router = express.Router();
const pool = require('../db/connection.js');
const { verifyToken } = require('../middleware/auth.js');

// GET /api/dashboard/stats - Get key statistics for the logged-in user.
router.get('/stats', verifyToken, async (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT
            (SELECT COUNT(*) FROM smartlinks WHERE user_id = $1) AS total_links,
            (SELECT COALESCE(SUM(clicks), 0) FROM smartlinks WHERE user_id = $1) AS total_clicks;
    `;

    try {
        const result = await pool.query(query, [userId]);
        const stats = result.rows[0];

        // Conversion rate is not well-defined by the schema. Returning a placeholder.
        // To implement this, a `views` column would be needed on the smartlinks table.
        const conversionRate = "N/A";

        res.status(200).json({
            totalLinks: parseInt(stats.total_links, 10),
            totalClicks: parseInt(stats.total_clicks, 10),
            conversionRate: conversionRate,
        });
    } catch (error) {
        console.error(`[DASHBOARD STATS ERROR] for user ${userId}:`, error);
        res.status(500).json({ code: 'DB002', message: 'Failed to retrieve dashboard statistics.' });
    }
});

// GET /api/dashboard/me - Get the current user's info from their token
router.get('/me', verifyToken, (req, res) => {
    // The verifyToken middleware attaches the decoded token payload to req.user
    res.status(200).json({ user: req.user });
});


module.exports = router;

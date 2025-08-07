const express = require('express');
const router = express.Router();
const pool = require('../db/connection.js');
const { verifyToken } = require('../middleware/auth.js');
const { nanoid } = require('nanoid');
const { broadcast } = require('../services/websocket.js');

// Protect all smartlink routes
router.use(verifyToken);

// GET /api/smartlinks - Get all smartlinks for the logged-in user
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM smartlinks WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(`[GET /smartlinks] Error for user ${req.user.id}:`, error);
        res.status(500).json({ code: 'DB002', message: 'Failed to retrieve smartlinks.' });
    }
});

// POST /api/smartlinks - Create a new smartlink
router.post('/', async (req, res) => {
    const { title, artist_name, artwork_url, spotify_url, apple_music_url, youtube_url } = req.body;

    if (!title || !artist_name) {
        return res.status(400).json({ code: 'INVALID_INPUT', message: 'Title and artist name are required.' });
    }

    const slug = nanoid(8); // Generate a short, unique slug

    try {
        const result = await pool.query(
            `INSERT INTO smartlinks (user_id, title, artist_name, artwork_url, spotify_url, apple_music_url, youtube_url, slug)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [req.user.id, title, artist_name, artwork_url, spotify_url, apple_music_url, youtube_url, slug]
        );
        broadcast({ type: 'SMARTLINKS_UPDATED', userId: req.user.id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(`[POST /smartlinks] Error for user ${req.user.id}:`, error);
        // 23505 is the unique violation error code in postgres
        if (error.code === '23505' && error.constraint === 'smartlinks_slug_key') {
             return res.status(409).json({ code: 'SLUG_CONFLICT', message: 'Could not generate a unique slug. Please try again.' });
        }
        res.status(500).json({ code: 'DB001', message: 'Failed to create smartlink.' });
    }
});

// PUT /api/smartlinks/:id - Update an existing smartlink
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, artist_name, artwork_url, spotify_url, apple_music_url, youtube_url } = req.body;

    if (!title || !artist_name) {
        return res.status(400).json({ code: 'INVALID_INPUT', message: 'Title and artist name are required.' });
    }

    try {
        const result = await pool.query(
            `UPDATE smartlinks
             SET title = $1, artist_name = $2, artwork_url = $3, spotify_url = $4, apple_music_url = $5, youtube_url = $6
             WHERE id = $7 AND user_id = $8
             RETURNING *`,
            [title, artist_name, artwork_url, spotify_url, apple_music_url, youtube_url, id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Smartlink not found or you do not have permission to edit it.' });
        }

        broadcast({ type: 'SMARTLINKS_UPDATED', userId: req.user.id });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`[PUT /smartlinks/${id}] Error for user ${req.user.id}:`, error);
        res.status(500).json({ code: 'DB001', message: 'Failed to update smartlink.' });
    }
});

// DELETE /api/smartlinks/:id - Delete a smartlink
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM smartlinks WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Smartlink not found or you do not have permission to delete it.' });
        }

        broadcast({ type: 'SMARTLINKS_UPDATED', userId: req.user.id });
        res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
        console.error(`[DELETE /smartlinks/${id}] Error for user ${req.user.id}:`, error);
        res.status(500).json({ code: 'DB001', message: 'Failed to delete smartlink.' });
    }
});


module.exports = router;

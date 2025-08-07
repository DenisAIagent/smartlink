const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection.js');
const { loginLimiter } = require('../middleware/rateLimit.js');

const router = express.Router();

// Helper to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET, // In a real-world scenario, you might use a different secret for refresh tokens
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!process.env.JWT_SECRET) {
    console.error('[AUTH ERROR] JWT_SECRET is not set in the environment.');
    return res.status(500).json({ code: 'AUTH_CONFIG_ERROR', message: 'Server authentication is not configured.' });
  }

  if (!email || !password) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Email and password are required.' });
  }

  const client = await pool.connect();
  try {
    // 1. Find the user by email
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ code: 'AUTH001', message: 'Invalid credentials.' });
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ code: 'AUTH001', message: 'Invalid credentials.' });
    }

    // 3. Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // 4. Store refresh token hash in the database
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await client.query(
      'INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [user.id, refreshTokenHash, expiresAt, req.ip, req.headers['user-agent']]
    );

    // 5. Update last_login timestamp
    await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // 6. Send tokens to client
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ code: 'DB001', message: 'An internal server error occurred.' });
  } finally {
    client.release();
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  // Logic for refreshing tokens will be implemented here in a later step.
  // This will involve:
  // 1. Getting the refresh token from the HttpOnly cookie.
  // 2. Verifying the token.
  // 3. Looking up the token hash in the `sessions` table.
  // 4. Implementing token rotation (issuing a new refresh token and invalidating the old one).
  // 5. Generating and sending a new access token.
  res.status(501).json({ message: 'Refresh endpoint not implemented yet.' });
});

module.exports = router;

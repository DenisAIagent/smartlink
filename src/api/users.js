const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query, queryOne } = require('../lib/db');
const { sendWelcomeEmail } = require('../services/email');

/**
 * User Management API
 * Superadmin only endpoints for managing users
 */

// Get all users (admin only)
async function getAllUsers(req, res) {
  try {
    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const users = await query(`
      SELECT
        u.id,
        u.email,
        u.display_name,
        u.plan,
        u.is_admin,
        u.smartlinks_count,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        u.email_verified,
        COUNT(DISTINCT s.id) as actual_smartlinks_count
      FROM users u
      LEFT JOIN smartlinks s ON s.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// Get single user (admin only)
async function getUser(req, res) {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    const user = await queryOne(`
      SELECT
        u.*,
        COUNT(DISTINCT s.id) as actual_smartlinks_count
      FROM users u
      LEFT JOIN smartlinks s ON s.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't send password hash
    delete user.password_hash;

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

// Create new user (admin only)
async function createUser(req, res) {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { email, display_name, plan = 'free', is_admin = false } = req.body;

    // Validate required fields
    if (!email || !display_name) {
      return res.status(400).json({ error: 'Email and display name are required' });
    }

    // Check if email already exists
    const existingUser = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate setup token for password creation
    const setupToken = crypto.randomBytes(32).toString('hex');
    const setupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user without password (will be set via email link)
    const newUser = await queryOne(`
      INSERT INTO users (
        email,
        display_name,
        plan,
        is_admin,
        email_verified,
        reset_token,
        reset_token_expires,
        password_hash,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, false, $5, $6, '', NOW(), NOW())
      RETURNING id, email, display_name, plan, is_admin, created_at
    `, [email, display_name, plan, is_admin, setupToken, setupTokenExpiry]);

    // Send welcome email with password setup link
    const emailSent = await sendWelcomeEmail(email, display_name, setupToken);

    if (!emailSent) {
      console.warn(`Failed to send welcome email to ${email}, but user was created`);
    }

    res.json({
      user: newUser,
      message: `Utilisateur créé avec succès. Un email avec un lien pour définir le mot de passe a été envoyé à ${email}`,
      emailSent: emailSent
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

// Update user (admin only)
async function updateUser(req, res) {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { email, password, display_name, plan, is_admin } = req.body;

    // Prevent modifying superadmin accounts (id 1 and 2)
    if ((id === '1' || id === '2') && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Cannot modify protected admin accounts' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (email !== undefined) {
      // Check if email already exists for another user
      const existingUser = await queryOne('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(display_name);
    }

    if (plan !== undefined) {
      updates.push(`plan = $${paramCount++}`);
      values.push(plan);
    }

    if (is_admin !== undefined) {
      // Prevent removing admin rights from self
      if (!is_admin && req.user.id === parseInt(id)) {
        return res.status(400).json({ error: 'Cannot remove admin rights from yourself' });
      }
      updates.push(`is_admin = $${paramCount++}`);
      values.push(is_admin);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, display_name, plan, is_admin, updated_at
    `;

    const updatedUser = await queryOne(updateQuery, values);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

// Delete user (admin only)
async function deleteUser(req, res) {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    // Prevent deleting superadmin accounts
    if (id === '1' || id === '2') {
      return res.status(403).json({ error: 'Cannot delete protected admin accounts' });
    }

    // Prevent deleting self
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user (cascade will handle smartlinks and analytics)
    const result = await queryOne(
      'DELETE FROM users WHERE id = $1 RETURNING id, email',
      [id]
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', user: result });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

// Helper function to generate random password
function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
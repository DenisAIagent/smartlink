const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { queryOne, query } = require('../lib/db');

// Debug: Check if we have required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ MISSING JWT_SECRET environment variable');
}
if (!process.env.DATABASE_URL) {
  console.error('❌ MISSING DATABASE_URL environment variable');
}

/**
 * POST /api/auth/login - User login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis'
      });
    }
    
    // Find user
    const user = await queryOne(
      'SELECT id, email, password_hash, display_name, plan, is_admin FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }
    
    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        plan: user.plan,
        is_admin: user.is_admin
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Set secure cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        plan: user.plan
      },
      token // Also return for localStorage usage
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur de connexion'
    });
  }
}

/**
 * POST /api/auth/logout - User logout
 */
async function logout(req, res) {
  try {
    // Clear cookie
    res.clearCookie('auth_token');
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur de déconnexion'
    });
  }
}

/**
 * GET /api/auth/me - Get current user
 */
async function getCurrentUser(req, res) {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.auth_token;
    
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      });
    }
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data
    const user = await queryOne(
      'SELECT id, email, display_name, plan, is_admin, smartlinks_count, created_at FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        plan: user.plan,
        is_admin: user.is_admin,
        smartlinks_count: user.smartlinks_count,
        created_at: user.created_at
      }
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }
    
    console.error('❌ Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
}

/**
 * Middleware to extract user from cookie or header
 */
function authMiddleware(req, res, next) {
  // Get token from cookie or Authorization header
  let token = req.cookies?.auth_token;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token d\'authentification requis'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token invalide'
    });
  }
}

/**
 * PUT /api/auth/profile - Update user profile
 */
async function updateProfile(req, res) {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.auth_token;

    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { display_name, password } = req.body;

    // Validation
    if (!display_name) {
      return res.status(400).json({
        success: false,
        error: 'Le nom d\'affichage est requis'
      });
    }

    let updateQuery = 'UPDATE users SET display_name = $1, updated_at = NOW() WHERE id = $2';
    let params = [display_name, decoded.id];

    // If password is provided, hash it and update
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery = 'UPDATE users SET display_name = $1, password_hash = $2, updated_at = NOW() WHERE id = $3';
      params = [display_name, hashedPassword, decoded.id];
    }

    await query(updateQuery, params);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
}

/**
 * GET /api/admin/users - List all users (admin only)
 */
async function listUsers(req, res) {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.auth_token;

    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      });
    }

    // Verify JWT and check admin status
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if current user is admin
    const currentUser = await queryOne(
      'SELECT is_admin FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!currentUser || !currentUser.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé - Privilèges administrateur requis'
      });
    }

    // Get all users with their stats
    const users = await query(
      `SELECT
        id, email, display_name, plan, is_admin,
        smartlinks_count, created_at, updated_at, last_login_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users: users || []
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    console.error('❌ List users error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
}

/**
 * POST /api/admin/users - Create a new user (admin only)
 */
async function createUser(req, res) {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.auth_token;

    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      });
    }

    // Verify JWT and check admin status
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if current user is admin
    const currentUser = await queryOne(
      'SELECT is_admin FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!currentUser || !currentUser.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé - Privilèges administrateur requis'
      });
    }

    const { display_name, email, password, plan = 'free', is_admin = false } = req.body;

    // Validation
    if (!display_name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nom, email et mot de passe requis'
      });
    }

    // Check if email already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Cet email est déjà utilisé'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await queryOne(
      `INSERT INTO users (email, password_hash, display_name, plan, is_admin, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, display_name, plan, is_admin`,
      [email.toLowerCase(), hashedPassword, display_name, plan, is_admin]
    );

    res.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: newUser
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    console.error('❌ Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
}

/**
 * POST /api/auth/forgot-password - Request password reset
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'L\'adresse email est requise'
      });
    }

    // Find user
    const user = await queryOne(
      'SELECT id, email, display_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({
        success: true,
        message: 'Si votre email existe dans notre système, vous recevrez un lien de réinitialisation.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in database
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetTokenExpiry, user.id]
    );

    // In development, return the reset link
    if (process.env.NODE_ENV !== 'production') {
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

      return res.json({
        success: true,
        message: 'Email de réinitialisation envoyé.',
        resetUrl: resetUrl, // Only in dev mode
        devInfo: {
          token: resetToken,
          email: user.email
        }
      });
    }

    // TODO: In production, send actual email here
    // Example with nodemailer or your email service

    res.json({
      success: true,
      message: 'Si votre email existe dans notre système, vous recevrez un lien de réinitialisation.'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
}

/**
 * POST /api/auth/reset-password - Reset password with token
 */
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    // Validation
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token et nouveau mot de passe requis'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Find user with valid token
    const user = await queryOne(
      'SELECT id, email, reset_token_expires FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
}

/**
 * POST /api/auth/set-password - Set password for new user with setup token
 */
async function setPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token et mot de passe requis'
      });
    }

    // Find user with valid setup token
    const user = await queryOne(`
      SELECT id, email, display_name, reset_token_expires
      FROM users
      WHERE reset_token = $1 AND reset_token_expires > NOW() AND password_hash = ''
    `, [token]);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Update user with password and clear the setup token
    await query(`
      UPDATE users
      SET password_hash = $1,
          reset_token = NULL,
          reset_token_expires = NULL,
          email_verified = true,
          updated_at = NOW()
      WHERE id = $2
    `, [hashedPassword, user.id]);

    res.json({
      success: true,
      message: 'Mot de passe défini avec succès. Vous pouvez maintenant vous connecter.',
      user: {
        email: user.email,
        display_name: user.display_name
      }
    });

  } catch (error) {
    console.error('❌ Set password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la définition du mot de passe'
    });
  }
}

module.exports = {
  login,
  logout,
  getCurrentUser,
  updateProfile,
  createUser,
  listUsers,
  authMiddleware,
  forgotPassword,
  resetPassword,
  setPassword
};
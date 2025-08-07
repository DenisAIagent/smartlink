const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT access token from the Authorization header.
 * Attaches the decoded user payload to req.user on success.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(403).json({ code: 'AUTH005', message: 'No token provided.' });
  }

  // Token should be in the format "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ code: 'AUTH005', message: 'Malformed token.' });
  }

  if (!process.env.JWT_SECRET) {
      console.error('[AUTH ERROR] JWT_SECRET is not set. Cannot verify token.');
      return res.status(500).json({ code: 'AUTH_CONFIG_ERROR', message: 'Server authentication is not configured.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ code: 'AUTH002', message: 'Token expired.' });
      }
      return res.status(401).json({ code: 'AUTH006', message: 'Invalid token.' });
    }

    // Attach user payload to the request object
    req.user = decoded;
    next();
  });
};

/**
 * Middleware to check for a specific role.
 * Must be used after verifyToken.
 * @param {string} requiredRole - The role required to access the route.
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (req.user && req.user.role === requiredRole) {
      next();
    } else {
      res.status(403).json({ code: 'AUTH003', message: 'Insufficient permissions.' });
    }
  };
};


module.exports = {
  verifyToken,
  requireRole,
};

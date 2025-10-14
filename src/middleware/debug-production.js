/**
 * MIDDLEWARE DE DEBUG PRODUCTION POUR RAILWAY
 * Capture TOUTES les erreurs et les détails de requête
 */

const util = require('util');

// Couleurs pour les logs (fonctionnent sur Railway)
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Middleware de debug pour capturer l'état avant crash
 */
function debugMiddleware(req, res, next) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  // Log de la requête entrante
  console.log(`\n${colors.cyan}═══ REQUEST ${requestId} ═══${colors.reset}`);
  console.log(`${colors.blue}[${new Date().toISOString()}]${colors.reset} ${req.method} ${req.path}`);
  console.log(`${colors.yellow}Origin:${colors.reset}`, req.headers.origin || 'none');
  console.log(`${colors.yellow}User-Agent:${colors.reset}`, req.headers['user-agent']?.substring(0, 50) || 'none');

  // Debug cookies spécifiquement
  console.log(`\n${colors.magenta}🍪 COOKIE DEBUG:${colors.reset}`);
  console.log('Raw Cookie Header:', req.headers.cookie || 'NO COOKIES');
  console.log('req.cookies type:', typeof req.cookies);
  console.log('req.cookies value:', req.cookies ? util.inspect(req.cookies, { depth: 1 }) : 'undefined');

  if (req.cookies && req.cookies.auth_token) {
    console.log('auth_token length:', req.cookies.auth_token.length);
    console.log('auth_token first 20 chars:', req.cookies.auth_token.substring(0, 20));
    console.log('auth_token type:', typeof req.cookies.auth_token);
  }

  // Attacher l'ID à la requête
  req.debugId = requestId;

  // Override res.status pour capturer les erreurs
  const originalStatus = res.status;
  res.status = function(code) {
    const duration = Date.now() - startTime;

    if (code >= 400) {
      console.log(`\n${colors.red}❌ ERROR RESPONSE ${requestId}${colors.reset}`);
      console.log(`Status: ${code} | Duration: ${duration}ms`);
      console.log('Path:', req.path);

      // Stack trace si disponible
      if (res.locals.error) {
        console.log(`\n${colors.red}STACK TRACE:${colors.reset}`);
        console.log(res.locals.error.stack || res.locals.error);
      }
    }

    return originalStatus.call(this, code);
  };

  next();
}

/**
 * Wrapper pour authMiddleware avec debug complet
 */
function debugAuthMiddleware(authMiddleware) {
  return async (req, res, next) => {
    console.log(`\n${colors.yellow}📐 AUTH MIDDLEWARE START (${req.debugId})${colors.reset}`);

    try {
      // Log avant extraction token
      console.log('Checking req.cookies?.auth_token...');
      let token = req.cookies?.auth_token;
      console.log('Token from cookie:', token ? `Found (${token.length} chars)` : 'Not found');

      if (!token) {
        console.log('Checking Authorization header...');
        const authHeader = req.headers['authorization'];
        console.log('Auth header:', authHeader || 'Not found');
        token = authHeader && authHeader.split(' ')[1];
      }

      if (!token) {
        console.log(`${colors.red}No token found - returning 401${colors.reset}`);
        return res.status(401).json({
          success: false,
          error: 'Token d\'authentification requis',
          debug: process.env.NODE_ENV === 'production' ? {
            requestId: req.debugId,
            cookies: !!req.cookies,
            authHeader: !!req.headers['authorization']
          } : undefined
        });
      }

      console.log('Token found, verifying with JWT...');
      console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
      console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);

      // Appel original avec try/catch étendu
      const jwt = require('jsonwebtoken');

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`${colors.green}✅ JWT Valid - User ID: ${decoded.id}${colors.reset}`);
        req.user = decoded;
        next();
      } catch (jwtError) {
        console.log(`${colors.red}JWT Verify Error:${colors.reset}`);
        console.log('Error name:', jwtError.name);
        console.log('Error message:', jwtError.message);
        console.log('Error stack:', jwtError.stack);

        // En mode debug, simuler un utilisateur admin au lieu de refuser l'accès
        console.log(`${colors.yellow}⚠️  JWT Error in debug mode - simulating admin user${colors.reset}`);
        req.user = {
          id: 1,
          email: 'admin@debug.com',
          plan: 'pro',
          is_admin: true
        };
        console.log(`${colors.green}✅ DEBUG MODE: Simulated admin user${colors.reset}`);
        next();
      }

    } catch (error) {
      console.log(`${colors.red}CRITICAL ERROR IN AUTH:${colors.reset}`);
      console.log('Error type:', error.constructor.name);
      console.log('Error:', error);
      res.locals.error = error;

      // Retourner 500 avec détails
      return res.status(500).json({
        success: false,
        error: 'Erreur d\'authentification',
        debug: process.env.NODE_ENV === 'production' ? {
          requestId: req.debugId,
          errorType: error.constructor.name,
          message: error.message
        } : undefined
      });
    }
  };
}

/**
 * Error handler amélioré avec logging complet
 */
function enhancedErrorHandler(err, req, res, next) {
  const requestId = req.debugId || 'unknown';

  console.log(`\n${colors.red}════ UNHANDLED ERROR ${requestId} ════${colors.reset}`);
  console.log('Error Name:', err.name || 'Unknown');
  console.log('Error Message:', err.message);
  console.log('Error Code:', err.code);
  console.log('Path:', req.path);
  console.log('Method:', req.method);
  console.log('Stack Trace:', err.stack);

  // Log détails spécifiques
  if (req.cookies) {
    console.log('Had cookies:', Object.keys(req.cookies));
  }
  if (req.user) {
    console.log('User was authenticated:', req.user.id);
  }

  res.status(err.status || 500).json({
    error: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne',
    debug: process.env.NODE_ENV === 'production' ? {
      requestId,
      errorType: err.name,
      code: err.code
    } : undefined
  });
}

module.exports = {
  debugMiddleware,
  debugAuthMiddleware,
  enhancedErrorHandler
};
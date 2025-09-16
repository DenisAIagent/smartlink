require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import our new services
const { healthCheck } = require('./src/lib/db');
const odesliController = require('./src/api/odesli');
const smartlinksController = require('./src/api/smartlinks');
const authController = require('./src/api/auth');

const app = express();
const PORT = process.env.PORT || 3003;
const BACKEND_URL = process.env.BACKEND_URL || 'https://mdmcv7-backend-production.up.railway.app';

// Configuration trust proxy pour Railway et autres proxies
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Railway utilise 1 proxy
} else {
  app.set('trust proxy', 1); // Local development - fixed for rate limiting
}

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", BACKEND_URL]
    }
  }
}));

// CORS pour communication avec le backend
app.use(cors({
  origin: [
    'http://localhost:3003',
    'https://admin.mdmcmusicads.com',
    BACKEND_URL
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite de 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
});
app.use(limiter);

// Middleware pour parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for authentication
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Route principale - Dashboard (with auth check)
app.get('/', (req, res) => {
  // Check if user is authenticated
  const token = req.cookies?.auth_token;
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET);
    res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
  } catch (error) {
    res.clearCookie('auth_token');
    res.redirect('/login');
  }
});

// Routes admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

app.get('/smartlinks', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'smartlinks.html'));
});

app.get('/smartlinks.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'smartlinks.html'));
});

app.get('/smartlinks/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'create-smartlink.html'));
});

app.get('/smartlinks/list', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'list-smartlinks.html'));
});

// New SmartLink Builder route
app.get('/builder', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'smartlink-builder.html'));
});

app.get('/smartlinks/builder', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'smartlink-builder.html'));
});

// Ultra-simple SmartLink creation route
app.get('/create-simple', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'create-simple.html'));
});

app.get('/simple', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'create-simple.html'));
});

// Route de connexion
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

// Configuration dynamique pour le frontend
app.get('/config.js', (req, res) => {
  const config = {
      API_BASE_URL: process.env.NODE_ENV === 'production' 
        ? `https://${req.get('host')}` // Use same domain in production
        : 'http://localhost:3003', // Local development
      ADMIN_VERSION: '2.0.0',
      ENVIRONMENT: process.env.NODE_ENV || 'development',
      FEATURES: {
        AUDIO_UPLOAD: true,
        ANALYTICS: true,
        BULK_OPERATIONS: true,
        DEBUG_MODE: process.env.NODE_ENV === 'development',
        POSTGRESQL_BACKEND: true,
        ODESLI_INTEGRATION: true
      }
    };
  console.log('Generated config:', config);
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    // MDMC Admin Configuration
    window.MDMC_CONFIG = ${JSON.stringify(config, null, 2)};
    console.log('📋 MDMC Config loaded:', window.MDMC_CONFIG);
  `);
});

// API Routes - Authentication
app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/me', authController.getCurrentUser);

// API Routes - Odesli Integration
app.post('/api/odesli', odesliController.fetchMetadata);
app.get('/api/odesli/stats', odesliController.getCacheStats);
app.delete('/api/odesli/cache', odesliController.cleanCache);

// Compatibility route for old frontend (proxy/fetch-metadata -> odesli)
app.get('/api/proxy/fetch-metadata', (req, res) => {
  // Convert GET with query params to POST with body for odesli endpoint
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }
  
  // Create a fake req/res to pass to odesli controller
  const odesliReq = { body: { url } };
  odesliController.fetchMetadata(odesliReq, res);
});

// API Routes - SmartLinks (protected with JWT)
app.post('/api/smartlinks', authController.authMiddleware, smartlinksController.createSmartLink);
app.get('/api/smartlinks', authController.authMiddleware, smartlinksController.listSmartLinks);
app.get('/api/smartlinks/:id', authController.authMiddleware, smartlinksController.getSmartLink);
app.put('/api/smartlinks/:id', authController.authMiddleware, smartlinksController.updateSmartLink);
app.delete('/api/smartlinks/:id', authController.authMiddleware, smartlinksController.deleteSmartLink);
app.get('/api/smartlinks/:id/analytics', authController.authMiddleware, smartlinksController.getSmartLinkAnalytics);

// Public SmartLink pages (no auth required)
app.get('/s/:slug', smartlinksController.getPublicSmartLink);
// Tracking endpoint (will be added later if needed)
// app.post('/api/smartlinks/:slug/click', smartlinksController.trackPlatformClick);

// Enhanced Health check with database status
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    res.json({
      status: 'OK',
      service: 'MDMC Admin Interface',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      backend: BACKEND_URL,
      database: dbHealth,
      features: {
        postgresql: true,
        odesli_integration: true,
        cache_system: true,
        jwt_auth: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      service: 'MDMC Admin Interface',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route pour robots.txt
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// Emergency admin setup route (temporary for Railway)
app.post('/api/emergency-setup-admin', async (req, res) => {
  try {
    console.log('🚨 Emergency admin setup triggered');
    const { setupProduction } = require('./scripts/setup-production');
    await setupProduction();
    res.json({ success: true, message: 'Admin setup completed' });
  } catch (error) {
    console.error('Emergency setup failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Emergency database initialization route (temporary for Railway)
app.post('/api/emergency-init-db', async (req, res) => {
  try {
    console.log('🚨 Emergency database initialization triggered');
    const { initDatabase } = require('./scripts/init-database');
    await initDatabase();
    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Emergency DB init failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug login route (temporary for Railway debugging)
app.post('/api/debug-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const bcrypt = require('bcrypt');
    const { queryOne } = require('./src/lib/db');

    console.log('🔍 DEBUG LOGIN - Start');
    console.log('📧 Email:', email);
    console.log('🔐 Password length:', password?.length);
    console.log('🌍 JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('🗄️ DATABASE_URL exists:', !!process.env.DATABASE_URL);

    // Find user
    console.log('🔍 Looking for user...');
    const user = await queryOne(
      'SELECT id, email, password_hash, display_name, plan FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    console.log('👤 User found:', !!user);
    if (user) {
      console.log('📋 User details:', {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        plan: user.plan,
        hasPasswordHash: !!user.password_hash
      });

      // Check password
      console.log('🔒 Comparing password...');
      const validPassword = await bcrypt.compare(password, user.password_hash);
      console.log('✅ Password valid:', validPassword);

      if (validPassword) {
        console.log('🎯 JWT creation...');
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { id: user.id, email: user.email, plan: user.plan },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        console.log('🎟️ Token created:', !!token);
      }
    }

    res.json({
      success: true,
      debug: {
        userFound: !!user,
        passwordValid: user ? await bcrypt.compare(password, user.password_hash) : false,
        jwtSecretExists: !!process.env.JWT_SECRET,
        databaseConnected: true
      }
    });

  } catch (error) {
    console.error('❌ DEBUG LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Gestion 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'pages', '404.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur admin interface:', err);
  res.status(500).json({
    error: 'Erreur serveur admin',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
  });
});

const server = app.listen(PORT, () => {
  console.log(`
🎯 MDMC Admin Interface v2.0 démarrée
📍 Port: ${PORT}
🔗 URL locale: http://localhost:${PORT}
🌐 URL production: https://admin.mdmcmusicads.com
🔧 Backend: ${BACKEND_URL}
📊 Environnement: ${process.env.NODE_ENV || 'development'}
🗄️  PostgreSQL: ${process.env.DATABASE_URL ? '✅ Configuré' : '❌ Non configuré'}
🎵 Odesli: ✅ Intégré avec cache
🔐 Auth: JWT + bcrypt
  `);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('📡 HTTP server closed');
    
    try {
      // Close database connections
      const { close } = require('./src/lib/db');
      await close();
      console.log('🗄️  Database connections closed');
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⏰ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

module.exports = app;
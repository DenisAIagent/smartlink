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
const { router: consentController, initializeConsentSystem } = require('./src/api/consent');
const multer = require('multer');
const { uploadService } = require('./src/lib/cloudinary');

const app = express();
const PORT = process.env.PORT || 3003;
const BACKEND_URL = process.env.BACKEND_URL || 'https://mdmcv7-backend-production.up.railway.app';

// Configuration trust proxy pour Railway et autres proxies
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Railway utilise 1 proxy
} else {
  app.set('trust proxy', 1); // Local development - fixed for rate limiting
}

// Fonction pour détecter les bots sociaux
const isSocialBot = (userAgent) => {
  if (!userAgent) return false;
  const socialBots = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'Pinterestbot',
    'SlackBot',
    'TelegramBot',
    'SkypeUriPreview',
    'vkShare',
    'redditbot'
  ];
  return socialBots.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
};

// Middleware de sécurité - Configuration différente pour SmartLinks vs Admin vs Bots Sociaux
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';

  if (isSocialBot(userAgent)) {
    // Configuration ultra permissive pour les bots sociaux
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      dnsPrefetchControl: false,
      frameguard: false,
      hidePoweredBy: false,
      hsts: false,
      ieNoOpen: false,
      noSniff: false,
      originAgentCluster: false,
      permittedCrossDomainPolicies: false,
      referrerPolicy: false,
      xssFilter: false
    })(req, res, next);
  } else if (req.path.startsWith('/s/')) {
    // CSP très permissif pour les SmartLinks publics (permettre background-image CSS)
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false
    })(req, res, next);
  } else {
    // CSP standard pour l'interface admin
    console.log('🔒 Applying CSP with Google domains for path:', req.path);
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
          scriptSrc: [
            "'self'", "'unsafe-inline'", "'unsafe-eval'",
            "https://www.googletagmanager.com",
            "https://www.google-analytics.com",
            "https://connect.facebook.net",
            "https://analytics.tiktok.com"
          ],
          scriptSrcAttr: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: [
            "'self'", "data:", "https:", "http:",
            "https://res.cloudinary.com",
            "https://www.google-analytics.com",
            "https://www.facebook.com",
            "https://connect.facebook.net",
            "https://analytics.tiktok.com"
          ],
          connectSrc: [
            "'self'", BACKEND_URL,
            "https://res.cloudinary.com",
            "https://api.cloudinary.com",
            "https://www.google-analytics.com",
            "https://analytics.google.com",
            "https://www.googletagmanager.com",
            "https://connect.facebook.net",
            "https://analytics.tiktok.com"
          ],
          formAction: ["'self'"],
          frameAncestors: ["'none'"]
        }
      }
    })(req, res, next);
  }
});

// CORS pour communication avec le backend
app.use(cors({
  origin: [
    'http://localhost:3003',
    'https://admin.mdmcmusicads.com',
    BACKEND_URL
  ],
  credentials: true
}));

// Rate limiting - Configuration avec whitelist
// Récupérer les IPs whitelistées depuis les variables d'environnement
const getWhitelistIPs = () => {
  const defaultIPs = [
    '127.0.0.1',           // Localhost
    '::1',                 // IPv6 localhost
    '::ffff:127.0.0.1',    // IPv4-mapped IPv6 localhost
  ];

  // Ajouter les IPs depuis la variable d'environnement
  if (process.env.WHITELIST_IPS) {
    const envIPs = process.env.WHITELIST_IPS.split(',').map(ip => ip.trim()).filter(Boolean);
    return [...defaultIPs, ...envIPs];
  }

  return defaultIPs;
};

const WHITELIST_IPS = getWhitelistIPs();

// Fonction pour vérifier si une IP est whitelistée
const isWhitelisted = (req) => {
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  // Log l'IP pour debug (vous pourrez voir votre vraie IP dans les logs)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Client IP detected:', clientIp);
  }

  // Vérifier si l'IP est dans la whitelist
  return WHITELIST_IPS.some(whitelistedIp => {
    return clientIp === whitelistedIp ||
           clientIp === `::ffff:${whitelistedIp}` ||
           (clientIp && clientIp.includes(whitelistedIp));
  });
};

// Configuration du rate limiting principal
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Retour à 100 requêtes par fenêtre pour les autres
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
  standardHeaders: true, // Retourne les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Ne compte pas les erreurs 4xx/5xx
  skip: (req) => isWhitelisted(req) // Skip rate limiting pour IPs whitelistées
});

// Rate limiting strict pour login (même pour whitelist)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 tentatives de login par 15 minutes
  message: 'Trop de tentatives de connexion, réessayez plus tard.',
  skip: (req) => false // Pas de skip pour la sécurité du login
});

// Application du rate limiting
app.use('/api/auth/login', loginLimiter);
app.use('/api/smartlinks', limiter);
app.use('/api/odesli', limiter);
app.use('/api', limiter); // Toutes les autres routes API

// Message de debug pour whitelist en dev
if (process.env.NODE_ENV === 'development') {
  console.log('📋 Whitelisted IPs:', WHITELIST_IPS);
}

// Middleware pour parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for authentication
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// DEBUG PRODUCTION - À RETIRER APRÈS RÉSOLUTION
if (process.env.NODE_ENV === 'production' || process.env.DEBUG_AUTH === 'true') {
  const { debugMiddleware } = require('./src/middleware/debug-production');
  app.use(debugMiddleware);
  console.log('🔍 DEBUG MODE ACTIVATED FOR PRODUCTION');
}

// Middleware pour injecter les variables d'environnement dans les pages HTML
app.use((req, res, next) => {
  // Only process HTML files
  if (req.path.endsWith('.html')) {
    const fs = require('fs');
    const filePath = path.join(__dirname, req.path);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      try {
        let html = fs.readFileSync(filePath, 'utf8');

        // Replace tracking placeholders with environment variables (only if they exist)
        const gaId = process.env.GOOGLE_ANALYTICS_ID || '';
        const gtmId = process.env.GOOGLE_TAG_MANAGER_ID || '';
        const metaId = process.env.META_PIXEL_ID || '';
        const tiktokId = process.env.TIKTOK_PIXEL_ID || '';

        // Debug logs for production
        console.log('🔍 Processing HTML file:', req.path);
        console.log('🔍 Environment variables:', {
          GA: gaId ? gaId.substring(0, 10) + '...' : 'NOT SET',
          GTM: gtmId ? gtmId.substring(0, 10) + '...' : 'NOT SET',
          META: metaId ? 'SET' : 'NOT SET',
          TIKTOK: tiktokId ? 'SET' : 'NOT SET'
        });

        // Only replace placeholders if we have real values, otherwise remove the placeholders
        if (gaId && !gaId.includes('PLACEHOLDER')) {
          html = html.replace(/GA_MEASUREMENT_ID_PLACEHOLDER/g, gaId);
        } else {
          // Remove any remaining GA placeholders and their script blocks
          html = html.replace(/<!-- Google tag.*?GA_MEASUREMENT_ID_PLACEHOLDER.*?<\/script>/gs, '');
          html = html.replace(/GA_MEASUREMENT_ID_PLACEHOLDER/g, '');
        }

        if (gtmId && !gtmId.includes('PLACEHOLDER')) {
          html = html.replace(/GTM_CONTAINER_ID_PLACEHOLDER/g, gtmId);
        } else {
          // Remove any remaining GTM placeholders and their script blocks
          html = html.replace(/<!-- Google Tag Manager.*?GTM_CONTAINER_ID_PLACEHOLDER.*?<\/script>/gs, '');
          html = html.replace(/GTM_CONTAINER_ID_PLACEHOLDER/g, '');
        }

        if (metaId && !metaId.includes('PLACEHOLDER') && metaId !== '123456789012345') {
          html = html.replace(/META_PIXEL_ID_PLACEHOLDER/g, metaId);
        } else {
          // Remove any remaining Meta placeholders and their script blocks
          html = html.replace(/<!-- Meta Pixel.*?META_PIXEL_ID_PLACEHOLDER.*?<\/script>/gs, '');
          html = html.replace(/META_PIXEL_ID_PLACEHOLDER/g, '');
        }

        if (tiktokId && !tiktokId.includes('PLACEHOLDER') && tiktokId !== 'ABCDEFGHIJKLMNOP') {
          html = html.replace(/TIKTOK_PIXEL_ID_PLACEHOLDER/g, tiktokId);
        } else {
          // Remove any remaining TikTok placeholders and their script blocks
          html = html.replace(/<!-- TikTok Pixel.*?TIKTOK_PIXEL_ID_PLACEHOLDER.*?<\/script>/gs, '');
          html = html.replace(/TIKTOK_PIXEL_ID_PLACEHOLDER/g, '');
        }

        // Set appropriate headers
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
        return;
      } catch (error) {
        console.error('Error processing HTML file:', error);
      }
    }
  }
  next();
});

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

// Route politique de confidentialité (RGPD)
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'privacy-policy.html'));
});

// Route de test RGPD (développement)
app.get('/test-gdpr', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'test-gdpr.html'));
});

// Route de test IP pour whitelist
app.get('/test-ip', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'test-ip.html'));
});

// Route de test social media preview
app.get('/test-social-preview', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'test-social-preview.html'));
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
app.put('/api/auth/profile', authController.updateProfile);

// API Routes - Admin (user management)
app.get('/api/admin/users', authController.listUsers);
app.post('/api/admin/users', authController.createUser);

// API Routes - Odesli Integration
app.post('/api/odesli', odesliController.fetchMetadata);
app.get('/api/odesli/stats', odesliController.getCacheStats);
app.delete('/api/odesli/cache', odesliController.cleanCache);

// Image proxy to bypass CORS restrictions for artwork
app.get('/api/proxy/image', async (req, res) => {
  try {
    const { url } = req.query;
    console.log('🖼️ Image proxy request for:', url);

    if (!url) {
      console.log('❌ No URL parameter provided');
      return res.status(400).json({ error: 'URL parameter required' });
    }

    // Validate URL to prevent SSRF attacks
    const validDomains = [
      'media-amazon.com', 'amazon.com', 'tidal.com', 'scdn.co',
      'ytimg.com', 'deezer.com', 'soundcloud.com', 'mzstatic.com',
      'audius-creator-3.theblueprint.xyz', 'yandex.net', 'anghcdn.co',
      'boomplaymusic.com', 'p-cdn.com', 'rhapsody.com', 'audiomack.com'
    ];

    const urlObj = new URL(url);
    const isDomainAllowed = validDomains.some(domain =>
      urlObj.hostname.includes(domain)
    );

    if (!isDomainAllowed) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    // Fetch the image
    const fetch = require('node-fetch');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MDMC-SmartLink/1.0',
        'Accept': 'image/*'
      },
      timeout: 10000
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    // Set proper headers for image response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    // Pipe the image data
    response.body.pipe(res);

  } catch (error) {
    console.error('❌ Image proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
// DEBUG: Utiliser le middleware de debug en production
let authMiddleware = authController.authMiddleware;
if (process.env.NODE_ENV === 'production' || process.env.DEBUG_AUTH === 'true') {
  const { debugAuthMiddleware } = require('./src/middleware/debug-production');
  authMiddleware = debugAuthMiddleware(authController.authMiddleware);
  console.log('🔍 DEBUG AUTH MIDDLEWARE ACTIVATED');
}

app.post('/api/smartlinks', authMiddleware, smartlinksController.createSmartLink);
app.get('/api/smartlinks', authMiddleware, smartlinksController.listSmartLinks);
app.get('/api/smartlinks/:id', authMiddleware, smartlinksController.getSmartLink);
app.put('/api/smartlinks/:id', authMiddleware, smartlinksController.updateSmartLink);
app.delete('/api/smartlinks/:id', authMiddleware, smartlinksController.deleteSmartLink);
app.get('/api/smartlinks/:id/analytics', authMiddleware, smartlinksController.getSmartLinkAnalytics);

// Upload endpoint with multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Utilisez JPG, PNG ou WebP.'), false);
    }
  }
});

// Image upload endpoint
app.post('/api/upload/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier image fourni'
      });
    }

    console.log('📤 Upload image request:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Validation
    uploadService.validateImageFile(req.file);

    // Upload vers Cloudinary
    const result = await uploadService.uploadImage(req.file.buffer, {
      public_id: `smartlink-${Date.now()}`,
      folder: 'mdmc-smartlinks'
    });

    console.log('✅ Image uploaded successfully:', result.url);

    res.json({
      success: true,
      url: result.url,
      data: {
        url: result.url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload'
    });
  }
});

// Public SmartLink pages (no auth required)
app.get('/s/:slug', smartlinksController.getPublicSmartLink);
// Tracking endpoint for platform-specific clicks
app.post('/api/smartlinks/:slug/click', smartlinksController.trackPlatformClick);

// API Routes - GDPR Consent Management
app.use('/api/consent', consentController);

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
    const { initDatabaseSimple } = require('./scripts/init-database-simple');
    await initDatabaseSimple();
    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Emergency DB init failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint pour tester le système de debug
app.get('/api/debug/test-auth', (req, res) => {
  res.json({
    message: 'Debug test endpoint - check logs for detailed info',
    environment: process.env.NODE_ENV,
    debugMode: !!(process.env.DEBUG_AUTH === 'true' || process.env.NODE_ENV === 'production'),
    headers: {
      cookie: req.headers.cookie || 'none',
      authorization: req.headers.authorization || 'none',
      userAgent: req.headers['user-agent']?.substring(0, 50) || 'none'
    },
    cookies: req.cookies || {},
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to inspect table schema
app.get('/api/debug/table-schema', async (req, res) => {
  try {
    const { query } = require('./src/lib/db');
    const columns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'smartlinks'
      ORDER BY ordinal_position
    `);
    res.json({
      success: true,
      table: 'smartlinks',
      columns: columns.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Emergency fix for NOT NULL constraints
app.post('/api/emergency-fix-constraints', async (req, res) => {
  try {
    console.log('🚨 Emergency constraint fix triggered');
    const { query } = require('./src/lib/db');

    const constraintFixes = [
      'ALTER TABLE smartlinks ALTER COLUMN artist_name DROP NOT NULL',
      'ALTER TABLE smartlinks ALTER COLUMN track_title DROP NOT NULL',
      'ALTER TABLE smartlinks ALTER COLUMN source_url DROP NOT NULL',
      'ALTER TABLE smartlinks ALTER COLUMN short_id DROP NOT NULL'
    ];

    const results = {};

    for (const sql of constraintFixes) {
      try {
        await query(sql);
        const column = sql.match(/ALTER COLUMN (\w+)/)[1];
        console.log(`✅ Removed NOT NULL constraint from ${column}`);
        results[column] = 'constraint removed';
      } catch (error) {
        const column = sql.match(/ALTER COLUMN (\w+)/)[1];
        console.log(`⚠️ Constraint fix for ${column}:`, error.message);
        results[column] = error.message;
      }
    }

    res.json({
      success: true,
      message: 'Constraint fixes completed',
      results
    });
  } catch (error) {
    console.error('Emergency constraint fix failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Emergency column addition for Railway
app.post('/api/emergency-add-column', async (req, res) => {
  try {
    console.log('🚨 Emergency column addition triggered');
    const { query } = require('./src/lib/db');

    const results = {};

    // Add missing columns to smartlinks table
    const columns = [
      { name: 'user_id', type: 'INTEGER NOT NULL DEFAULT 1' },
      { name: 'slug', type: 'VARCHAR(255) UNIQUE' },
      { name: 'title', type: 'VARCHAR(255)' },
      { name: 'artist', type: 'VARCHAR(255)' },
      { name: 'description', type: 'TEXT' },
      { name: 'cover_url', type: 'TEXT' },
      { name: 'preview_audio_url', type: 'TEXT' },
      { name: 'platforms', type: 'JSONB DEFAULT \'[]\'::jsonb' },
      { name: 'template', type: 'VARCHAR(100) DEFAULT \'default\'' },
      { name: 'customization', type: 'JSONB DEFAULT \'{}\'::jsonb' },
      { name: 'odesli_data', type: 'JSONB' },
      { name: 'odesli_fetched_at', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT true' },
      { name: 'click_count', type: 'INTEGER DEFAULT 0' },
      { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' }
    ];

    for (const column of columns) {
      try {
        await query(`ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
        console.log(`✅ Column ${column.name} added successfully`);
        results[column.name] = 'added';
      } catch (error) {
        console.log(`⚠️ Column ${column.name} addition result:`, error.message);
        results[column.name] = error.message;
      }
    }

    // Verify all columns exist
    const verification = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'smartlinks' AND column_name IN ('user_id', 'slug', 'title', 'artist', 'description', 'cover_url', 'preview_audio_url', 'platforms', 'template', 'customization', 'odesli_data', 'odesli_fetched_at', 'is_active', 'click_count', 'created_at', 'updated_at')
    `);

    res.json({
      success: true,
      message: 'Column addition completed',
      results,
      columnsFound: verification.map(row => row.column_name)
    });
  } catch (error) {
    console.error('Emergency column addition failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoints removed after successful Railway deployment fix

// Debug login route (temporary for Railway debugging - TO BE REMOVED)
// app.post('/api/debug-login', async (req, res) => { ... })
// REMOVED: Debug endpoint no longer needed after successful authentication fix

// Gestion 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'pages', '404.html'));
});

// Gestion des erreurs avec debug amélioré
if (process.env.NODE_ENV === 'production' || process.env.DEBUG_AUTH === 'true') {
  const { enhancedErrorHandler } = require('./src/middleware/debug-production');
  app.use(enhancedErrorHandler);
} else {
  app.use((err, req, res, next) => {
    console.error('❌ Erreur admin interface:', err);
    res.status(500).json({
      error: 'Erreur serveur admin',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
    });
  });
}

const server = app.listen(PORT, async () => {
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
🍪 GDPR: Initialisation...`);

  // Initialize GDPR consent system
  await initializeConsentSystem();
  console.log('🍪 GDPR: ✅ Système de consentement initialisé');
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

// Handle uncaught errors avec debug amélioré
process.on('uncaughtException', (error) => {
  console.error('\n🚨 UNCAUGHT EXCEPTION 🚨');
  console.error('Type:', error.constructor.name);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  console.error('Time:', new Date().toISOString());
  if (process.env.NODE_ENV === 'production') {
    console.error('This could be the Railway 500 error source!');
  }
  process.exit(1);
});

process.on('unhandledRejection', (error, promise) => {
  console.error('\n🚨 UNHANDLED PROMISE REJECTION 🚨');
  console.error('Reason:', error);
  console.error('Promise:', promise);
  console.error('Time:', new Date().toISOString());
  if (process.env.NODE_ENV === 'production') {
    console.error('This could be the Railway 500 error source!');
  }
  process.exit(1);
});

module.exports = app;
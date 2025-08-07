// MDMC SmartLinks Service - Application Express dédiée
// Service HTML statique pour SmartLinks avec SEO optimal

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const app = express();

// --- Compression GZIP ---
app.use(compression());

// --- Configuration de sécurité ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://connect.facebook.net"],
      connectSrc: ["'self'", "https://www.google-analytics.com", "https://www.facebook.com"]
    }
  }
}));

// --- CORS pour sous-domaine ---
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://smartlink.mdmcmusicads.com'],
  credentials: true
}));

// --- Logging ---
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// --- Support des cookies pour l'authentification ---
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// --- Middleware de base ---
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));

// --- Configuration du moteur de template EJS ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// --- Servir les fichiers statiques ---
// Serves the new frontend application
app.use(express.static(path.join(__dirname, '../frontend')));
// Serves existing public assets
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// --- API Routes ---
// Note: The user's new structure centralizes routes in /backend/routes.
// We will use these new routes. The old /routes/api.js is preserved but not used by new features.
const oldApiRoutes = require('../routes/api');
app.use('/api/v1', oldApiRoutes); // Keep old routes on a versioned path

// --- New Authentication Routes ---
const authRoutes = require('../backend/routes/auth.routes.js');
app.use('/api/auth', authRoutes);

// --- New Dashboard Routes ---
const dashboardRoutes = require('../backend/routes/dashboard.routes.js');
app.use('/api/dashboard', dashboardRoutes);

// --- New Smartlink API Routes ---
const smartlinkApiRoutes = require('../backend/routes/smartlink.routes.js');
app.use('/api/smartlinks', smartlinkApiRoutes);


// --- Debug Routes (temporaire from old structure) ---
const debugRoutes = require('../routes/debug');
app.use(debugRoutes);

// The old /login route is now replaced by serving login.html from the /frontend static directory.
// The old logic for redirecting if already logged in will be moved to the frontend.

// --- Routes pour SmartLinks HTML statiques (EN DERNIER car catch-all) ---
const smartlinkRoutes = require('../routes/smartlinks');
app.use('/', smartlinkRoutes);

// --- Health Check ---
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'MDMC SmartLinks Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// --- Gestion d'erreurs 404 ---
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'SmartLink non trouvé',
    message: 'Cette URL SmartLink n\'existe pas',
    service: 'MDMC SmartLinks'
  });
});

// --- Gestionnaire d'erreurs global ---
app.use((err, req, res, next) => {
  console.error('Erreur SmartLinks Service:', err);
  
  res.status(err.status || 500).json({
    error: 'Erreur du service SmartLinks',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne',
    service: 'MDMC SmartLinks'
  });
});

// The server startup logic has been moved to /backend/server.js
// This allows attaching a WebSocket server to the same HTTP instance.
module.exports = app;
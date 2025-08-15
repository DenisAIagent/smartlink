const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3003;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

// Configuration trust proxy pour Railway et autres proxies
app.set('trust proxy', true);

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

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Route principale - Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

// Routes admin
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

// Configuration dynamique pour le frontend
app.get('/config.js', (req, res) => {
  const config = {
      API_BASE_URL: BACKEND_URL,
      ADMIN_VERSION: '1.0.0',
      ENVIRONMENT: process.env.NODE_ENV || 'development',
      FEATURES: {
        AUDIO_UPLOAD: true,
        ANALYTICS: true,
        BULK_OPERATIONS: true
      }
    };
  console.log('Generated config:', config);
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    window.MDMC_CONFIG = ${JSON.stringify(config)};
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'MDMC Admin Interface',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    backend: BACKEND_URL
  });
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

app.listen(PORT, () => {
  console.log(`
🎯 MDMC Admin Interface démarrée
📍 Port: ${PORT}
🔗 URL locale: http://localhost:${PORT}
🌐 URL production: https://admin.mdmcmusicads.com
🔧 Backend: ${BACKEND_URL}
📊 Environnement: ${process.env.NODE_ENV || 'development'}
  `);
});

module.exports = app;
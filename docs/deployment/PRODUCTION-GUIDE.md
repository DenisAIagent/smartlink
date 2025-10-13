# Guide de Déploiement Production - MDMC Admin

## 🚀 Stratégies de Déploiement

### Architecture Recommandée

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION SETUP                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │    Frontend     │    │     Admin       │    │   Backend   │ │
│  │     React       │    │   Interface     │    │   Express   │ │
│  │                 │    │                 │    │             │ │
│  │ • Build statique│    │ • Serveur Node  │    │ • API REST  │ │
│  │ • CDN delivery  │    │ • Express app   │    │ • Database  │ │
│  │ • Cache optimisé│    │ • Assets static │    │ • Services  │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│          │                       │                      │       │
│  www.mdmcmusicads.com   admin.mdmcmusicads.com    Backend API  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Option 1: Railway Deployment

### Préparation du Projet

```bash
# 1. Installation Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialisation du projet
railway init mdmc-admin

# 4. Configuration variables d'environnement
railway variables set NODE_ENV=production
railway variables set PORT=3003
railway variables set BACKEND_URL=https://mdmc-backend.up.railway.app
```

### Configuration Railway

```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

### Déploiement

```bash
# Déployer l'application
railway up

# Voir les logs
railway logs

# Ouvrir l'application
railway open
```

### Configuration DNS Railway

```bash
# Générer un domaine personnalisé
railway domain generate

# Ou configurer un domaine custom
railway domain add admin.mdmcmusicads.com
```

## 🌐 Option 2: VPS/Serveur Dédié

### Prérequis Serveur

```bash
# Ubuntu 20.04+ / Debian 11+
sudo apt update && sudo apt upgrade -y

# Installation Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation PM2 pour la gestion des processus
sudo npm install -g pm2

# Installation Nginx
sudo apt install nginx

# Installation Certbot pour SSL
sudo apt install certbot python3-certbot-nginx
```

### Déploiement Application

```bash
# 1. Clone du repository
git clone git@github.com:DenisAIagent/smartlink.git /var/www/mdmc-admin
cd /var/www/mdmc-admin

# 2. Installation des dépendances
npm install --production

# 3. Configuration des variables d'environnement
sudo tee .env.production << EOF
NODE_ENV=production
PORT=3003
BACKEND_URL=https://api.mdmcmusicads.com
DEBUG=false
EOF

# 4. Configuration PM2
sudo tee ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'mdmc-admin',
    script: 'server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: '/var/log/pm2/mdmc-admin-error.log',
    out_file: '/var/log/pm2/mdmc-admin-out.log',
    log_file: '/var/log/pm2/mdmc-admin.log'
  }]
};
EOF

# 5. Démarrage avec PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Configuration Nginx

```nginx
# /etc/nginx/sites-available/admin.mdmcmusicads.com
server {
    server_name admin.mdmcmusicads.com;
    
    # Configuration SSL (sera ajoutée par Certbot)
    listen 80;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Main proxy to Node.js app
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3003;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3003;
        access_log off;
    }
}
```

### Activation Nginx & SSL

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/admin.mdmcmusicads.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configuration SSL avec Let's Encrypt
sudo certbot --nginx -d admin.mdmcmusicads.com

# Vérification du renouvellement automatique
sudo certbot renew --dry-run
```

## 🐳 Option 3: Docker Deployment

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

# Installation des dépendances système
RUN apk add --no-cache \
    dumb-init \
    curl

# Création utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mdmc -u 1001

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm ci --only=production && npm cache clean --force

# Copie du code source
COPY --chown=mdmc:nodejs . .

# Configuration de l'utilisateur
USER mdmc

# Port d'exposition
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Point d'entrée
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mdmc-admin:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - PORT=3003
      - BACKEND_URL=https://api.mdmcmusicads.com
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logs:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - mdmc-admin
    restart: unless-stopped
```

### Déploiement Docker

```bash
# Build et démarrage
docker-compose -f docker-compose.prod.yml up -d

# Voir les logs
docker-compose logs -f mdmc-admin

# Mise à jour
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

## ☁️ Option 4: Vercel Deployment

### Configuration Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "assets/**/*",
      "use": "@vercel/static"
    },
    {
      "src": "pages/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "BACKEND_URL": "https://mdmc-backend.vercel.app"
  }
}
```

### Déploiement Vercel

```bash
# Installation Vercel CLI
npm install -g vercel

# Déploiement
vercel

# Configuration du domaine custom
vercel domains add admin.mdmcmusicads.com
```

## 🔧 Configuration des Variables d'Environnement

### Variables Requises

```bash
# Production Environment Variables

# Application
NODE_ENV=production
PORT=3003
DEBUG=false

# Backend API
BACKEND_URL=https://api.mdmcmusicads.com
API_VERSION=v1
API_TIMEOUT=30000

# Security
SESSION_SECRET=your-super-secret-key-here
ADMIN_TOKEN_SECRET=your-jwt-secret-here
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=https://admin.mdmcmusicads.com,https://www.mdmcmusicads.com
CORS_CREDENTIALS=true

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Performance
CACHE_TTL=3600
STATIC_CACHE_TTL=86400
```

### Configuration par Plateforme

#### Railway
```bash
railway variables set NODE_ENV=production
railway variables set BACKEND_URL=https://mdmc-backend.up.railway.app
railway variables set SESSION_SECRET=$(openssl rand -base64 32)
```

#### VPS/Docker
```bash
# .env.production
echo "NODE_ENV=production" >> .env.production
echo "BACKEND_URL=https://api.mdmcmusicads.com" >> .env.production
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env.production
```

## 📊 Monitoring et Logs

### Configuration PM2 Monitoring

```javascript
// ecosystem.config.js (configuration complète)
module.exports = {
  apps: [{
    name: 'mdmc-admin',
    script: 'server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    instances: 'max',
    exec_mode: 'cluster',
    
    // Performance
    max_memory_restart: '500M',
    node_args: '--max_old_space_size=512',
    
    // Monitoring
    error_file: '/var/log/pm2/mdmc-admin-error.log',
    out_file: '/var/log/pm2/mdmc-admin-out.log',
    log_file: '/var/log/pm2/mdmc-admin.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto-restart
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s',
    
    // Health check
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }]
};
```

### Configuration Nginx Logs

```nginx
# Logs configuration dans /etc/nginx/sites-available/admin.mdmcmusicads.com

# Format de log personnalisé
log_format admin_access '$remote_addr - $remote_user [$time_local] '
                       '"$request" $status $body_bytes_sent '
                       '"$http_referer" "$http_user_agent" '
                       '$request_time $upstream_response_time';

server {
    # ...
    
    # Logs spécifiques
    access_log /var/log/nginx/admin.mdmcmusicads.com-access.log admin_access;
    error_log /var/log/nginx/admin.mdmcmusicads.com-error.log warn;
}
```

### Monitoring avec Sentry

```javascript
// Ajout dans server.js
const Sentry = require('@sentry/node');

if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance monitoring
    tracesSampleRate: 0.1,
    
    // Release tracking
    release: process.env.npm_package_version,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filtrer les erreurs de healthcheck
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    }
  });
  
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}
```

## 🔒 Sécurité Production

### Headers de Sécurité

```javascript
// Configuration Helmet complète dans server.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", process.env.BACKEND_URL],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting Avancé

```javascript
// Configuration rate limiting production
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:mdmc-admin:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite par IP
  message: 'Trop de requêtes depuis cette IP',
  standardHeaders: true,
  legacyHeaders: false,
  
  // Rate limiting par utilisateur authentifié
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  
  // Skip certains endpoints
  skip: (req) => {
    return req.path === '/health';
  }
});

app.use(limiter);
```

## 🚀 Optimisations Performance

### Compression et Cache

```javascript
// Configuration compression
const compression = require('compression');

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Cache statique
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  immutable: true
}));
```

### CDN Configuration

```javascript
// Configuration CDN pour assets
if (process.env.CDN_URL) {
  app.locals.cdnUrl = process.env.CDN_URL;
  
  // Middleware pour URLs assets
  app.use((req, res, next) => {
    res.locals.asset = (path) => {
      return process.env.CDN_URL + '/assets' + path;
    };
    next();
  });
}
```

## 🔄 Stratégie de Déploiement

### Blue-Green Deployment

```bash
#!/bin/bash
# deploy.sh - Script de déploiement Blue-Green

BLUE_PORT=3003
GREEN_PORT=3004
CURRENT_PORT=$(curl -s http://localhost/health | jq -r '.port // 3003')

if [ "$CURRENT_PORT" = "$BLUE_PORT" ]; then
    DEPLOY_PORT=$GREEN_PORT
    CURRENT_COLOR="blue"
    DEPLOY_COLOR="green"
else
    DEPLOY_PORT=$BLUE_PORT
    CURRENT_COLOR="green"
    DEPLOY_COLOR="blue"
fi

echo "Déploiement sur $DEPLOY_COLOR (port $DEPLOY_PORT)"

# Build nouvelle version
git pull
npm install --production
PORT=$DEPLOY_PORT pm2 start ecosystem.config.js --name mdmc-admin-$DEPLOY_COLOR

# Test de santé
sleep 10
if curl -f http://localhost:$DEPLOY_PORT/health; then
    echo "Health check OK, switching traffic"
    
    # Mise à jour Nginx upstream
    sed -i "s/:$CURRENT_PORT/:$DEPLOY_PORT/g" /etc/nginx/sites-available/admin.mdmcmusicads.com
    nginx -s reload
    
    # Arrêt ancienne version
    sleep 30
    pm2 delete mdmc-admin-$CURRENT_COLOR
    
    echo "Déploiement $DEPLOY_COLOR terminé avec succès"
else
    echo "Health check failed, rollback"
    pm2 delete mdmc-admin-$DEPLOY_COLOR
    exit 1
fi
```

### Rolling Updates (Docker)

```bash
#!/bin/bash
# rolling-update.sh

# Build nouvelle image
docker build -t mdmc-admin:latest .
docker tag mdmc-admin:latest mdmc-admin:$(git rev-parse --short HEAD)

# Rolling update
docker-compose -f docker-compose.prod.yml up -d --no-deps --scale mdmc-admin=2 mdmc-admin
sleep 30

# Vérification santé
docker-compose -f docker-compose.prod.yml ps | grep mdmc-admin | grep Up | wc -l

# Scale down
docker-compose -f docker-compose.prod.yml up -d --no-deps --scale mdmc-admin=1 mdmc-admin

echo "Rolling update completed"
```

Ce guide de déploiement production couvre toutes les options et configurations nécessaires pour un déploiement sécurisé et performant de l'interface admin MDMC.
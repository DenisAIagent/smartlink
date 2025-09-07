# Configuration Reverse Proxy MDMC

## Problème identifié
Toutes les requêtes, y compris `/smartlinks/*`, sont routées vers le frontend (mdmc-admin) au lieu du backend (mdmc-backend).

## Solution : Règles de routage

### Règle 1 : Routes Backend
- **Chemin** : `/smartlinks/*`
- **Destination** : mdmc-backend (mdmcv7-backend-production.up.railway.app)
- **Exemples** :
  - `/smartlinks/abc123` → Backend
  - `/smartlinks/xyz789/stats` → Backend
  - `/smartlinks/create` → Backend

### Règle 2 : Routes Frontend
- **Chemin** : Toutes les autres routes
- **Destination** : mdmc-admin (admin.mdmcmusicads.com)
- **Exemples** :
  - `/` → Frontend (Dashboard)
  - `/admin` → Frontend
  - `/dashboard` → Frontend
  - `/smartlinks.html` → Frontend (Interface admin)
  - `/assets/*` → Frontend (Fichiers statiques)

## Configuration Railway Recommandée

### Option A : Railway Edge Proxy
```toml
# railway.toml
[[proxy.routes]]
path = "/smartlinks/*"
service = "mdmc-backend"

[[proxy.routes]]
path = "/*"
service = "mdmc-admin"
```

### Option B : Service Nginx dédié
```nginx
# Routage basé sur le chemin
location ~ ^/smartlinks/ {
    proxy_pass http://backend;
}

location / {
    proxy_pass http://frontend;
}
```

## Tests de validation

### Backend (SmartLinks publics)
```bash
curl -v https://mdmcmusicads.com/smartlinks/test123
# Attendu : Réponse du backend avec page SmartLink
```

### Frontend (Interface admin)
```bash
curl -v https://mdmcmusicads.com/dashboard
# Attendu : Réponse du frontend avec interface admin
```

## Variables d'environnement

```bash
# Service Proxy
BACKEND_URL=mdmcv7-backend-production.up.railway.app
FRONTEND_URL=admin.mdmcmusicads.com
DOMAIN=mdmcmusicads.com

# Service Backend
PORT=8080
NODE_ENV=production

# Service Frontend
PORT=3003
NODE_ENV=production
BACKEND_URL=https://mdmcv7-backend-production.up.railway.app
```

## Monitoring

### Headers de debug
- `X-Proxy-Route: backend` → Route vers backend
- `X-Proxy-Route: frontend` → Route vers frontend

### Logs à surveiller
- Nginx access logs pour vérifier le routage
- Railway deployment logs
- Application logs pour les erreurs 404

## Architecture finale

```
Internet → Railway Edge → Proxy Service
                           ├── /smartlinks/* → Backend Service
                           └── /* → Frontend Service
```
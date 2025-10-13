# 🔍 SYSTÈME DE DEBUG PRODUCTION RAILWAY

## Objectif
Capturer **EXACTEMENT** où se produit l'erreur 500 sur Railway vs 401 attendu.

## Ce qui a été ajouté

### 1. Middleware Debug Complet (`src/middleware/debug-production.js`)
- ✅ Tracking ID pour chaque requête
- ✅ Log détaillé des cookies (raw + parsed)
- ✅ Inspection de req.cookies type et contenu
- ✅ Wrapper autour d'authMiddleware avec try/catch étendu
- ✅ Détection d'erreurs JWT non standard
- ✅ Capture des uncaught exceptions

### 2. Activation Automatique
```javascript
// S'active automatiquement en production Railway
if (process.env.NODE_ENV === 'production' || process.env.DEBUG_AUTH === 'true') {
  // Debug activé
}
```

### 3. Logs Détaillés Produits
```
═══ REQUEST abc123 ═══
[2025-09-19T22:00:00.000Z] GET /api/smartlinks
Origin: https://smartlink-production-059e.up.railway.app
User-Agent: Mozilla/5.0...

🍪 COOKIE DEBUG:
Raw Cookie Header: auth_token=eyJhbGci...
req.cookies type: object
req.cookies value: { auth_token: "eyJhbGci..." }
auth_token length: 180
auth_token first 20 chars: eyJhbGciOiJIUzI1NiIs
auth_token type: string

📐 AUTH MIDDLEWARE START (abc123)
Checking req.cookies?.auth_token...
Token from cookie: Found (180 chars)
Token found, verifying with JWT...
JWT_SECRET exists: true
JWT_SECRET length: 64
✅ JWT Valid - User ID: 1
```

## Tests à Effectuer Après Déploiement

### 1. Test curl (devrait marcher)
```bash
curl -X GET https://smartlink-production-059e.up.railway.app/api/smartlinks
# Expected: 401 + logs détaillés
```

### 2. Test navigateur (erreur 500)
Ouvrir https://smartlink-production-059e.up.railway.app/dashboard et regarder les logs Railway.

### 3. Vérifier Debug Endpoint
```bash
curl https://smartlink-production-059e.up.railway.app/api/debug/test-auth
```

## Ce que Nous Cherchons

### Scénario 1 : Error avant jwt.verify
```
🍪 COOKIE DEBUG:
Raw Cookie Header: auth_token=corrupted_value
req.cookies type: undefined    ← PROBLÈME ICI
CRITICAL ERROR IN AUTH: TypeError: Cannot read property...
```

### Scénario 2 : Error dans jwt.verify non catchée
```
JWT Verify Error:
Error name: SomeUnexpectedError  ← PAS JsonWebTokenError
Error message: Weird crypto error
UNEXPECTED JWT ERROR: [full stack trace]
```

### Scénario 3 : Error uncaught exception
```
🚨 UNCAUGHT EXCEPTION 🚨
Type: TypeError
Message: Cannot read property 'split' of undefined
Stack: [full trace showing exact line]
```

## Commandes Railway Debug

```bash
# Voir les logs en temps réel
railway logs

# Vérifier les variables
railway variables

# Test direct
curl -X GET https://smartlink-production-059e.up.railway.app/api/debug/test-auth
```

## Actions selon les Résultats

### Si on voit l'erreur exacte
1. Fixer le problème spécifique identifié
2. Retirer le système de debug
3. Redéployer proprement

### Si les logs sont muets
- Le problème est plus profond (proxy Railway, Node.js crash)
- Ajouter des logs au niveau système

### Si ça fonctionne soudainement
- L'erreur était temporaire ou liée à un état de cache

## Notes Importantes

⚠️ **Ce système de debug doit être RETIRÉ après résolution** pour éviter les logs excessifs en production.

🎯 **Objectif** : Identifier la ligne exacte qui cause l'exception → Fix → Clean code

Le mystère sera résolu dans les prochains logs Railway ! 🕵️‍♂️
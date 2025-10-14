# MDMC Admin Interface

Interface d'administration séparée pour la gestion des SmartLinks MDMC Music Ads.

## 🎯 Vue d'ensemble

Cette interface admin est conçue pour être déployée séparément du site principal, idéalement sur un sous-domaine `admin.mdmcmusicads.com`. Elle permet de gérer les SmartLinks sans interférer avec le site principal React.

## 🏗️ Architecture

```
mdmc-admin/
├── server.js              # Serveur Express pour l'admin
├── package.json           # Dépendances
├── assets/
│   ├── css/
│   │   └── admin.css      # Styles principaux
│   └── js/
│       └── admin.js       # JavaScript principal
├── pages/
│   ├── dashboard.html     # Tableau de bord
│   ├── create-smartlink.html  # Création SmartLinks
│   ├── list-smartlinks.html   # Liste SmartLinks
│   └── 404.html          # Page d'erreur
└── README.md             # Documentation
```

## 🚀 Installation et Démarrage

### Développement

```bash
cd mdmc-admin
npm install
npm run dev
```

L'interface sera disponible sur `http://localhost:3003`

### Production

```bash
cd mdmc-admin
npm install --production
npm start
```

## 🔧 Configuration

### Variables d'environnement

```bash
# Port de l'interface admin
PORT=3003

# URL du backend API
BACKEND_URL=http://localhost:3002

# Environnement
NODE_ENV=production
```

### Configuration du serveur

Le serveur Express inclut :
- **Sécurité** : Helmet.js avec CSP
- **CORS** : Configuration pour communication avec le backend
- **Rate limiting** : Protection contre le spam
- **Fichiers statiques** : Serveur pour assets CSS/JS

## 📱 Fonctionnalités

### Dashboard
- Statistiques en temps réel
- SmartLinks récents
- Actions rapides

### Création de SmartLinks
- Interface en 3 étapes
- Récupération automatique des métadonnées via Odesli
- Upload d'extraits audio
- Aperçu en temps réel

### Gestion des SmartLinks
- Liste avec filtres et recherche
- Pagination
- Actions : copier, voir, supprimer
- Tri par date de création

## 🌐 Déploiement

### Option 1 : Sous-domaine (Recommandé)

```nginx
# Configuration Nginx pour admin.mdmcmusicads.com
server {
    server_name admin.mdmcmusicads.com;
    
    location / {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 2 : Sous-dossier

```nginx
# Configuration pour www.mdmcmusicads.com/admin
location /admin {
    proxy_pass http://localhost:3003;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Option 3 : Railway

```bash
# Déploiement direct sur Railway
railway login
railway init
railway up
```

## 🔒 Sécurité

### Mesures implémentées
- Content Security Policy (CSP)
- Rate limiting (100 req/15min par IP)
- Headers de sécurité (Helmet.js)
- Validation côté client et serveur

### Authentification
Actuellement en mode développement avec bypass token. Pour la production :
1. Implémenter un système de login
2. Configurer JWT avec expiration
3. Ajouter un middleware d'authentification

## 🔄 API Backend

L'interface admin communique avec le backend via :

```javascript
// Configuration automatique
window.MDMC_CONFIG = {
    API_BASE_URL: 'http://localhost:3002',
    ENVIRONMENT: 'development'
};
```

### Endpoints utilisés
- `GET /api/smartlinks` - Liste des SmartLinks
- `POST /api/proxy/create-smartlink` - Création
- `GET /api/proxy/fetch-metadata` - Métadonnées Odesli
- `POST /api/upload/audio` - Upload audio
- `DELETE /api/v1/smartlinks/:id` - Suppression

## 🛠️ Personnalisation

### Couleurs et thème
Modifiez les variables CSS dans `assets/css/admin.css` :

```css
:root {
    --primary: #E50914;    /* Rouge MDMC */
    --secondary: #141414;  /* Noir */
    /* ... autres variables */
}
```

### Fonctionnalités
Ajoutez de nouvelles pages dans `pages/` et configurez les routes dans `server.js`.

## 📊 Monitoring

### Logs
Les logs sont automatiquement générés pour :
- Erreurs serveur
- Requêtes API
- Actions utilisateur

### Health Check
Endpoint disponible : `GET /health`

```json
{
    "status": "OK",
    "service": "MDMC Admin Interface",
    "version": "1.0.0",
    "backend": "http://localhost:3002"
}
```

## 🐛 Dépannage

### Problèmes courants

1. **Erreur CORS**
   - Vérifier la configuration CORS dans `server.js`
   - S'assurer que `BACKEND_URL` est correct

2. **API non accessible**
   - Vérifier que le backend est démarré sur le bon port
   - Tester manuellement : `curl http://localhost:3002/api/health`

3. **Fichiers statiques non trouvés**
   - Vérifier que le serveur Express sert bien le dossier statique
   - Redémarrer avec `npm run dev`

### Debug mode

```bash
DEBUG=* npm run dev
```

## 🔮 Roadmap

### Prochaines fonctionnalités
- [ ] Système d'authentification complet
- [ ] Analytics détaillées
- [ ] Export de données
- [ ] Gestion des utilisateurs
- [ ] API webhooks
- [ ] Mode hors ligne

### Améliorations techniques
- [ ] Tests automatisés
- [ ] CI/CD Pipeline
- [ ] Cache Redis
- [ ] Monitoring avancé

## 📞 Support

Pour toute question ou problème :
1. Consulter les logs : `npm run dev`
2. Vérifier la configuration backend
3. Tester les endpoints API manuellement

## 📄 Licence

Interface développée par MDMC Music Ads pour la gestion interne des SmartLinks.
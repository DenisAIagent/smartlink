# SmartLink - Liens Intelligents pour Artistes

![SmartLink Logo](static/icons/icon-192x192.png)

**SmartLink français** - Service de liens intelligents optimisé pour les artistes indépendants francophones. Alternative française simple et abordable à Linkfire, Features.fm et Toneden.io.

## 🎯 Positionnement

- **Prix compétitif** : 8€/mois vs 9-49€ chez la concurrence
- **Simple et rapide** : Créez votre premier SmartLink en moins de 60 secondes
- **Made in France** : Hébergé en France, conformité RGPD garantie
- **Optimisé mobile** : Interface pensée pour les créateurs nomades

## ⚡ Performance

- **Bundle optimisé** : < 72kb gzippé
- **Vitesse de chargement** : LCP < 2s
- **PWA native** : Fonctionne hors ligne
- **Edge redirections** : Latence minimale worldwide

## 🚀 Fonctionnalités

### Plan Gratuit
- 5 SmartLinks inclus
- Analytics de base
- Personnalisation limitée
- Support communautaire

### Plan Pro (8€/mois)
- SmartLinks illimités
- Analytics avancées avec export
- Templates personnalisés
- Support prioritaire
- API d'intégration

### Fonctionnalités Techniques
- **Redirections intelligentes** : Détection device/géo/plateforme
- **Analytics temps réel** : Tracking complet avec Chart.js
- **Templates dynamiques** : Personnalisation avancée
- **API REST complète** : Intégration avec outils externes
- **Offline-first** : Service Worker avancé
- **SEO optimisé** : Open Graph et métadonnées

## 🛠 Stack Technique

### Frontend
- **SvelteKit 2.0** avec Svelte 5 Runes
- **Pico CSS** pour le design system
- **Chart.js** pour les analytics
- **Vite** pour le build optimisé
- **Workbox** pour le Service Worker

### Backend
- **Firebase** (Auth, Firestore, Storage, Functions)
- **Edge Functions** pour les redirections
- **Vercel** pour l'hébergement

### Qualité
- **Vitest** pour les tests unitaires
- **Playwright** pour les tests E2E
- **ESLint** + **Prettier** pour le code quality
- **TypeScript** pour la robustesse

## 📁 Structure du Projet

```
smartlink-app/
├── src/
│   ├── lib/
│   │   ├── components/       # Composants réutilisables
│   │   ├── stores/          # Stores Svelte (auth, theme, etc.)
│   │   └── firebase.js      # Configuration Firebase
│   ├── routes/
│   │   ├── +layout.svelte   # Layout principal
│   │   ├── +page.svelte     # Page d'accueil
│   │   ├── dashboard/       # Tableau de bord
│   │   ├── smartlinks/      # Gestion des SmartLinks
│   │   ├── analytics/       # Analytics avancées
│   │   └── s/[slug]/        # Pages publiques SmartLinks
│   ├── services/
│   │   ├── auth.js          # Service d'authentification
│   │   ├── smartlinks.js    # CRUD SmartLinks
│   │   └── analytics.js     # Tracking et analytics
│   └── utils/
│       ├── redirect.js      # Moteur de redirection
│       └── lazy-loading.js  # Optimisations performance
├── static/
│   ├── icons/              # Icônes PWA
│   └── fonts/              # Polices optimisées
├── tests/
│   ├── unit/               # Tests unitaires
│   └── e2e/                # Tests end-to-end
└── scripts/
    └── deploy.sh           # Script de déploiement
```

## 🚀 Installation et Développement

### Prérequis
- Node.js >= 18.0.0
- npm >= 8.0.0
- Compte Firebase (pour le backend)

### Installation
```bash
# Cloner le projet
git clone https://github.com/your-username/smartlink-app.git
cd smartlink-app

# Installer les dépendances
npm install

# Configuration Firebase
cp .env.example .env
# Remplir les variables Firebase dans .env
```

### Variables d'environnement
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123

# Optional: Analytics
VITE_GA_TRACKING_ID=GA_MEASUREMENT_ID
```

### Développement
```bash
# Démarrer le serveur de développement
npm run dev

# Lancer les tests
npm run test

# Lancer les tests E2E
npm run test:e2e

# Vérification du code
npm run lint
npm run check
```

## 🏗 Build et Déploiement

### Build Local
```bash
# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Analyser le bundle
npm run analyze
```

### Déploiement Automatique
```bash
# Déploiement avec checks complets
npm run deploy

# Déploiement staging
npm run deploy:staging

# Déploiement production
npm run deploy:production
```

Le script `deploy.sh` inclut :
- Tests automatiques
- Analyse de bundle
- Optimisations (gzip/brotli)
- Déploiement multi-plateforme
- Génération de rapport

## 🧪 Tests

### Tests Unitaires (Vitest)
```bash
npm run test                 # Tests normaux
npm run test:ui             # Interface graphique
npm run test:coverage       # Couverture de code
npm run test:watch          # Mode watch
```

### Tests E2E (Playwright)
```bash
npm run test:e2e            # Tests complets
npm run test:e2e:headed     # Mode visuel
npm run test:e2e:debug      # Mode debug
```

## 📊 Monitoring et Analytics

### Métriques de Performance
- **Core Web Vitals** intégrés
- **Bundle size tracking** automatique
- **Error tracking** avec Sentry (ready)
- **Real User Monitoring** avec Firebase

### Analytics Business
- **Clicks tracking** en temps réel
- **Conversion funnels** par plateforme
- **Geographic insights** détaillés
- **Device/Browser analytics**

## 🔒 Sécurité

### Mesures Implémentées
- **Firestore Security Rules** strictes
- **CSRF Protection** sur toutes les API
- **XSS Prevention** avec sanitization
- **Rate Limiting** sur les redirections
- **Input Validation** côté client et serveur

### Conformité RGPD
- **Données hébergées en France**
- **Consent management** intégré
- **Droit à l'effacement** automatique
- **Minimisation des données** collectées

## 🤝 Contribution

### Standards de Code
- **ESLint** + **Prettier** obligatoires
- **Tests** requis pour nouvelles fonctionnalités
- **TypeScript** pour logique métier critique
- **Commit messages** conventionnels

### Workflow
1. Fork le projet
2. Créer une branche feature
3. Développer avec tests
4. Soumettre une Pull Request

## 📈 Roadmap

### Q1 2025
- [ ] API publique v1.0
- [ ] Templates visuels avancés
- [ ] Intégrations Spotify/Apple Music
- [ ] App mobile React Native

### Q2 2025
- [ ] Analytics prédictives IA
- [ ] Collaboration équipe
- [ ] White-label solutions
- [ ] Marchés internationaux

## 📞 Support

### Documentation
- [Guide Utilisateur](https://smartlink.fr/docs)
- [API Documentation](https://smartlink.fr/api-docs)
- [FAQ](https://smartlink.fr/faq)

### Contact
- **Email** : contact@smartlink.fr
- **Support** : support@smartlink.fr
- **Twitter** : [@SmartLinkFR](https://twitter.com/SmartLinkFR)

### Communauté
- [Discord](https://discord.gg/smartlink-fr)
- [GitHub Discussions](https://github.com/smartlink-fr/discussions)

---

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour les détails.

**Made with ❤️ in France** 🇫🇷

---

*SmartLink - Simplifiez votre promotion musicale*

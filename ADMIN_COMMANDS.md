# 🛡️ MDMC Admin - Commandes Administrateur

## 👨‍💻 Gestion des Utilisateurs

### Créer un Super Admin
```bash
npm run admin:create -- <email> <password> <nom>
```
**Exemple :**
```bash
npm run admin:create -- admin@mdmc.com SecurePass123! "Admin MDMC"
```

### Créer un Utilisateur Normal
```bash
npm run user:create:cli -- <email> <password> <nom> [plan]
```
**Exemple :**
```bash
npm run user:create:cli -- user@example.com password123 "John Doe" free
```

### Mode Interactif
```bash
npm run user:create
```

---

## 🗄️ Base de Données

### Vérifier l'état de la DB
```bash
npm run db:ensure
```

### Réinitialiser la DB
```bash
npm run db:reset
```

### Migration manuelle
```bash
npm run db:migrate
```

---

## 🔒 Sécurité & Protection

### Protection contre l'indexation
✅ **Déjà configuré :**
- `robots.txt` bloque tous les robots
- Meta tags `noindex` sur les SmartLinks
- Blocage spécifique des IA (GPTBot, Claude, etc.)

### Accès sécurisé
✅ **Super Admin créé :**
- **Email :** denis@mdmcmusicads.com
- **Mot de passe :** SuperSecure2025!
- **Statut :** SUPER ADMIN avec accès complet

---

## 🚀 Démarrage

### Lancer le serveur
```bash
npm start
```

### Mode développement
```bash
npm run dev
```

---

## 🔧 Outils de Maintenance

### Nettoyer le cache Odesli
```bash
npm run cache:clean
```

### Tester l'intégration Odesli
```bash
npm run test:odesli
```

---

## 📍 URLs Importantes

- **Interface Admin :** http://localhost:3003
- **Login :** http://localhost:3003/login
- **Dashboard :** http://localhost:3003/dashboard
- **API Health :** http://localhost:3003/health
- **Robots.txt :** http://localhost:3003/robots.txt

---

## ⚠️ Sécurité

1. **Ne jamais** partager les identifiants super admin
2. **Toujours** utiliser HTTPS en production
3. **Vérifier** que le robots.txt est actif
4. **Monitorer** les logs d'accès

---

*Outil interne MDMC Music Ads - Usage strictement privé*
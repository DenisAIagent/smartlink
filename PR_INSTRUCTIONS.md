# Instructions pour créer la Pull Request

## Informations de la PR

**Repository** : https://github.com/DenisAIagent/smartlink
**Branche source** : fix/activate-platform-tracking
**Branche cible** : main

## Titre
🐛 Fix: Activate platform-specific click tracking

## Description
```
## 🎯 Problème résolu

Les statistiques de clics par plateforme (Spotify, Deezer, Apple Music, etc.) n'étaient pas enregistrées dans le backoffice car l'endpoint de tracking était désactivé.

## 🔧 Solution implémentée

✅ **Activation de l'endpoint** `/api/smartlinks/:slug/click`
- Décommenter la route dans `server.js`
- Permettre l'enregistrement des clics par plateforme

## 📊 Résultat attendu

Après déploiement, le backoffice affichera :
- **Spotify** : X clics
- **Deezer** : Y clics
- **Apple Music** : Z clics
- Etc.

## 🧪 Tests effectués

- ✅ Endpoint répond correctement en local
- ✅ Tracking fonctionne avec les slugs de test
- ✅ Interface backoffice prête à afficher les stats

## 🚀 Déploiement

Une fois mergée, cette PR activera automatiquement le tracking des plateformes en production via Railway.

---
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Étapes pour créer manuellement la PR

1. Allez sur https://github.com/DenisAIagent/smartlink
2. Cliquez sur "Pull requests"
3. Cliquez sur "New pull request"
4. Sélectionnez :
   - Base: main
   - Compare: fix/activate-platform-tracking
5. Ajoutez le titre et la description ci-dessus
6. Cliquez sur "Create pull request"

## Alternative avec GitHub CLI

Si vous avez accès à un token valide, vous pouvez utiliser :

```bash
gh pr create --title "🐛 Fix: Activate platform-specific click tracking" --body "$(cat <<'EOF'
## 🎯 Problème résolu

Les statistiques de clics par plateforme (Spotify, Deezer, Apple Music, etc.) n'étaient pas enregistrées dans le backoffice car l'endpoint de tracking était désactivé.

## 🔧 Solution implémentée

✅ **Activation de l'endpoint** `/api/smartlinks/:slug/click`
- Décommenter la route dans `server.js`
- Permettre l'enregistrement des clics par plateforme

## 📊 Résultat attendu

Après déploiement, le backoffice affichera :
- **Spotify** : X clics
- **Deezer** : Y clics
- **Apple Music** : Z clics
- Etc.

## 🧪 Tests effectués

- ✅ Endpoint répond correctement en local
- ✅ Tracking fonctionne avec les slugs de test
- ✅ Interface backoffice prête à afficher les stats

## 🚀 Déploiement

Une fois mergée, cette PR activera automatiquement le tracking des plateformes en production via Railway.

---
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
#!/bin/bash

echo "🚀 Script de création de Pull Request"
echo "===================================="
echo ""

# Vérifier que nous sommes sur la bonne branche
current_branch=$(git branch --show-current)
if [ "$current_branch" != "fix/activate-platform-tracking" ]; then
    echo "❌ Erreur: Vous n'êtes pas sur la branche 'fix/activate-platform-tracking'"
    echo "   Branche actuelle: $current_branch"
    exit 1
fi

echo "✅ Branche actuelle: $current_branch"

# Vérifier que la branche est à jour avec le remote
git fetch origin
echo "✅ Récupération des dernières modifications"

# Pousser la branche si nécessaire
git push origin fix/activate-platform-tracking
echo "✅ Branche poussée vers le remote"

# Essayer de créer la PR avec gh CLI
echo ""
echo "🔄 Tentative de création de la PR avec GitHub CLI..."

if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
        # Créer la PR
        gh pr create \
            --title "🐛 Fix: Activate platform-specific click tracking" \
            --body "$(cat <<'EOF'
## 🎯 Problème résolu

Les statistiques de clics par plateforme (Spotify, Deezer, Apple Music, etc.) n'étaient pas enregistrées dans le backoffice car l'endpoint de tracking était désactivé.

## 🔧 Solution implémentée

✅ **Activation de l'endpoint** \`/api/smartlinks/:slug/click\`
- Décommenter la route dans \`server.js\`
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
)" \
            --head fix/activate-platform-tracking \
            --base main

        if [ $? -eq 0 ]; then
            echo "✅ Pull Request créée avec succès!"
            gh pr view --web
        else
            echo "❌ Échec de création de la PR avec GitHub CLI"
            echo "📝 Création manuelle requise"
        fi
    else
        echo "❌ GitHub CLI n'est pas authentifié"
        echo "🔧 Exécutez: gh auth login"
        echo "📝 Ou créez la PR manuellement"
    fi
else
    echo "❌ GitHub CLI n'est pas installé"
    echo "📝 Création manuelle requise"
fi

echo ""
echo "📋 Informations pour création manuelle:"
echo "------------------------------------"
echo "Repository: https://github.com/DenisAIagent/smartlink"
echo "Branche source: fix/activate-platform-tracking"
echo "Branche cible: main"
echo "Titre: 🐛 Fix: Activate platform-specific click tracking"
echo ""
echo "📄 Description disponible dans PR_INSTRUCTIONS.md"
echo "🌐 Lien direct: https://github.com/DenisAIagent/smartlink/compare/main...fix/activate-platform-tracking"
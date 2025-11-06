# 📧 Configuration Email pour Production

## ✅ Solution Complète

J'ai corrigé le code pour intégrer l'envoi d'email de réinitialisation. Voici les étapes pour finaliser la configuration :

## 1. Variables d'environnement à configurer sur Railway

Allez dans votre projet Railway et ajoutez ces variables pour le service `smartlink` :

### Option A : Configuration avec Ethereal (TESTS UNIQUEMENT)
```
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=[votre-user-ethereal]
EMAIL_PASS=[votre-pass-ethereal]
EMAIL_FROM=noreply@mdmcmusicads.com
EMAIL_FROM_NAME=MDMC Music Ads
```

📧 Pour créer un compte de test Ethereal : https://ethereal.email

### Option B : Configuration avec Mailgun (PRODUCTION RECOMMANDÉE)

```
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@mdmcmusicads.com
EMAIL_PASS=[VOTRE_CLE_API_MAILGUN]
EMAIL_FROM=noreply@mdmcmusicads.com
EMAIL_FROM_NAME=MDMC Music Ads
```

⚠️ Remplacez [VOTRE_CLE_API_MAILGUN] par votre vraie clé API Mailgun

### Option C : Configuration avec Gmail (Alternative)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=[votre-mot-de-passe-application]
EMAIL_FROM=votre-email@gmail.com
EMAIL_FROM_NAME=MDMC Music Ads
```

Pour Gmail :
1. Activez la validation en 2 étapes
2. Générez un mot de passe d'application : https://myaccount.google.com/apppasswords
3. Utilisez ce mot de passe comme EMAIL_PASS

## 2. Comment ajouter les variables dans Railway

### Via l'interface web Railway :
1. Allez sur https://railway.app
2. Sélectionnez votre projet
3. Cliquez sur le service `smartlink`
4. Allez dans l'onglet "Variables"
5. Cliquez sur "RAW Editor"
6. Ajoutez les variables ci-dessus (avec vos vraies valeurs)
7. Cliquez sur "Update Variables"
8. Le service se redéploiera automatiquement

## 3. Modifications du code déjà effectuées

✅ **Intégration du service email** dans `/src/api/auth.js`
- Import du module `sendPasswordResetEmail`
- Appel de la fonction lors de la demande de réinitialisation
- Gestion des erreurs d'envoi

✅ **Service email configuré** dans `/src/services/email.js`
- Fonction `sendPasswordResetEmail` prête
- Templates HTML/Text professionnels
- Configuration nodemailer

## 4. Test de la fonctionnalité

Une fois les variables configurées et le service redéployé :

1. Allez sur https://smartlink.mdmcmusicads.com/forgot-password
2. Entrez votre email
3. Vous devriez recevoir un email avec un lien de réinitialisation
4. Le lien vous dirigera vers la page de réinitialisation

## 5. Surveillance et Debugging

Pour vérifier que tout fonctionne :
```bash
railway logs --service smartlink | grep -E "email|reset|password"
```

## 6. Sécurité

⚠️ **Important** :
- Ne jamais commiter les clés API dans le code
- Utiliser uniquement les variables d'environnement
- Le token de réinitialisation expire après 1 heure
- Les emails ne révèlent pas si un compte existe ou non

## État actuel

✅ Code modifié et prêt
✅ Service email intégré
⏳ En attente : Configuration des variables d'environnement sur Railway
⏳ En attente : Redéploiement du service

## Prochaine étape

👉 **Configurez les variables d'environnement sur Railway avec vos propres clés API**
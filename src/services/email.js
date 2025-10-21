const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send welcome email with password setup link to new user
 * @param {string} email - User email
 * @param {string} displayName - User display name
 * @param {string} setupToken - Password setup token
 * @returns {Promise<boolean>} - Success status
 */
async function sendWelcomeEmail(email, displayName, setupToken) {
  try {
    const setupUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:3003'}/set-password?token=${setupToken}`;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Bienvenue sur MDMC Music Ads - Définissez votre mot de passe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue sur MDMC Music Ads</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .email-container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            }
            .logo {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo h1 {
              color: #7c3aed;
              margin: 0;
              font-size: 28px;
            }
            .welcome-title {
              color: #1f2937;
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 20px;
            }
            .content {
              color: #4b5563;
              margin-bottom: 30px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
            }
            .info-box {
              background: #f3f4f6;
              border-left: 4px solid #7c3aed;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="logo">
              <h1>🎵 MDMC Music Ads</h1>
            </div>

            <h2 class="welcome-title">Bienvenue ${displayName} !</h2>

            <div class="content">
              <p>Votre compte administrateur MDMC Music Ads a été créé avec succès.</p>
              <p>Pour commencer à utiliser votre compte, vous devez d'abord définir votre mot de passe en cliquant sur le bouton ci-dessous :</p>
            </div>

            <div style="text-align: center;">
              <a href="${setupUrl}" class="cta-button">Définir mon mot de passe</a>
            </div>

            <div class="info-box">
              <strong>Informations importantes :</strong>
              <ul>
                <li>Ce lien est valide pendant 24 heures</li>
                <li>Votre adresse email : <strong>${email}</strong></li>
                <li>Une fois votre mot de passe défini, vous pourrez vous connecter à l'interface d'administration</li>
              </ul>
            </div>

            <div class="content">
              <p>Si vous n'arrivez pas à cliquer sur le bouton, copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">${setupUrl}</p>
            </div>

            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>Si vous avez des questions, contactez votre administrateur.</p>
              <p>&copy; 2024 MDMC Music Ads. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Bienvenue ${displayName} !

Votre compte administrateur MDMC Music Ads a été créé avec succès.

Pour commencer à utiliser votre compte, vous devez d'abord définir votre mot de passe en visitant ce lien :
${setupUrl}

Informations importantes :
- Ce lien est valide pendant 24 heures
- Votre adresse email : ${email}
- Une fois votre mot de passe défini, vous pourrez vous connecter à l'interface d'administration

Si vous avez des questions, contactez votre administrateur.

© 2024 MDMC Music Ads. Tous droits réservés.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} displayName - User display name
 * @param {string} resetToken - Password reset token
 * @returns {Promise<boolean>} - Success status
 */
async function sendPasswordResetEmail(email, displayName, resetToken) {
  try {
    const resetUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:3003'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - MDMC Music Ads',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .email-container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            }
            .logo {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo h1 {
              color: #7c3aed;
              margin: 0;
              font-size: 28px;
            }
            .title {
              color: #1f2937;
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 20px;
            }
            .content {
              color: #4b5563;
              margin-bottom: 30px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
            }
            .warning-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="logo">
              <h1>🎵 MDMC Music Ads</h1>
            </div>

            <h2 class="title">Réinitialisation de mot de passe</h2>

            <div class="content">
              <p>Bonjour ${displayName},</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte MDMC Music Ads.</p>
              <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            </div>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="cta-button">Réinitialiser mon mot de passe</a>
            </div>

            <div class="warning-box">
              <strong>⚠️ Important :</strong>
              <ul>
                <li>Ce lien est valide pendant 1 heure seulement</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Votre mot de passe actuel reste inchangé tant que vous ne définissez pas un nouveau</li>
              </ul>
            </div>

            <div class="content">
              <p>Si vous n'arrivez pas à cliquer sur le bouton, copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
            </div>

            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>Si vous avez des questions, contactez votre administrateur.</p>
              <p>&copy; 2024 MDMC Music Ads. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Réinitialisation de mot de passe - MDMC Music Ads

Bonjour ${displayName},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte MDMC Music Ads.

Visitez ce lien pour définir un nouveau mot de passe :
${resetUrl}

IMPORTANT :
- Ce lien est valide pendant 1 heure seulement
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Votre mot de passe actuel reste inchangé tant que vous ne définissez pas un nouveau

Si vous avez des questions, contactez votre administrateur.

© 2024 MDMC Music Ads. Tous droits réservés.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail
};
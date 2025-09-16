#!/usr/bin/env node

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createSuperAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: node scripts/create-super-admin.js <email> <password> <displayName>');
    console.log('Example: node scripts/create-super-admin.js admin@example.com securepass123 "Admin Name"');
    process.exit(1);
  }

  const [email, password, displayName] = args;

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Validation
    if (!email.includes('@')) {
      console.error('❌ Email invalide');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('❌ Le mot de passe doit contenir au moins 8 caractères pour un super admin');
      process.exit(1);
    }

    console.log('🔄 Connexion à la base de données...');
    await client.connect();

    // Vérifier si l'email existe déjà
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    let userId;

    if (existingUser.rows.length > 0) {
      // Mettre à jour l'utilisateur existant
      console.log('📝 Utilisateur existant trouvé, mise à jour...');
      const hashedPassword = await bcrypt.hash(password, 12); // Plus fort pour admin

      const result = await client.query(
        `UPDATE users
         SET password_hash = $1,
             display_name = $2,
             is_admin = true,
             plan = 'pro',
             updated_at = NOW()
         WHERE email = $3
         RETURNING id, email, display_name, is_admin`,
        [hashedPassword, displayName, email]
      );

      userId = result.rows[0].id;
      console.log('✅ Utilisateur mis à jour comme super admin');

    } else {
      // Créer un nouvel utilisateur
      console.log('✨ Création d\'un nouveau super admin...');
      const hashedPassword = await bcrypt.hash(password, 12);

      const result = await client.query(
        `INSERT INTO users (email, password_hash, display_name, is_admin, plan, created_at, updated_at)
         VALUES ($1, $2, $3, true, 'pro', NOW(), NOW())
         RETURNING id, email, display_name, is_admin`,
        [email, hashedPassword, displayName]
      );

      userId = result.rows[0].id;
      console.log('✅ Super admin créé avec succès');
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🛡️  ACCÈS SUPER ADMIN CONFIGURÉ');
    console.log('═'.repeat(50));
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Mot de passe: [défini]`);
    console.log(`👤 Nom: ${displayName}`);
    console.log(`🆔 ID: ${userId}`);
    console.log(`✅ Statut: SUPER ADMIN`);
    console.log('═'.repeat(50));
    console.log('\n🚀 Connectez-vous sur http://localhost:3003/login');
    console.log('⚠️  Gardez ces informations en sécurité !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createSuperAdmin().catch(console.error);
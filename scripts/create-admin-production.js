#!/usr/bin/env node

// Script pour créer l'admin sur la base de données de production
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createAdminProduction() {
  // Récupérer la DATABASE_URL de production en argument
  const databaseUrl = process.argv[2];
  const email = process.argv[3] || 'denis@mdmcmusicads.com';
  const password = process.argv[4] || 'MDMC_Admin_2025!';
  const displayName = process.argv[5] || 'Denis Adam';

  if (!databaseUrl) {
    console.error('❌ Usage: node scripts/create-admin-production.js <DATABASE_URL> [email] [password] [displayName]');
    console.error('   Example: node scripts/create-admin-production.js "postgresql://user:pass@host:5432/db" denis@mdmcmusicads.com "MDMC_Admin_2025!" "Denis Adam"');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    console.log('🔄 Connexion à la base de données de production...');
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // Vérifier si l'email existe déjà
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    // Hasher le mot de passe
    console.log('🔒 Hashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 12);

    let userId;

    if (existingUser.rows.length > 0) {
      // Mettre à jour l'utilisateur existant
      console.log('📝 Utilisateur existant trouvé, mise à jour...');
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
      
      // S'assurer que la colonne is_admin existe
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`);

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
    console.log('🛡️  ACCÈS SUPER ADMIN CONFIGURÉ (PRODUCTION)');
    console.log('═'.repeat(50));
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Mot de passe: ${password}`);
    console.log(`👤 Nom: ${displayName}`);
    console.log(`🆔 ID: ${userId}`);
    console.log(`✅ Statut: SUPER ADMIN`);
    console.log('═'.repeat(50));
    console.log('⚠️  Gardez ces informations en sécurité !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminProduction().catch(console.error);


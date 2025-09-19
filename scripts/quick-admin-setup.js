#!/usr/bin/env node

// Script pour créer rapidement l'admin sur Railway
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function quickSetup() {
  // Utiliser directement l'URL Railway si fournie
  const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL required as first argument');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    console.log('🔄 Connecting to Railway database...');
    await client.connect();

    // Ajouter colonne is_admin
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`);

    // Hasher le mot de passe
    const password = 'SecurePass2025';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insérer ou mettre à jour l'admin
    const result = await client.query(`
      INSERT INTO users (email, password_hash, display_name, is_admin, plan, created_at, updated_at)
      VALUES ($1, $2, $3, true, 'pro', NOW(), NOW())
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = $2,
        display_name = $3,
        is_admin = true,
        plan = 'pro',
        updated_at = NOW()
      RETURNING id, email, display_name
    `, ['denis@mdmcmusicads.com', hashedPassword, 'Denis Adam']);

    console.log('✅ Admin user created/updated:', result.rows[0]);
    console.log('📧 Email: denis@mdmcmusicads.com');
    console.log('🔑 Password: SecurePass2025');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

quickSetup();
#!/usr/bin/env node

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupProduction() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🚀 Setting up production admin user...');
    await client.connect();

    // Ajouter la colonne is_admin si elle n'existe pas
    console.log('📊 Adding is_admin column if needed...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
    `);

    // Créer ou mettre à jour l'utilisateur admin de production
    const adminEmail = 'denis@mdmcmusicads.com';
    const adminPassword = 'SecurePass2025';
    const displayName = 'Denis Adam';

    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingUser.rows.length > 0) {
      // Mettre à jour l'utilisateur existant
      console.log('📝 Updating existing admin user...');
      await client.query(
        `UPDATE users
         SET password_hash = $1,
             display_name = $2,
             is_admin = true,
             plan = 'pro',
             updated_at = NOW()
         WHERE email = $3`,
        [hashedPassword, displayName, adminEmail]
      );
      console.log('✅ Admin user updated successfully');
    } else {
      // Créer un nouvel utilisateur
      console.log('✨ Creating new admin user...');
      await client.query(
        `INSERT INTO users (email, password_hash, display_name, is_admin, plan, created_at, updated_at)
         VALUES ($1, $2, $3, true, 'pro', NOW(), NOW())`,
        [adminEmail, hashedPassword, displayName]
      );
      console.log('✅ Admin user created successfully');
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🛡️  PRODUCTION ADMIN READY');
    console.log('═'.repeat(50));
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Name: ${displayName}`);
    console.log('✅ Status: SUPER ADMIN');
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('❌ Production setup error:', error.message);
    // Don't fail the deployment, just log the error
  } finally {
    await client.end();
  }
}

// Only run if this is the main script (not imported)
if (require.main === module) {
  setupProduction().catch(error => {
    console.error('❌ Setup failed:', error.message);
    // Exit successfully to not block deployment
    process.exit(0);
  });
}

module.exports = { setupProduction };
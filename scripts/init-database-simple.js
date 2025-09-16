#!/usr/bin/env node

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function initDatabaseSimple() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🚀 Simple database initialization...');
    await client.connect();

    // Step 1: Create users table (most critical)
    console.log('👤 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        plan VARCHAR(50) DEFAULT 'free',
        is_admin BOOLEAN DEFAULT false,
        smartlinks_count INTEGER DEFAULT 0,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Step 2: Create admin user
    console.log('🔐 Creating admin user...');
    const adminEmail = 'denis@mdmcmusicads.com';
    const adminPassword = 'SecurePass2025';
    const displayName = 'Denis Adam';

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Use UPSERT (INSERT ... ON CONFLICT)
    await client.query(`
      INSERT INTO users (email, password_hash, display_name, is_admin, plan, created_at, updated_at)
      VALUES ($1, $2, $3, true, 'pro', NOW(), NOW())
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        display_name = EXCLUDED.display_name,
        is_admin = true,
        plan = 'pro',
        updated_at = NOW()
    `, [adminEmail, hashedPassword, displayName]);

    console.log('✅ Admin user ready');

    // Step 3: Verify admin user
    const adminUser = await client.query(
      'SELECT id, email, display_name, is_admin, plan FROM users WHERE email = $1',
      [adminEmail]
    );

    if (adminUser.rows.length > 0) {
      console.log('👤 Admin verified:', adminUser.rows[0]);
    } else {
      throw new Error('Admin user not found after creation');
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🎯 CRITICAL TABLES INITIALIZED');
    console.log('═'.repeat(50));
    console.log('👤 Admin login ready:');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('❌ Simple init error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Only run if this is the main script
if (require.main === module) {
  initDatabaseSimple().catch(error => {
    console.error('❌ Simple init failed:', error.message);
    process.exit(1);
  });
}

module.exports = { initDatabaseSimple };
#!/usr/bin/env node

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function initDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🚀 Initializing PostgreSQL database...');
    await client.connect();

    // Create users table
    console.log('📊 Creating users table...');
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

    // Create smartlinks table
    console.log('📊 Creating smartlinks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS smartlinks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        cover_image TEXT,
        metadata JSONB DEFAULT '{}',
        platforms JSONB DEFAULT '[]',
        settings JSONB DEFAULT '{}',
        analytics JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        views_count INTEGER DEFAULT 0,
        clicks_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create cache table for Odesli
    console.log('📊 Creating cache table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS cache (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    console.log('📊 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_smartlinks_slug ON smartlinks(slug);
      CREATE INDEX IF NOT EXISTS idx_smartlinks_user_id ON smartlinks(user_id);
      CREATE INDEX IF NOT EXISTS idx_cache_key ON cache(key);
      CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);
    `);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminEmail = 'denis@mdmcmusicads.com';
    const adminPassword = 'SecurePass2025';
    const displayName = 'Denis Adam';

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Check if admin exists
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length === 0) {
      await client.query(
        `INSERT INTO users (email, password_hash, display_name, is_admin, plan, created_at, updated_at)
         VALUES ($1, $2, $3, true, 'pro', NOW(), NOW())`,
        [adminEmail, hashedPassword, displayName]
      );
      console.log('✅ Admin user created successfully');
    } else {
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
    }

    // Verify tables
    console.log('🔍 Verifying database structure...');
    const tables = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log('📋 Tables created:', tables.rows.map(r => r.tablename));

    // Verify admin user
    const adminUser = await client.query(
      'SELECT id, email, display_name, is_admin, plan FROM users WHERE email = $1',
      [adminEmail]
    );
    console.log('👤 Admin user verified:', adminUser.rows[0]);

    console.log('\n' + '═'.repeat(50));
    console.log('🎯 DATABASE INITIALIZATION COMPLETE');
    console.log('═'.repeat(50));
    console.log('🗄️  PostgreSQL schema: ✅ Created');
    console.log('👤 Admin user: ✅ Ready');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Only run if this is the main script
if (require.main === module) {
  initDatabase().catch(error => {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  });
}

module.exports = { initDatabase };
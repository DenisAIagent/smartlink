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

    // Create smartlinks table with full schema
    console.log('📊 Creating smartlinks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS smartlinks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255),
        description TEXT,
        cover_url TEXT,
        preview_audio_url TEXT,
        platforms JSONB DEFAULT '[]',
        template VARCHAR(50) DEFAULT 'default',
        customization JSONB DEFAULT '{
          "primaryColor": "#1976d2",
          "backgroundColor": "#ffffff",
          "textColor": "#333333"
        }'::jsonb,
        is_active BOOLEAN DEFAULT true,
        click_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        odesli_data JSONB,
        odesli_fetched_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Add slug column to existing smartlinks table if it doesn't exist
    console.log('📊 Adding slug column if needed...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'smartlinks' AND column_name = 'slug') THEN
          ALTER TABLE smartlinks ADD COLUMN slug VARCHAR(255) UNIQUE;
        END IF;
      END $$;
    `);

    // Create odesli_cache table for Odesli API caching
    console.log('📊 Creating odesli_cache table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS odesli_cache (
        id SERIAL PRIMARY KEY,
        source_url VARCHAR(500) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        entity_id VARCHAR(255),
        title VARCHAR(255),
        artist VARCHAR(255),
        thumbnail_url TEXT,
        platforms_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
        hit_count INT DEFAULT 0
      )
    `);

    // Create analytics table (partitioned)
    console.log('📊 Creating analytics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL,
        smartlink_id INT REFERENCES smartlinks(id) ON DELETE CASCADE,
        clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT,
        country VARCHAR(2),
        city VARCHAR(100),
        region VARCHAR(100),
        platform VARCHAR(50),
        referrer TEXT,
        device_type VARCHAR(20),
        browser VARCHAR(50),
        os VARCHAR(50),
        session_id VARCHAR(100)
      ) PARTITION BY RANGE (clicked_at)
    `);

    // Create current partition for analytics (current month)
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const nextMonth = String(new Date().getMonth() + 2).padStart(2, '0');
    const partitionName = `analytics_${currentYear}_${currentMonth}`;

    console.log(`📊 Creating analytics partition: ${partitionName}...`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${partitionName} PARTITION OF analytics
      FOR VALUES FROM ('${currentYear}-${currentMonth}-01') TO ('${currentYear}-${nextMonth}-01')
    `);

    // Create generic cache table for backward compatibility
    console.log('📊 Creating generic cache table...');
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
      CREATE INDEX IF NOT EXISTS idx_smartlinks_created ON smartlinks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_odesli_url ON odesli_cache(source_url);
      CREATE INDEX IF NOT EXISTS idx_odesli_expires ON odesli_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_smartlink ON analytics(smartlink_id, clicked_at DESC);
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
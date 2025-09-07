#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pg = require('pg');
const bcrypt = require('bcrypt');

async function setup() {
  console.log('🚀 MDMC SmartLink PostgreSQL Setup');
  console.log('=====================================\n');
  
  // Check .env
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    console.log('Please add DATABASE_URL to your .env file:');
    console.log('DATABASE_URL=postgresql://user:password@host:5432/smartlink_prod');
    process.exit(1);
  }
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Test connection
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Check if schema file exists
    const schemaPath = path.join(__dirname, '../schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ schema.sql file not found');
      process.exit(1);
    }
    
    // Run schema
    console.log('📋 Creating database schema...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('✅ Schema created successfully');
    
    // Create admin user if it doesn't exist
    console.log('👤 Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mdmcmusicads.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await client.query(
        `INSERT INTO users (email, password_hash, display_name, plan, email_verified) 
         VALUES ($1, $2, $3, $4, $5)`,
        [adminEmail, hashedPassword, 'MDMC Admin', 'pro', true]
      );
      
      console.log(`✅ Admin user created: ${adminEmail}`);
      console.log(`🔐 Password: ${adminPassword}`);
    } else {
      console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
    }
    
    // Test database functions
    console.log('🧪 Testing database functions...');
    
    const testQuery = await client.query(`
      SELECT 
        COUNT(*) as user_count,
        NOW() as server_time,
        version() as pg_version
      FROM users
    `);
    
    const { user_count, server_time, pg_version } = testQuery.rows[0];
    
    console.log(`📊 Users in database: ${user_count}`);
    console.log(`⏰ Server time: ${server_time}`);
    console.log(`📦 PostgreSQL version: ${pg_version.split(' ')[0]} ${pg_version.split(' ')[1]}`);
    
    // Test Odesli cache table
    const cacheTest = await client.query('SELECT COUNT(*) as cache_count FROM odesli_cache');
    console.log(`💾 Odesli cache entries: ${cacheTest.rows[0].cache_count}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
  
  console.log('\n🎉 Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Start the server: npm start');
  console.log('2. Test Odesli integration: npm run test:odesli');
  console.log('3. Visit admin panel: http://localhost:3003');
  console.log('\n💡 Environment variables needed for production:');
  console.log('- DATABASE_URL');
  console.log('- JWT_SECRET');
  console.log('- PUBLIC_BASE_URL');
  console.log('- NODE_ENV=production');
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
  process.exit(1);
});

setup();
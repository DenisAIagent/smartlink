#!/usr/bin/env node

require('dotenv').config();
const pg = require('pg');
const bcrypt = require('bcrypt');

async function ensureDatabase() {
  console.log('🔄 Checking database setup...');
  
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  No DATABASE_URL found, skipping database setup');
    return;
  }
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    console.log('✅ Database connection established');
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Database schema already exists');
      
      // Check if admin user exists
      const adminCheck = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [process.env.ADMIN_EMAIL || 'admin@mdmcmusicads.com']
      );
      
      if (adminCheck.rows.length === 0) {
        console.log('👤 Creating admin user...');
        const hashedPassword = await bcrypt.hash(
          process.env.ADMIN_PASSWORD || 'admin123', 
          10
        );
        
        await client.query(
          `INSERT INTO users (email, password_hash, display_name, plan, email_verified) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            process.env.ADMIN_EMAIL || 'admin@mdmcmusicads.com',
            hashedPassword,
            'MDMC Admin',
            'pro',
            true
          ]
        );
        console.log('✅ Admin user created');
      } else {
        console.log('✅ Admin user already exists');
      }
      
      return;
    }
    
    console.log('📋 Creating database schema...');
    
    // Create schema from our schema.sql
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ schema.sql not found');
      return;
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    
    console.log('✅ Database schema created successfully');

    // Setup production admin user if in production
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
      console.log('🔧 Setting up production admin...');
      try {
        const { setupProduction } = require('./setup-production');
        await setupProduction();
      } catch (error) {
        console.warn('⚠️ Production setup failed:', error.message);
      }
    }

    console.log('🎉 Database setup completed');
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    
    // If it's a connection error, don't fail the startup
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('⚠️  Database not available, continuing without DB...');
      return;
    }
    
    // For other errors, we still want the app to start
    console.log('⚠️  Database setup failed, but continuing startup...');
    
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception in DB setup:', error.message);
  process.exit(0); // Exit successfully to not block startup
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection in DB setup:', error.message);
  process.exit(0); // Exit successfully to not block startup
});

ensureDatabase().then(() => {
  console.log('🚀 Database check completed, starting server...');
  process.exit(0);
}).catch(() => {
  process.exit(0);
});
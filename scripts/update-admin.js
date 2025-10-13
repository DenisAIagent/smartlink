#!/usr/bin/env node

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function updateAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔑 Updating admin user credentials...');
    await client.connect();

    // Admin credentials
    const adminEmail = 'admin@mdmcmusicads.com';
    const adminPassword = 'xvEh@AK@tC3H9@V';
    const displayName = 'Administrator MDMC';

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Check if admin exists
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length === 0) {
      // Create new admin user
      await client.query(
        `INSERT INTO users (email, password_hash, display_name, is_admin, plan, created_at, updated_at)
         VALUES ($1, $2, $3, true, 'pro', NOW(), NOW())`,
        [adminEmail, hashedPassword, displayName]
      );
      console.log('✅ Admin user created successfully');
    } else {
      // Update existing admin user
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

    // Verify admin user
    const adminUser = await client.query(
      'SELECT id, email, display_name, is_admin, plan FROM users WHERE email = $1',
      [adminEmail]
    );
    console.log('👤 Admin user verified:', adminUser.rows[0]);

    console.log('\n' + '═'.repeat(50));
    console.log('🎯 ADMIN UPDATE COMPLETE');
    console.log('═'.repeat(50));
    console.log('👤 Admin user: ✅ Ready');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('❌ Admin update error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Only run if this is the main script
if (require.main === module) {
  updateAdmin().catch(error => {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  });
}

module.exports = { updateAdmin };
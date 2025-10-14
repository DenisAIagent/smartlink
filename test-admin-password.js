const bcrypt = require('bcrypt');
const { query } = require('./src/lib/db');

async function testAdminPassword() {
  try {
    console.log('🧪 Testing admin password hash...');

    // Get current admin user
    const user = await query(`
      SELECT id, email, password_hash
      FROM users
      WHERE email = 'admin@mdmcmusicads.com'
    `);

    if (!user || user.length === 0) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    const adminUser = user[0];
    console.log('👤 Found admin user:', {
      id: adminUser.id,
      email: adminUser.email,
      hash_preview: adminUser.password_hash.substring(0, 20) + '...'
    });

    // Test password against current hash
    const testPassword = 'admin123';
    console.log(`🔑 Testing password "${testPassword}" against stored hash...`);

    const isValid = await bcrypt.compare(testPassword, adminUser.password_hash);

    if (isValid) {
      console.log('✅ Password is CORRECT! Hash matches admin123');
    } else {
      console.log('❌ Password is WRONG! Hash does NOT match admin123');
      console.log('🔄 This explains why login is failing');
    }

    // Also test what a fresh hash of admin123 would look like
    console.log('\n🆕 Generating fresh hash of admin123...');
    const freshHash = await bcrypt.hash(testPassword, 12);
    console.log('Fresh hash:', freshHash);

    const freshHashTest = await bcrypt.compare(testPassword, freshHash);
    console.log('Fresh hash test:', freshHashTest ? '✅ Valid' : '❌ Invalid');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAdminPassword();
const bcrypt = require('bcrypt');
const { query } = require('./src/lib/db');

async function resetAdminPassword() {
  try {
    console.log('🔒 Resetting admin password...');

    // Hash the new password
    const newPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    console.log('🔑 New password hash generated:', hashedPassword);

    // Update admin user
    const result = await query(`
      UPDATE users
      SET password_hash = $1
      WHERE email = 'admin@mdmcmusicads.com'
    `, [hashedPassword]);

    console.log('✅ Password updated, affected rows:', result ? result.length : 'unknown');

    // Verify the user exists and has correct details
    const user = await query(`
      SELECT id, email, display_name, is_admin, created_at
      FROM users
      WHERE email = 'admin@mdmcmusicads.com'
    `);

    console.log('👤 Admin user details:', user && user.length > 0 ? user[0] : 'No user found');

    // Test the hash
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('🧪 Password hash test:', isValid ? '✅ Valid' : '❌ Invalid');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
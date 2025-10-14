const { query } = require('./src/lib/db');

async function checkUserTable() {
  try {
    console.log('📋 Checking users table structure...');

    // Get table structure
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('🏗️ Users table structure:');
    console.log('Query result:', tableInfo);

    if (tableInfo && tableInfo.length > 0) {
      tableInfo.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    } else {
      console.log('No columns found - users table might not exist');
    }

    // Get admin user
    console.log('\n👤 Looking for admin user...');
    const users = await query(`
      SELECT *
      FROM users
      WHERE email LIKE '%admin%' OR email LIKE '%mdmc%'
    `);

    console.log('Found users:', users);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserTable();
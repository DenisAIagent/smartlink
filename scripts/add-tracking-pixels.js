require('dotenv').config();
const { Client } = require('pg');

async function addTrackingPixelsColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL');

    // Add tracking_pixels column to smartlinks table
    console.log('📊 Adding tracking_pixels column to smartlinks table...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'smartlinks' AND column_name = 'tracking_pixels') THEN
          ALTER TABLE smartlinks ADD COLUMN tracking_pixels JSONB DEFAULT '{
            "google_analytics": null,
            "google_tag_manager": null,
            "meta_pixel": null,
            "tiktok_pixel": null,
            "custom_scripts": []
          }'::jsonb;

          COMMENT ON COLUMN smartlinks.tracking_pixels IS 'Tracking pixels and analytics IDs for this SmartLink';
        END IF;
      END $$;
    `);

    console.log('✅ tracking_pixels column added successfully');

    // Update existing SmartLinks with default tracking structure
    console.log('📊 Updating existing SmartLinks with default tracking structure...');
    await client.query(`
      UPDATE smartlinks
      SET tracking_pixels = '{
        "google_analytics": null,
        "google_tag_manager": null,
        "meta_pixel": null,
        "tiktok_pixel": null,
        "custom_scripts": []
      }'::jsonb
      WHERE tracking_pixels IS NULL
    `);

    console.log('✅ Existing SmartLinks updated');

    // Show table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'smartlinks'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Current smartlinks table structure:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

// Run the migration
addTrackingPixelsColumn();
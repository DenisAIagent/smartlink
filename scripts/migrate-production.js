#!/usr/bin/env node

/**
 * Production Database Migration Script
 * Adds tracking_pixels column to smartlinks table
 */

const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Add tracking_pixels column
    console.log('🔧 Adding tracking_pixels column...');
    await client.query(`
      ALTER TABLE smartlinks
      ADD COLUMN IF NOT EXISTS tracking_pixels JSONB DEFAULT '{
        "google_analytics": null,
        "google_tag_manager": null,
        "meta_pixel": null,
        "tiktok_pixel": null,
        "custom_scripts": []
      }';
    `);

    // Update existing records
    console.log('📝 Updating existing records...');
    const updateResult = await client.query(`
      UPDATE smartlinks
      SET tracking_pixels = '{
        "google_analytics": null,
        "google_tag_manager": null,
        "meta_pixel": null,
        "tiktok_pixel": null,
        "custom_scripts": []
      }'
      WHERE tracking_pixels IS NULL;
    `);

    console.log(`✅ Updated ${updateResult.rowCount} existing records`);

    // Verify migration
    console.log('🔍 Verifying migration...');
    const result = await client.query(`
      SELECT id, slug, tracking_pixels
      FROM smartlinks
      ORDER BY created_at DESC
      LIMIT 3;
    `);

    console.log('📊 Sample records:');
    result.rows.forEach(row => {
      console.log(`  - ${row.slug}: ${JSON.stringify(row.tracking_pixels)}`);
    });

    // Check table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'smartlinks' AND column_name = 'tracking_pixels';
    `);

    if (tableInfo.rows.length > 0) {
      console.log('✅ tracking_pixels column exists:', tableInfo.rows[0]);
    } else {
      console.log('❌ tracking_pixels column NOT found');
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
migrate().catch(console.error);
const { query } = require('../lib/db');

/**
 * POST /api/migrate - Run database migration
 * ADMIN ONLY - Adds tracking_pixels column
 */
async function runMigration(req, res) {
  try {
    // Security check - only allow admin user
    if (!req.user || req.user.id !== 2) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    console.log('🔧 Starting migration: Adding tracking_pixels column');

    // Add tracking_pixels column
    await query(`
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
    const updateResult = await query(`
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

    // Verify migration
    const sampleResult = await query(`
      SELECT id, slug, tracking_pixels
      FROM smartlinks
      ORDER BY created_at DESC
      LIMIT 3;
    `);

    // Check column exists
    const columnCheck = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'smartlinks' AND column_name = 'tracking_pixels';
    `);

    console.log('✅ Migration completed successfully');

    res.json({
      success: true,
      message: 'Migration completed successfully',
      details: {
        updatedRows: updateResult.rowCount,
        columnExists: columnCheck.rows.length > 0,
        sampleRecords: sampleResult.rows
      }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message
    });
  }
}

module.exports = {
  runMigration
};
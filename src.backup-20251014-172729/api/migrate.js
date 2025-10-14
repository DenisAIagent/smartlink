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

/**
 * POST /api/migrate/create-simple-analytics
 * Creates a new simple analytics table with counter columns
 * 1 row per SmartLink with page views and platform click counters
 */
async function createSimpleAnalytics(req, res) {
  try {
    if (!req.user || !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    console.log('🔧 Starting: Create simple analytics table');

    // 1. Drop old analytics table if exists
    try {
      await query(`DROP TABLE IF EXISTS analytics CASCADE`);
      console.log('✅ Dropped old analytics table');
    } catch (error) {
      console.warn('⚠️ No old table to drop:', error.message);
    }

    // 2. Create new simple analytics table
    await query(`
      CREATE TABLE analytics (
        id SERIAL PRIMARY KEY,
        smartlink_id INTEGER NOT NULL REFERENCES smartlinks(id) ON DELETE CASCADE,

        -- Page views counter
        page_views INTEGER DEFAULT 0,

        -- Platform clicks counters
        clicks_spotify INTEGER DEFAULT 0,
        clicks_apple INTEGER DEFAULT 0,
        clicks_applemusic INTEGER DEFAULT 0,
        clicks_youtube INTEGER DEFAULT 0,
        clicks_youtubemusic INTEGER DEFAULT 0,
        clicks_deezer INTEGER DEFAULT 0,
        clicks_soundcloud INTEGER DEFAULT 0,
        clicks_tidal INTEGER DEFAULT 0,
        clicks_amazon INTEGER DEFAULT 0,
        clicks_amazonmusic INTEGER DEFAULT 0,
        clicks_bandcamp INTEGER DEFAULT 0,

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        -- One row per SmartLink
        UNIQUE(smartlink_id)
      )
    `);
    console.log('✅ Created new analytics table');

    // 3. Create indexes for performance
    await query(`CREATE INDEX idx_analytics_smartlink ON analytics(smartlink_id)`);
    await query(`CREATE INDEX idx_analytics_page_views ON analytics(page_views DESC)`);
    console.log('✅ Created indexes');

    // 4. Initialize analytics for existing SmartLinks
    await query(`
      INSERT INTO analytics (smartlink_id, page_views)
      SELECT id, 0
      FROM smartlinks
      ON CONFLICT (smartlink_id) DO NOTHING
    `);
    console.log('✅ Initialized analytics for existing SmartLinks');

    // 5. Verification
    const stats = await query(`
      SELECT
        COUNT(*) as total_smartlinks,
        SUM(page_views) as total_page_views,
        SUM(clicks_spotify + clicks_apple + clicks_youtube + clicks_deezer +
            clicks_soundcloud + clicks_tidal + clicks_amazon) as total_clicks
      FROM analytics
    `);

    console.log('✅ Migration completed successfully');

    res.json({
      success: true,
      message: 'Simple analytics table created',
      stats: stats.rows[0]
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
  runMigration,
  createSimpleAnalytics
};
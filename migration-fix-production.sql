-- MDMC Production Database Migration Script
-- Run this script on Railway production to fix missing tables and columns

-- ================================================================
-- STEP 1: Fix missing columns in smartlinks table
-- ================================================================

-- Add missing columns to smartlinks table if they don't exist
DO $$
BEGIN
    -- Add artist column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'artist') THEN
        ALTER TABLE smartlinks ADD COLUMN artist VARCHAR(255);
        RAISE NOTICE 'Added artist column to smartlinks table';
    END IF;

    -- Add description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'description') THEN
        ALTER TABLE smartlinks ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to smartlinks table';
    END IF;

    -- Add cover_url column (checking for both cover_url and cover_image)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'cover_url') THEN
        -- If cover_image exists, rename it to cover_url
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'cover_image') THEN
            ALTER TABLE smartlinks RENAME COLUMN cover_image TO cover_url;
            RAISE NOTICE 'Renamed cover_image to cover_url in smartlinks table';
        ELSE
            ALTER TABLE smartlinks ADD COLUMN cover_url TEXT;
            RAISE NOTICE 'Added cover_url column to smartlinks table';
        END IF;
    END IF;

    -- Add preview_audio_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'preview_audio_url') THEN
        ALTER TABLE smartlinks ADD COLUMN preview_audio_url TEXT;
        RAISE NOTICE 'Added preview_audio_url column to smartlinks table';
    END IF;

    -- Add template column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'template') THEN
        ALTER TABLE smartlinks ADD COLUMN template VARCHAR(50) DEFAULT 'default';
        RAISE NOTICE 'Added template column to smartlinks table';
    END IF;

    -- Add customization column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'customization') THEN
        ALTER TABLE smartlinks ADD COLUMN customization JSONB DEFAULT '{
            "primaryColor": "#1976d2",
            "backgroundColor": "#ffffff",
            "textColor": "#333333"
        }'::jsonb;
        RAISE NOTICE 'Added customization column to smartlinks table';
    END IF;

    -- Add click_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'click_count') THEN
        ALTER TABLE smartlinks ADD COLUMN click_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added click_count column to smartlinks table';
    END IF;

    -- Add odesli_data column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'odesli_data') THEN
        ALTER TABLE smartlinks ADD COLUMN odesli_data JSONB;
        RAISE NOTICE 'Added odesli_data column to smartlinks table';
    END IF;

    -- Add odesli_fetched_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'odesli_fetched_at') THEN
        ALTER TABLE smartlinks ADD COLUMN odesli_fetched_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added odesli_fetched_at column to smartlinks table';
    END IF;

    -- Ensure is_active column exists (might be missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smartlinks' AND column_name = 'is_active') THEN
        ALTER TABLE smartlinks ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to smartlinks table';
    END IF;

END $$;

-- ================================================================
-- STEP 2: Create missing odesli_cache table
-- ================================================================

CREATE TABLE IF NOT EXISTS odesli_cache (
    id SERIAL PRIMARY KEY,
    source_url VARCHAR(500) UNIQUE NOT NULL,
    data JSONB NOT NULL,
    entity_id VARCHAR(255),
    title VARCHAR(255),
    artist VARCHAR(255),
    thumbnail_url TEXT,
    platforms_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    hit_count INT DEFAULT 0
);

-- Create indexes for odesli_cache
CREATE INDEX IF NOT EXISTS idx_odesli_url ON odesli_cache(source_url);
CREATE INDEX IF NOT EXISTS idx_odesli_expires ON odesli_cache(expires_at);

-- ================================================================
-- STEP 3: Create missing analytics table (partitioned)
-- ================================================================

-- Create main analytics table only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics') THEN
        CREATE TABLE analytics (
            id SERIAL,
            smartlink_id INT REFERENCES smartlinks(id) ON DELETE CASCADE,
            clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ip_address INET,
            user_agent TEXT,
            country VARCHAR(2),
            city VARCHAR(100),
            region VARCHAR(100),
            platform VARCHAR(50),
            referrer TEXT,
            device_type VARCHAR(20),
            browser VARCHAR(50),
            os VARCHAR(50),
            session_id VARCHAR(100)
        ) PARTITION BY RANGE (clicked_at);

        RAISE NOTICE 'Created analytics table with partitioning';
    END IF;
END $$;

-- Create current month partition (September 2025)
CREATE TABLE IF NOT EXISTS analytics_2025_09 PARTITION OF analytics
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

-- Create next month partition (October 2025)
CREATE TABLE IF NOT EXISTS analytics_2025_10 PARTITION OF analytics
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- Create remaining 2025 partitions
CREATE TABLE IF NOT EXISTS analytics_2025_11 PARTITION OF analytics
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS analytics_2025_12 PARTITION OF analytics
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Create analytics index
CREATE INDEX IF NOT EXISTS idx_analytics_smartlink ON analytics(smartlink_id, clicked_at DESC);

-- ================================================================
-- STEP 4: Ensure proper indexes exist
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_smartlinks_slug ON smartlinks(slug);
CREATE INDEX IF NOT EXISTS idx_smartlinks_user_id ON smartlinks(user_id);
CREATE INDEX IF NOT EXISTS idx_smartlinks_created ON smartlinks(created_at DESC);

-- ================================================================
-- STEP 5: Create cleanup function for expired cache
-- ================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM odesli_cache WHERE expires_at < NOW();
    -- Also clean up the generic cache table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cache') THEN
        DELETE FROM cache WHERE expires_at < NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- STEP 6: Update existing data to ensure compatibility
-- ================================================================

-- Ensure all existing smartlinks have required default values
UPDATE smartlinks SET
    template = COALESCE(template, 'default'),
    customization = COALESCE(customization, '{
        "primaryColor": "#1976d2",
        "backgroundColor": "#ffffff",
        "textColor": "#333333"
    }'::jsonb),
    click_count = COALESCE(click_count, 0),
    is_active = COALESCE(is_active, true)
WHERE template IS NULL
   OR customization IS NULL
   OR click_count IS NULL
   OR is_active IS NULL;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check smartlinks table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'smartlinks'
ORDER BY ordinal_position;

-- Check if odesli_cache table exists
SELECT 'odesli_cache table exists' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'odesli_cache');

-- Check if analytics table exists
SELECT 'analytics table exists' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics');

-- Show all table names
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

RAISE NOTICE '============================================';
RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
RAISE NOTICE '============================================';
RAISE NOTICE 'Tables verified: smartlinks, odesli_cache, analytics';
RAISE NOTICE 'All missing columns added to smartlinks table';
RAISE NOTICE 'Indexes created for performance';
RAISE NOTICE '============================================';
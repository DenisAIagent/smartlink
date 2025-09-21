-- Migration script to add tracking_pixels column to production database
-- Run this in Railway PostgreSQL console

-- Add tracking_pixels column to smartlinks table
ALTER TABLE smartlinks
ADD COLUMN IF NOT EXISTS tracking_pixels JSONB DEFAULT '{
  "google_analytics": null,
  "google_tag_manager": null,
  "meta_pixel": null,
  "tiktok_pixel": null,
  "custom_scripts": []
}';

-- Update existing smartlinks with default tracking structure
UPDATE smartlinks
SET tracking_pixels = '{
  "google_analytics": null,
  "google_tag_manager": null,
  "meta_pixel": null,
  "tiktok_pixel": null,
  "custom_scripts": []
}'
WHERE tracking_pixels IS NULL;

-- Verify the migration
SELECT
  id,
  slug,
  title,
  tracking_pixels
FROM smartlinks
ORDER BY created_at DESC
LIMIT 5;

-- Show table structure to confirm
\d smartlinks;
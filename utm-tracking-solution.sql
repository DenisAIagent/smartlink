-- Migration pour ajouter les colonnes UTM tracking
-- Ajouter des colonnes pour chaque plateforme dans la table smartlinks

ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS spotify_clicks INT DEFAULT 0;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS deezer_clicks INT DEFAULT 0;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS apple_music_clicks INT DEFAULT 0;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS youtube_music_clicks INT DEFAULT 0;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS tidal_clicks INT DEFAULT 0;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS amazon_music_clicks INT DEFAULT 0;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS soundcloud_clicks INT DEFAULT 0;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS bandcamp_clicks INT DEFAULT 0;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_smartlinks_clicks ON smartlinks(spotify_clicks, deezer_clicks, apple_music_clicks);

-- Fonction pour incrémenter les clics par plateforme
CREATE OR REPLACE FUNCTION increment_platform_clicks(smartlink_slug TEXT, platform_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    column_name TEXT;
    sql_query TEXT;
BEGIN
    -- Mapper le nom de plateforme à la colonne
    CASE platform_name
        WHEN 'spotify' THEN column_name := 'spotify_clicks';
        WHEN 'deezer' THEN column_name := 'deezer_clicks';
        WHEN 'apple_music' THEN column_name := 'apple_music_clicks';
        WHEN 'youtube_music' THEN column_name := 'youtube_music_clicks';
        WHEN 'tidal' THEN column_name := 'tidal_clicks';
        WHEN 'amazon_music' THEN column_name := 'amazon_music_clicks';
        WHEN 'soundcloud' THEN column_name := 'soundcloud_clicks';
        WHEN 'bandcamp' THEN column_name := 'bandcamp_clicks';
        ELSE
            -- Plateforme inconnue, on incrémente click_count général
            UPDATE smartlinks SET click_count = click_count + 1 WHERE slug = smartlink_slug;
            RETURN TRUE;
    END CASE;

    -- Construire et exécuter la requête dynamique
    sql_query := 'UPDATE smartlinks SET ' || column_name || ' = ' || column_name || ' + 1, click_count = click_count + 1, updated_at = NOW() WHERE slug = $1';

    EXECUTE sql_query USING smartlink_slug;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
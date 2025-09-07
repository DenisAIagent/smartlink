-- MDMC SmartLink PostgreSQL Schema with Odesli Integration
-- Create the database and connect (run separately if needed)
-- CREATE DATABASE smartlink_prod;
-- \c smartlink_prod;

-- Extension for UUID (optional but useful)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  photo_url TEXT,
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  smartlinks_count INT DEFAULT 0 CHECK (smartlinks_count >= 0),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_verified BOOLEAN DEFAULT false,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP WITH TIME ZONE
);

-- Table smartlinks
CREATE TABLE smartlinks (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  description TEXT,
  cover_url TEXT,
  preview_audio_url TEXT,
  platforms JSONB DEFAULT '[]'::jsonb,
  template VARCHAR(50) DEFAULT 'default',
  customization JSONB DEFAULT '{
    "primaryColor": "#1976d2",
    "backgroundColor": "#ffffff",
    "textColor": "#333333"
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  click_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Données Odesli
  odesli_data JSONB,
  odesli_fetched_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Table analytics (partitioned)
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

-- Partitions for 2024-2025
CREATE TABLE analytics_2024_01 PARTITION OF analytics FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE analytics_2024_02 PARTITION OF analytics FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE analytics_2024_03 PARTITION OF analytics FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE analytics_2024_04 PARTITION OF analytics FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE analytics_2024_05 PARTITION OF analytics FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE analytics_2024_06 PARTITION OF analytics FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE analytics_2024_07 PARTITION OF analytics FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE analytics_2024_08 PARTITION OF analytics FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE analytics_2024_09 PARTITION OF analytics FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE analytics_2024_10 PARTITION OF analytics FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE analytics_2024_11 PARTITION OF analytics FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE analytics_2024_12 PARTITION OF analytics FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Add 2025 partitions
CREATE TABLE analytics_2025_01 PARTITION OF analytics FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE analytics_2025_02 PARTITION OF analytics FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE analytics_2025_03 PARTITION OF analytics FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE analytics_2025_04 PARTITION OF analytics FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE analytics_2025_05 PARTITION OF analytics FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE analytics_2025_06 PARTITION OF analytics FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE analytics_2025_07 PARTITION OF analytics FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE analytics_2025_08 PARTITION OF analytics FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE analytics_2025_09 PARTITION OF analytics FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE analytics_2025_10 PARTITION OF analytics FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE analytics_2025_11 PARTITION OF analytics FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE analytics_2025_12 PARTITION OF analytics FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Table cache Odesli (IMPORTANT!)
CREATE TABLE odesli_cache (
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

-- Table sessions
CREATE TABLE sessions (
  sid VARCHAR(255) PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_smartlinks_user_id ON smartlinks(user_id);
CREATE INDEX idx_smartlinks_slug ON smartlinks(slug);
CREATE INDEX idx_smartlinks_created ON smartlinks(created_at DESC);
CREATE INDEX idx_analytics_smartlink ON analytics(smartlink_id, clicked_at DESC);
CREATE INDEX idx_odesli_url ON odesli_cache(source_url);
CREATE INDEX idx_odesli_expires ON odesli_cache(expires_at);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER smartlinks_updated_at BEFORE UPDATE ON smartlinks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to clean expired cache (cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM odesli_cache WHERE expires_at < NOW();
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (optional)
-- Admin user (password: admin123)
INSERT INTO users (email, password_hash, display_name, plan, email_verified) 
VALUES ('admin@mdmcmusicads.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'MDMC Admin', 'pro', true)
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'Table des utilisateurs avec authentification JWT';
COMMENT ON TABLE smartlinks IS 'Table des SmartLinks avec données Odesli intégrées';
COMMENT ON TABLE odesli_cache IS 'Cache des requêtes Odesli pour optimiser les performances';
COMMENT ON TABLE analytics IS 'Table des clics partitionnée par mois pour les performances';
COMMENT ON FUNCTION cleanup_expired_cache() IS 'Fonction pour nettoyer le cache expiré - à exécuter via cron';
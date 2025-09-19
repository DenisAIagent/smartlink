# Railway Production Database Migration Commands

## 🚨 Critical Fix for Production Database Errors

The production database is missing essential tables and columns, causing these errors:
- `column "slug" does not exist in smartlinks table`
- `relation "odesli_cache" does not exist`

## Method 1: Via Railway Dashboard (Recommended)

1. **Access Railway Database Console:**
   - Go to your Railway project dashboard
   - Click on your PostgreSQL database service
   - Go to the "Data" tab
   - Click "Query" to open the SQL console

2. **Run the Migration Script:**
   Copy and paste the entire content of `migration-fix-production.sql` into the Railway SQL console and execute it.

## Method 2: Via Railway CLI

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Connect to your project
railway link

# Run the migration script
railway run psql $DATABASE_URL -f migration-fix-production.sql
```

## Method 3: Via psql Connection

```bash
# Connect directly to Railway PostgreSQL
psql "postgresql://username:password@host:port/database"

# Then run:
\i migration-fix-production.sql
```

## Method 4: Via Node.js Script (Emergency Backup)

Create and run this script if other methods fail:

```javascript
const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to Railway PostgreSQL');

    // Read and execute the migration script
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./migration-fix-production.sql', 'utf8');

    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
```

## Quick Manual Fix (If Script Fails)

If the full script fails, run these commands one by one:

### 1. Fix Smartlinks Table
```sql
-- Add missing columns
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS artist VARCHAR(255);
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS preview_audio_url TEXT;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'default';
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS customization JSONB DEFAULT '{"primaryColor": "#1976d2", "backgroundColor": "#ffffff", "textColor": "#333333"}'::jsonb;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS odesli_data JSONB;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS odesli_fetched_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE smartlinks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### 2. Create Odesli Cache Table
```sql
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

CREATE INDEX IF NOT EXISTS idx_odesli_url ON odesli_cache(source_url);
CREATE INDEX IF NOT EXISTS idx_odesli_expires ON odesli_cache(expires_at);
```

### 3. Create Analytics Table
```sql
CREATE TABLE IF NOT EXISTS analytics (
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

-- Create current partition
CREATE TABLE IF NOT EXISTS analytics_2025_09 PARTITION OF analytics
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
```

## Verification Commands

After running the migration, verify everything is working:

```sql
-- Check smartlinks table structure
\d smartlinks

-- Verify odesli_cache exists
\d odesli_cache

-- Verify analytics exists
\d analytics

-- Test the problematic query
SELECT id, slug, title, artist, cover_url FROM smartlinks LIMIT 1;
```

## Post-Migration Steps

1. **Restart Railway Application:**
   - Go to Railway dashboard
   - Find your application service
   - Click "Restart" to refresh the database connections

2. **Monitor Logs:**
   - Check Railway logs for any remaining database errors
   - Test SmartLink creation and retrieval

3. **Test Key Features:**
   - Create a new SmartLink
   - Access an existing SmartLink by slug
   - Verify analytics recording

## Troubleshooting

### If Column Already Exists Error:
The migration script uses `IF NOT EXISTS` checks, but if you get errors, run:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'smartlinks';
```

### If Permission Denied:
Ensure you're connected as the database owner or with sufficient privileges.

### If Connection Issues:
- Verify DATABASE_URL environment variable
- Check Railway database is running
- Ensure your IP is whitelisted (if applicable)

## Emergency Rollback

If something goes wrong, you can drop the new tables:
```sql
DROP TABLE IF EXISTS odesli_cache CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
-- For columns, you'd need to drop them individually
```

## Expected Results

After successful migration:
- ✅ SmartLinks queries work without "column does not exist" errors
- ✅ Odesli cache functionality operational
- ✅ Analytics tracking functional
- ✅ All existing SmartLinks remain accessible
- ✅ New SmartLinks can be created with full feature set
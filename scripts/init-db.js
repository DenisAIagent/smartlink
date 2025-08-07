const pool = require('../backend/db/connection.js');

const queries = `
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS smartlinks;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(50) DEFAULT 'artist' NOT NULL
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE TABLE smartlinks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    artist_name VARCHAR(255),
    artwork_url TEXT,
    spotify_url TEXT,
    apple_music_url TEXT,
    youtube_url TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add some indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_smartlinks_slug ON smartlinks(slug);
CREATE INDEX idx_smartlinks_user_id ON smartlinks(user_id);

-- Add a comment to indicate completion
COMMENT ON TABLE users IS 'Schema for user authentication';
`;

const initDb = async () => {
  console.log('Running database initialization script...');
  const client = await pool.connect();
  try {
    console.log('Executing schema creation queries...');
    await client.query(queries);
    console.log('✅ Database schema initialized successfully.');
  } catch (err) {
    console.error('🔥 Error initializing database schema:', err.stack);
    process.exit(1); // Exit with error code
  } finally {
    console.log('Releasing database client.');
    client.release();
    // End the pool to allow the script to exit gracefully
    await pool.end();
  }
};

// Check if DATABASE_URL is set before running
if (!process.env.DATABASE_URL) {
  console.error('🔥 DATABASE_URL is not set. Please create a .env file based on .env.example');
  process.exit(1);
}

initDb();

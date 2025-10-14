const pg = require('pg');
const { Pool } = pg;

// Connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query helper with logging
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries in dev
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn('⚠️ Slow query:', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    
    return res.rows;
  } catch (error) {
    console.error('❌ DB Query Error:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

// Single row helper
async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

// Transaction helper
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check function
async function healthCheck() {
  try {
    const result = await queryOne('SELECT NOW() as now, version() as version');
    return {
      status: 'healthy',
      timestamp: result.now,
      version: result.version.split(' ')[0] + ' ' + result.version.split(' ')[1]
    };
  } catch (error) {
    throw new Error(`Database health check failed: ${error.message}`);
  }
}

// Close pool (for graceful shutdown)
async function close() {
  await pool.end();
}

module.exports = {
  query,
  queryOne,
  transaction,
  healthCheck,
  close,
  pool
};
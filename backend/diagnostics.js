const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db/connection.js');
require('dotenv').config();

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

const log = (color, label, message) => {
  console.log(`${BOLD}${color}${label}${RESET} ${message}`);
};

const runDiagnostics = async () => {
  console.log(`${BOLD}--- Running Authentication Workflow Diagnostics ---${RESET}\n`);

  // 1. Environment Variable Check
  log(YELLOW, '[CHECK 1]', 'Checking for critical environment variables...');
  const dbUrl = process.env.DATABASE_URL;
  const jwtSecret = process.env.JWT_SECRET;
  if (dbUrl) {
    log(GREEN, '  [PASS]', 'DATABASE_URL is set.');
  } else {
    log(RED, '  [FAIL]', 'DATABASE_URL is NOT set. This is required for database connection.');
  }
  if (jwtSecret) {
    log(GREEN, '  [PASS]', 'JWT_SECRET is set.');
  } else {
    log(RED, '  [FAIL]', 'JWT_SECRET is NOT set. This is required for token signing.');
  }
  console.log('');

  // 2. App Configuration Check
  log(YELLOW, '[CHECK 2]', 'Analyzing src/app.js for required middleware...');
  const appJsPath = path.join(__dirname, '../src/app.js');
  try {
    const appJsContent = fs.readFileSync(appJsPath, 'utf8');
    if (appJsContent.includes('app.use(cors(')) {
      log(GREEN, '  [PASS]', 'CORS middleware seems to be configured.');
    } else {
      log(RED, '  [FAIL]', 'CORS middleware (app.use(cors())) not found. This can cause frontend requests to fail.');
    }
    if (appJsContent.includes('app.use(express.json(')) {
      log(GREEN, '  [PASS]', 'express.json() middleware is configured for parsing request bodies.');
    } else {
      log(RED, '  [FAIL]', 'express.json() middleware not found. The backend will not be able to parse JSON request bodies.');
    }
  } catch (error) {
    log(RED, '  [FAIL]', `Could not read src/app.js: ${error.message}`);
  }
  console.log('');

  // 3. Database Connection Test
  log(YELLOW, '[CHECK 3]', 'Attempting to connect to PostgreSQL database...');
  let dbClient;
  try {
    if (!dbUrl) {
      throw new Error('Skipping test because DATABASE_URL is not set.');
    }
    dbClient = await pool.connect();
    await dbClient.query('SELECT NOW()');
    log(GREEN, '  [PASS]', 'Successfully connected to PostgreSQL and executed a query.');
  } catch (error) {
    log(RED, '  [FAIL]', `Failed to connect to PostgreSQL: ${error.message}`);
  } finally {
    if (dbClient) {
      dbClient.release();
    }
  }
  console.log('');

  // 4. Bcrypt Sanity Check
  log(YELLOW, '[CHECK 4]', 'Performing bcrypt sanity check...');
  try {
    const saltRounds = 10;
    const testPassword = 'test_password_123';
    const hash = await bcrypt.hash(testPassword, saltRounds);
    const isMatch = await bcrypt.compare(testPassword, hash);
    if (isMatch) {
      log(GREEN, '  [PASS]', 'bcrypt hashing and comparison is working correctly.');
    } else {
      throw new Error('Comparison failed.');
    }
  } catch (error) {
    log(RED, '  [FAIL]', `bcrypt sanity check failed: ${error.message}`);
  }
  console.log('');

  // 5. JWT Sanity Check
  log(YELLOW, '[CHECK 5]', 'Performing JWT sanity check...');
  try {
    if (!jwtSecret) {
      throw new Error('Skipping test because JWT_SECRET is not set.');
    }
    const payload = { user: 'test' };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1m' });
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.user === 'test') {
      log(GREEN, '  [PASS]', 'JWT signing and verification is working correctly.');
    } else {
      throw new Error('Decoded token payload does not match.');
    }
  } catch (error) {
    log(RED, '  [FAIL]', `JWT sanity check failed: ${error.message}`);
  }
  console.log('');

  console.log(`${BOLD}--- Diagnostics Complete ---${RESET}`);
  // In a real CI/CD, you might exit with a non-zero code on failure
  // For this script, we'll just log and exit gracefully.
  process.exit(0);
};

runDiagnostics();

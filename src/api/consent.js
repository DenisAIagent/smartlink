const express = require('express');
const { query } = require('../lib/db');
const router = express.Router();

/**
 * GDPR Consent Management API
 * Handles consent storage and audit trail
 */

/**
 * POST /api/consent/save - Save user consent
 */
router.post('/save', async (req, res) => {
  try {
    const {
      functional,
      analytics,
      marketing,
      timestamp,
      version,
      userAgent,
      ipAddress
    } = req.body;

    // Get client IP if not provided
    const clientIP = ipAddress || req.ip || req.connection.remoteAddress || 'unknown';

    // Create consent record
    const result = await query(`
      INSERT INTO consent_records (
        ip_address,
        user_agent,
        functional_consent,
        analytics_consent,
        marketing_consent,
        consent_timestamp,
        consent_version,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [
      clientIP,
      userAgent,
      functional,
      analytics,
      marketing,
      timestamp,
      version
    ]);

    res.json({
      success: true,
      consentId: result.rows[0].id,
      message: 'Consent saved successfully'
    });

  } catch (error) {
    console.error('Error saving consent:', error);

    // If table doesn't exist, create it
    if (error.message.includes('relation "consent_records" does not exist')) {
      try {
        await createConsentTable();
        // Retry the operation
        return router.handle(req, res);
      } catch (createError) {
        console.error('Error creating consent table:', createError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to save consent'
    });
  }
});

/**
 * GET /api/consent/status/:ip - Get consent status for IP
 */
router.get('/status/:ip', async (req, res) => {
  try {
    const { ip } = req.params;

    const result = await query(`
      SELECT
        functional_consent,
        analytics_consent,
        marketing_consent,
        consent_timestamp,
        consent_version
      FROM consent_records
      WHERE ip_address = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [ip]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        hasConsent: false,
        consent: null
      });
    }

    const consent = result.rows[0];

    // Check if consent is still valid (1 year)
    const consentDate = new Date(consent.consent_timestamp);
    const now = new Date();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const isValid = (now - consentDate) < oneYear;

    res.json({
      success: true,
      hasConsent: isValid,
      consent: isValid ? {
        functional: consent.functional_consent,
        analytics: consent.analytics_consent,
        marketing: consent.marketing_consent,
        timestamp: consent.consent_timestamp,
        version: consent.consent_version
      } : null
    });

  } catch (error) {
    console.error('Error getting consent status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get consent status'
    });
  }
});

/**
 * GET /api/client-ip - Get client IP address
 */
router.get('/client-ip', (req, res) => {
  const clientIP = req.ip ||
                  req.connection.remoteAddress ||
                  req.socket.remoteAddress ||
                  (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                  req.headers['x-forwarded-for'] ||
                  req.headers['x-real-ip'] ||
                  'unknown';

  res.json({
    success: true,
    ip: clientIP
  });
});

/**
 * GET /api/consent/audit - Get consent audit trail (Admin only)
 */
router.get('/audit', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.id !== 2) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT
        id,
        ip_address,
        user_agent,
        functional_consent,
        analytics_consent,
        marketing_consent,
        consent_timestamp,
        consent_version,
        created_at
      FROM consent_records
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await query('SELECT COUNT(*) FROM consent_records');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      records: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting consent audit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get consent audit'
    });
  }
});

/**
 * Create consent_records table if it doesn't exist
 */
async function createConsentTable() {
  // Create table first
  await query(`
    CREATE TABLE IF NOT EXISTS consent_records (
      id SERIAL PRIMARY KEY,
      ip_address VARCHAR(45) NOT NULL,
      user_agent TEXT,
      functional_consent BOOLEAN NOT NULL DEFAULT true,
      analytics_consent BOOLEAN NOT NULL DEFAULT false,
      marketing_consent BOOLEAN NOT NULL DEFAULT false,
      consent_timestamp TIMESTAMP NOT NULL,
      consent_version VARCHAR(10) NOT NULL DEFAULT '1.0',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create indexes separately
  await query(`
    CREATE INDEX IF NOT EXISTS idx_consent_ip ON consent_records (ip_address);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_consent_timestamp ON consent_records (consent_timestamp);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_consent_created ON consent_records (created_at);
  `);

  console.log('✅ Consent records table created successfully');
}

/**
 * Initialize consent system - create table if needed
 */
async function initializeConsentSystem() {
  try {
    await createConsentTable();
    console.log('📊 GDPR Consent system initialized');
  } catch (error) {
    console.error('❌ Error initializing consent system:', error);
  }
}

module.exports = {
  router,
  initializeConsentSystem
};
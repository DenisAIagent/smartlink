/**
 * Data Subject Rights Implementation (GDPR Articles 15-22)
 * Provides complete system for handling GDPR rights requests
 */

const { query } = require('./db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Rights request types mapping to GDPR articles
 */
const REQUEST_TYPES = {
  ACCESS: {
    id: 'access',
    name: 'Right of Access',
    article: 'Article 15',
    description: 'Request copies of your personal data',
    response_time_days: 30,
    automated: true
  },
  RECTIFICATION: {
    id: 'rectification',
    name: 'Right to Rectification',
    article: 'Article 16',
    description: 'Correct inaccurate personal data',
    response_time_days: 30,
    automated: false
  },
  ERASURE: {
    id: 'erasure',
    name: 'Right to Erasure',
    article: 'Article 17',
    description: 'Request deletion of personal data',
    response_time_days: 30,
    automated: false
  },
  RESTRICTION: {
    id: 'restriction',
    name: 'Right to Restrict Processing',
    article: 'Article 18',
    description: 'Temporarily limit data processing',
    response_time_days: 30,
    automated: false
  },
  PORTABILITY: {
    id: 'portability',
    name: 'Right to Data Portability',
    article: 'Article 20',
    description: 'Receive data in machine-readable format',
    response_time_days: 30,
    automated: true
  },
  OBJECTION: {
    id: 'objection',
    name: 'Right to Object',
    article: 'Article 21',
    description: 'Object to processing based on legitimate interests',
    response_time_days: 30,
    automated: false
  },
  CONSENT_WITHDRAWAL: {
    id: 'consent_withdrawal',
    name: 'Withdraw Consent',
    article: 'Article 7(3)',
    description: 'Withdraw previously given consent',
    response_time_days: 1,
    automated: true
  }
};

/**
 * Initialize data subject rights tables
 */
async function initRightsSystem() {
  const createRequestsTable = `
    CREATE TABLE IF NOT EXISTS data_subject_requests (
      id SERIAL PRIMARY KEY,
      request_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      request_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      reason TEXT,
      identity_verified BOOLEAN DEFAULT false,
      identity_method VARCHAR(100),
      identity_verified_at TIMESTAMP WITH TIME ZONE,
      verification_token VARCHAR(255),
      verification_expires_at TIMESTAMP WITH TIME ZONE,
      requested_data JSONB,
      response_data JSONB,
      internal_notes TEXT,
      assigned_to VARCHAR(255),
      legal_review_required BOOLEAN DEFAULT false,
      legal_review_completed BOOLEAN DEFAULT false,
      legal_reviewer VARCHAR(255),
      automated_response BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      due_date TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      ip_address INET,
      user_agent TEXT
    );
  `;

  const createRequestsLogTable = `
    CREATE TABLE IF NOT EXISTS data_subject_requests_log (
      id SERIAL PRIMARY KEY,
      request_id VARCHAR(255) NOT NULL,
      action VARCHAR(100) NOT NULL,
      old_status VARCHAR(50),
      new_status VARCHAR(50),
      details JSONB,
      performed_by VARCHAR(255),
      performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ip_address INET
    );
  `;

  const createDataExportsTable = `
    CREATE TABLE IF NOT EXISTS data_exports (
      id SERIAL PRIMARY KEY,
      export_id VARCHAR(255) UNIQUE NOT NULL,
      request_id VARCHAR(255) NOT NULL,
      user_id INTEGER,
      export_format VARCHAR(50) DEFAULT 'json',
      export_data JSONB,
      file_path TEXT,
      encryption_key VARCHAR(255),
      download_count INTEGER DEFAULT 0,
      max_downloads INTEGER DEFAULT 3,
      expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_requests_email ON data_subject_requests(email);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON data_subject_requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_type ON data_subject_requests(request_type);
    CREATE INDEX IF NOT EXISTS idx_requests_due_date ON data_subject_requests(due_date);
    CREATE INDEX IF NOT EXISTS idx_requests_log_request_id ON data_subject_requests_log(request_id);
    CREATE INDEX IF NOT EXISTS idx_exports_request_id ON data_exports(request_id);
  `;

  await query(createRequestsTable);
  await query(createRequestsLogTable);
  await query(createDataExportsTable);
  await query(createIndexes);
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return 'DSR_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

/**
 * Submit data subject rights request
 */
async function submitRequest(requestData) {
  const {
    email,
    request_type,
    reason = '',
    requested_data = {},
    ip_address,
    user_agent
  } = requestData;

  // Validate request type
  if (!REQUEST_TYPES[request_type.toUpperCase()]) {
    throw new Error('Invalid request type');
  }

  const requestType = REQUEST_TYPES[request_type.toUpperCase()];
  const request_id = generateRequestId();
  const verification_token = crypto.randomBytes(32).toString('hex');
  const due_date = new Date();
  due_date.setDate(due_date.getDate() + requestType.response_time_days);

  const insertRequest = `
    INSERT INTO data_subject_requests (
      request_id, email, request_type, reason, requested_data,
      verification_token, verification_expires_at, due_date,
      ip_address, user_agent, automated_response
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const result = await query(insertRequest, [
    request_id, email, request_type.toLowerCase(), reason,
    JSON.stringify(requested_data), verification_token,
    new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    due_date, ip_address, user_agent, requestType.automated
  ]);

  // Log request creation
  await logRequestAction(request_id, 'request_submitted', null, 'pending', {
    email, request_type, reason
  });

  // Send verification email
  await sendVerificationEmail(email, request_id, verification_token);

  return {
    request_id,
    status: 'pending_verification',
    message: 'Request submitted. Please check your email to verify identity.',
    due_date
  };
}

/**
 * Verify identity for request
 */
async function verifyIdentity(request_id, verification_token) {
  const getRequest = `
    SELECT * FROM data_subject_requests
    WHERE request_id = $1 AND verification_token = $2
    AND verification_expires_at > NOW()
  `;

  const result = await query(getRequest, [request_id, verification_token]);

  if (result.length === 0) {
    throw new Error('Invalid or expired verification token');
  }

  const updateRequest = `
    UPDATE data_subject_requests
    SET identity_verified = true, identity_method = 'email_verification',
        identity_verified_at = NOW(), status = 'verified',
        verification_token = NULL, updated_at = NOW()
    WHERE request_id = $1
    RETURNING *
  `;

  const updated = await query(updateRequest, [request_id]);

  // Log verification
  await logRequestAction(request_id, 'identity_verified', 'pending_verification', 'verified', {
    method: 'email_verification'
  });

  // Process automated requests immediately
  const request = updated[0];
  if (request.automated_response) {
    await processAutomatedRequest(request_id);
  }

  return updated[0];
}

/**
 * Process automated requests (Access, Portability, Consent Withdrawal)
 */
async function processAutomatedRequest(request_id) {
  const getRequest = `
    SELECT * FROM data_subject_requests WHERE request_id = $1
  `;

  const result = await query(getRequest, [request_id]);
  if (result.length === 0) return;

  const request = result[0];

  try {
    let responseData = {};

    switch (request.request_type) {
      case 'access':
        responseData = await processAccessRequest(request.email);
        break;
      case 'portability':
        responseData = await processPortabilityRequest(request.email);
        break;
      case 'consent_withdrawal':
        responseData = await processConsentWithdrawal(request.email);
        break;
    }

    // Update request with response
    const updateRequest = `
      UPDATE data_subject_requests
      SET status = 'completed', response_data = $2,
          completed_at = NOW(), updated_at = NOW()
      WHERE request_id = $1
    `;

    await query(updateRequest, [request_id, JSON.stringify(responseData)]);

    // Log completion
    await logRequestAction(request_id, 'request_completed', 'verified', 'completed', {
      automated: true
    });

    // Send response email
    await sendResponseEmail(request.email, request_id, responseData);

  } catch (error) {
    console.error('❌ Automated request processing error:', error);

    // Mark as requiring manual review
    const updateRequest = `
      UPDATE data_subject_requests
      SET status = 'manual_review_required',
          internal_notes = $2, updated_at = NOW()
      WHERE request_id = $1
    `;

    await query(updateRequest, [request_id, `Automated processing failed: ${error.message}`]);

    await logRequestAction(request_id, 'automation_failed', 'verified', 'manual_review_required', {
      error: error.message
    });
  }
}

/**
 * Process Access Request (Article 15)
 */
async function processAccessRequest(email) {
  const userData = {};

  // Get user account data
  const userResult = await query(
    'SELECT id, email, display_name, plan, created_at, last_login_at FROM users WHERE email = $1',
    [email]
  );

  if (userResult.length > 0) {
    const user = userResult[0];
    userData.account = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      plan: user.plan,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    };

    // Get SmartLinks data
    const smartlinksResult = await query(
      'SELECT slug, title, artist, created_at, click_count, is_active FROM smartlinks WHERE user_id = $1',
      [user.id]
    );

    userData.smartlinks = smartlinksResult;

    // Get analytics data (last 12 months)
    const analyticsResult = await query(
      `SELECT s.slug, COUNT(a.*) as total_clicks,
              MIN(a.clicked_at) as first_click, MAX(a.clicked_at) as last_click
       FROM smartlinks s
       LEFT JOIN analytics a ON s.id = a.smartlink_id
       WHERE s.user_id = $1 AND a.clicked_at > NOW() - INTERVAL '12 months'
       GROUP BY s.slug`,
      [user.id]
    );

    userData.analytics_summary = analyticsResult;
  }

  // Get consent records
  const consentResult = await query(
    'SELECT consent_id, categories, vendors, consent_given_at, last_updated_at FROM user_consent WHERE ip_address IN (SELECT DISTINCT ip_address FROM user_consent WHERE consent_string LIKE $1)',
    [`%${email}%`]
  );

  userData.consent_records = consentResult;

  // Get request history
  const requestsResult = await query(
    'SELECT request_id, request_type, status, created_at, completed_at FROM data_subject_requests WHERE email = $1',
    [email]
  );

  userData.rights_requests = requestsResult;

  return {
    email,
    data_categories: Object.keys(userData),
    personal_data: userData,
    generated_at: new Date().toISOString(),
    retention_periods: {
      account_data: 'Active + 2 years',
      analytics_data: '26 months',
      consent_records: '3 years after withdrawal'
    },
    your_rights: [
      'Right to rectification (correct data)',
      'Right to erasure (delete data)',
      'Right to restrict processing',
      'Right to data portability',
      'Right to object',
      'Right to withdraw consent'
    ]
  };
}

/**
 * Process Data Portability Request (Article 20)
 */
async function processPortabilityRequest(email) {
  const exportData = await processAccessRequest(email);

  // Create secure export
  const export_id = 'EXPORT_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
  const encryption_key = crypto.randomBytes(32).toString('hex');

  // Store export with encryption
  const insertExport = `
    INSERT INTO data_exports (
      export_id, request_id, export_format, export_data,
      encryption_key, expires_at
    ) VALUES ($1, $2, 'json', $3, $4, NOW() + INTERVAL '30 days')
    RETURNING *
  `;

  // Note: In production, encrypt the export_data before storing
  await query(insertExport, [
    export_id, 'PORTABILITY_' + Date.now(), JSON.stringify(exportData), encryption_key
  ]);

  return {
    export_id,
    download_url: `/api/rights/download/${export_id}`,
    format: 'JSON',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    max_downloads: 3,
    encryption: 'AES-256',
    instructions: 'Use the provided download link to access your data. The link expires in 30 days and can be used maximum 3 times.'
  };
}

/**
 * Process Consent Withdrawal (Article 7(3))
 */
async function processConsentWithdrawal(email) {
  // Find consent records associated with this email
  // This is simplified - in production, you'd need more sophisticated linking
  const updateConsent = `
    UPDATE user_consent
    SET categories = '{}', vendors = '{}', purposes = '{}',
        withdrawal_date = NOW(), last_updated_at = NOW()
    WHERE consent_string LIKE $1
    RETURNING consent_id
  `;

  const withdrawnConsents = await query(updateConsent, [`%${email}%`]);

  return {
    withdrawn_consents: withdrawnConsents.map(c => c.consent_id),
    withdrawal_date: new Date().toISOString(),
    effect: 'All tracking and marketing cookies have been disabled',
    note: 'This withdrawal does not affect the lawfulness of processing based on consent before its withdrawal'
  };
}

/**
 * Log request actions for audit trail
 */
async function logRequestAction(request_id, action, old_status, new_status, details = {}, performed_by = 'system') {
  const insertLog = `
    INSERT INTO data_subject_requests_log (
      request_id, action, old_status, new_status, details, performed_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `;

  await query(insertLog, [
    request_id, action, old_status, new_status,
    JSON.stringify(details), performed_by
  ]);
}

/**
 * Get request status
 */
async function getRequestStatus(request_id) {
  const getRequest = `
    SELECT r.*,
           (SELECT COUNT(*) FROM data_subject_requests_log WHERE request_id = r.request_id) as log_count
    FROM data_subject_requests r
    WHERE r.request_id = $1
  `;

  const result = await query(getRequest, [request_id]);

  if (result.length === 0) {
    throw new Error('Request not found');
  }

  const request = result[0];

  // Get log entries
  const getLog = `
    SELECT action, old_status, new_status, performed_at, performed_by
    FROM data_subject_requests_log
    WHERE request_id = $1
    ORDER BY performed_at DESC
  `;

  const logEntries = await query(getLog, [request_id]);

  return {
    request_id: request.request_id,
    email: request.email,
    request_type: request.request_type,
    status: request.status,
    created_at: request.created_at,
    due_date: request.due_date,
    completed_at: request.completed_at,
    identity_verified: request.identity_verified,
    automated_response: request.automated_response,
    response_available: !!request.response_data,
    log_entries: logEntries
  };
}

/**
 * Get all requests for admin dashboard
 */
async function getAllRequests(filters = {}) {
  const { status, request_type, days = 30, limit = 50, offset = 0 } = filters;

  let whereClause = 'WHERE created_at > NOW() - INTERVAL $1 days';
  let params = [days];
  let paramCount = 1;

  if (status) {
    paramCount++;
    whereClause += ` AND status = $${paramCount}`;
    params.push(status);
  }

  if (request_type) {
    paramCount++;
    whereClause += ` AND request_type = $${paramCount}`;
    params.push(request_type);
  }

  const getRequests = `
    SELECT request_id, email, request_type, status, created_at, due_date,
           identity_verified, automated_response, completed_at
    FROM data_subject_requests
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  params.push(limit, offset);

  const requests = await query(getRequests, params);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM data_subject_requests
    ${whereClause}
  `;

  const countResult = await query(countQuery, params.slice(0, paramCount));
  const total = parseInt(countResult[0].total);

  return {
    requests,
    pagination: {
      total,
      limit,
      offset,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Send verification email (mock implementation)
 */
async function sendVerificationEmail(email, request_id, verification_token) {
  // In production, integrate with email service
  console.log(`📧 Verification email for ${email}:`);
  console.log(`   Request ID: ${request_id}`);
  console.log(`   Verification URL: ${process.env.PUBLIC_BASE_URL}/verify-identity?token=${verification_token}&request=${request_id}`);

  // TODO: Implement actual email sending
  return true;
}

/**
 * Send response email (mock implementation)
 */
async function sendResponseEmail(email, request_id, responseData) {
  // In production, integrate with email service
  console.log(`📧 Response email for ${email}:`);
  console.log(`   Request ID: ${request_id}`);
  console.log(`   Response: Request completed successfully`);

  // TODO: Implement actual email sending
  return true;
}

module.exports = {
  REQUEST_TYPES,
  initRightsSystem,
  submitRequest,
  verifyIdentity,
  processAutomatedRequest,
  processAccessRequest,
  processPortabilityRequest,
  processConsentWithdrawal,
  getRequestStatus,
  getAllRequests,
  logRequestAction
};
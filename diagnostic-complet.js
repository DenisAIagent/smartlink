#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3003';
const PROD_URL = 'https://smartlink.mdmcmusicads.com';

console.log('🔍 DIAGNOSTIC COMPLET SMARTLINK SYSTEM');
console.log('=====================================\n');

// Test results storage
const testResults = {
  local: { passed: 0, failed: 0, tests: [] },
  production: { passed: 0, failed: 0, tests: [] }
};

function logTest(env, testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${env.toUpperCase()}] ${status}: ${testName}`);
  if (details) console.log(`   └─ ${details}`);

  testResults[env].tests.push({ name: testName, passed, details });
  if (passed) testResults[env].passed++;
  else testResults[env].failed++;
}

async function testEndpoint(env, url, testName, expectedStatus = 200) {
  try {
    const response = await fetch(url);
    const passed = response.status === expectedStatus;
    logTest(env, testName, passed, `Status: ${response.status}`);
    return { passed, response };
  } catch (error) {
    logTest(env, testName, false, `Error: ${error.message}`);
    return { passed: false, error };
  }
}

async function testLocalSystem() {
  console.log('\n🏠 TESTS LOCAL SYSTEM');
  console.log('=====================\n');

  // Test 1: Base server health
  await testEndpoint('local', `${BASE_URL}/`, 'Base server responds');

  // Test 2: Static assets
  await testEndpoint('local', `${BASE_URL}/assets/images/platforms/picto_spotify.png`, 'Spotify icon loads');

  // Test 3: SmartLink public pages
  await testEndpoint('local', `${BASE_URL}/s/test-icons-fix-mf9t71ar`, 'SmartLink public page loads');

  // Test 4: Dashboard access (should redirect if not authenticated)
  const dashboardTest = await testEndpoint('local', `${BASE_URL}/pages/dashboard.html`, 'Dashboard page exists', null);

  // Test 5: API endpoints (without auth, should get 401/403)
  await testEndpoint('local', `${BASE_URL}/api/smartlinks`, 'SmartLinks API responds', 401);

  // Test 6: Authentication endpoint
  try {
    const authResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
    });
    logTest('local', 'Auth endpoint responds', authResponse.status === 401, `Status: ${authResponse.status}`);
  } catch (error) {
    logTest('local', 'Auth endpoint responds', false, `Error: ${error.message}`);
  }

  // Test 7: Database connection via migration endpoint
  try {
    const migrationResponse = await fetch(`${BASE_URL}/api/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth_token=mock_admin_token'
      }
    });
    logTest('local', 'Database connection works', migrationResponse.status !== 500, `Status: ${migrationResponse.status}`);
  } catch (error) {
    logTest('local', 'Database connection works', false, `Error: ${error.message}`);
  }
}

async function testProductionSystem() {
  console.log('\n🌐 TESTS PRODUCTION SYSTEM');
  console.log('==========================\n');

  // Test 1: Base production health
  await testEndpoint('production', PROD_URL, 'Production server responds');

  // Test 2: SmartLink that was reported as broken
  const smartlinkTest = await testEndpoint('production', `${PROD_URL}/s/tj3veg`, 'Broken SmartLink (tj3veg) loads');

  // Test 3: Static assets in production
  await testEndpoint('production', `${PROD_URL}/assets/images/platforms/picto_spotify.png`, 'Production Spotify icon loads');

  // Test 4: Another SmartLink for comparison
  await testEndpoint('production', `${PROD_URL}/s/test-icons-fix-mf9t71ar`, 'Test SmartLink loads in prod');

  // Test 5: API health (should get auth error, not server error)
  await testEndpoint('production', `${PROD_URL}/api/smartlinks`, 'Production API responds', 401);

  // Test 6: Check if the SmartLink actually has onclick handlers
  if (smartlinkTest.passed && smartlinkTest.response) {
    try {
      const htmlContent = await smartlinkTest.response.text();
      const hasOnclickHandlers = htmlContent.includes('onclick="openPlatform(');
      const hasOpenPlatformFunction = htmlContent.includes('window.openPlatform = function');

      logTest('production', 'SmartLink has onclick handlers', hasOnclickHandlers,
        hasOnclickHandlers ? 'Found onclick attributes' : 'NO onclick attributes found!');
      logTest('production', 'SmartLink has openPlatform function', hasOpenPlatformFunction,
        hasOpenPlatformFunction ? 'Function is defined' : 'Function is missing!');

      // Check for specific platform buttons
      const hasSpotifyButton = htmlContent.includes('onclick="openPlatform(\'spotify\'');
      logTest('production', 'Spotify button has onclick handler', hasSpotifyButton,
        hasSpotifyButton ? 'Spotify onclick found' : 'Spotify onclick MISSING!');

    } catch (error) {
      logTest('production', 'SmartLink HTML analysis', false, `Error parsing HTML: ${error.message}`);
    }
  }
}

async function testFileIntegrity() {
  console.log('\n📁 FILE INTEGRITY CHECKS');
  console.log('=========================\n');

  const fs = require('fs');
  const path = require('path');

  // Check critical files exist
  const criticalFiles = [
    'server.js',
    'src/api/smartlinks.js',
    'src/lib/smartlinks.js',
    'src/lib/db.js',
    'templates/smartlink-modern.html',
    'package.json'
  ];

  for (const file of criticalFiles) {
    const exists = fs.existsSync(path.join(__dirname, file));
    logTest('local', `File exists: ${file}`, exists, exists ? 'Found' : 'MISSING!');
  }

  // Check for problematic files that might cause issues
  const problematicFiles = [
    'test-delete-fix.js',
    'test-tracking-endpoint.js',
    'test-new-analytics.js'
  ];

  for (const file of problematicFiles) {
    const exists = fs.existsSync(path.join(__dirname, file));
    logTest('local', `Cleanup: ${file} removed`, !exists, exists ? 'Still exists - PROBLEM!' : 'Cleaned up');
  }
}

async function runFullDiagnostic() {
  console.log('Starting comprehensive system diagnostic...\n');

  // Run all test suites
  await testFileIntegrity();

  // Start local server for testing
  console.log('\n🚀 Starting local server for testing...');
  const { spawn } = require('child_process');
  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: '3003' },
    detached: false
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    await testLocalSystem();
    await testProductionSystem();
  } finally {
    // Clean up
    console.log('\n🧹 Cleaning up test server...');
    serverProcess.kill();
  }

  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('====================');
  console.log(`Local Tests:      ${testResults.local.passed} passed, ${testResults.local.failed} failed`);
  console.log(`Production Tests: ${testResults.production.passed} passed, ${testResults.production.failed} failed`);
  console.log(`Total:            ${testResults.local.passed + testResults.production.passed} passed, ${testResults.local.failed + testResults.production.failed} failed`);

  // Critical issues summary
  const criticalIssues = [
    ...testResults.local.tests.filter(t => !t.passed && t.name.includes('Database')),
    ...testResults.production.tests.filter(t => !t.passed && (t.name.includes('onclick') || t.name.includes('SmartLink')))
  ];

  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    criticalIssues.forEach(issue => {
      console.log(`   ❌ ${issue.name}: ${issue.details}`);
    });
  } else {
    console.log('\n✅ No critical issues detected');
  }

  console.log('\n🏁 Diagnostic completed.');
}

// Run the diagnostic
runFullDiagnostic().catch(console.error);
// Test endpoint simple pour valider le tracking
const express = require('express');
const { smartlinks } = require('./src/lib/smartlinks');

const app = express();
app.use(express.json());

// Test tracking sans authentification
app.get('/test-tracking', async (req, res) => {
  try {
    console.log('🧪 Test tracking endpoint called');

    // Simuler des données de click complètes
    const testClickData = {
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.get('User-Agent') || 'Test Agent',
      referrer: req.get('Referrer') || null,
      country: null,
      city: null,
      region: null,
      platform: 'test-platform',
      device_type: 'desktop',
      browser: 'chrome',
      os: 'macos',
      session_id: 'test-session-123'
    };

    console.log('🧪 Test click data:', testClickData);

    // Tester avec un ID de SmartLink qui pourrait exister (1, 2, 3)
    const testSmartlinkId = 1;

    await smartlinks.recordClick(testSmartlinkId, testClickData);

    console.log('✅ Test tracking successful!');

    res.json({
      success: true,
      message: 'Tracking test successful',
      smartlinkId: testSmartlinkId,
      clickData: testClickData
    });

  } catch (error) {
    console.error('❌ Test tracking error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
  }
});

// Test de creation de SmartLink pour avoir des données
app.get('/test-create-smartlink', async (req, res) => {
  try {
    console.log('🧪 Test create SmartLink');

    const testData = {
      title: 'Test Song for Tracking',
      artist: 'Test Artist',
      platforms: [
        { name: 'spotify', url: 'https://open.spotify.com/track/test' },
        { name: 'apple', url: 'https://music.apple.com/track/test' }
      ]
    };

    const result = await smartlinks.create(1, testData);

    console.log('✅ Test SmartLink creation result:', result);

    res.json({
      success: true,
      message: 'Test SmartLink created',
      result
    });

  } catch (error) {
    console.error('❌ Test create error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

app.listen(3005, () => {
  console.log('🧪 Test tracking server running on port 3005');
  console.log('Test tracking: http://localhost:3005/test-tracking');
  console.log('Test create: http://localhost:3005/test-create-smartlink');
});
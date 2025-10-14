// Test des routes SmartLink
const express = require('express');
const { smartlinks } = require('./src/lib/smartlinks');

const app = express();

// Route de test basique
app.get('/test', (req, res) => {
  console.log('✅ Test route hit!');
  res.json({ success: true, message: 'Test route works!' });
});

// Route SmartLink avec debug complet
app.get('/s/:slug', async (req, res) => {
  console.log('🔍 SmartLink route hit!', {
    slug: req.params.slug,
    method: req.method,
    path: req.path,
    headers: req.headers
  });

  try {
    const smartlink = await smartlinks.getBySlug(req.params.slug);
    console.log('📋 SmartLink data:', smartlink ? 'FOUND' : 'NOT FOUND');

    if (!smartlink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink not found'
      });
    }

    res.json({
      success: true,
      smartlink: {
        id: smartlink.id,
        title: smartlink.title,
        slug: smartlink.slug
      }
    });
  } catch (error) {
    console.error('❌ SmartLink route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(`🚀 Debug server running on port ${PORT}`);
  console.log(`Test routes:`);
  console.log(`  http://localhost:${PORT}/test`);
  console.log(`  http://localhost:${PORT}/s/vlcpmx`);
});
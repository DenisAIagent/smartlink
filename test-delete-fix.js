const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static('.'));

// Debug middleware pour les delete
app.use((req, res, next) => {
    if (req.method === 'DELETE') {
        console.log(`🗑️ DELETE ${req.path} - ID: ${req.params.id}`);
    }
    next();
});

// Configuration locale pour forcer l'usage du serveur local
app.get('/config.js', (req, res) => {
    const config = {
        API_BASE_URL: 'http://localhost:3004', // Force local server
        ADMIN_VERSION: '2.0.0',
        ENVIRONMENT: 'development',
        FEATURES: {
            AUDIO_UPLOAD: true,
            ANALYTICS: true,
            BULK_OPERATIONS: true,
            DEBUG_MODE: true,
            POSTGRESQL_BACKEND: false, // Disable DB for testing
            ODESLI_INTEGRATION: true
        }
    };

    console.log('📋 Generated test config:', config);
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        window.MDMC_CONFIG = ${JSON.stringify(config, null, 2)};
        console.log('📋 TEST Config loaded:', window.MDMC_CONFIG);
    `);
});

// Mock auth middleware - always return success for testing
const mockAuth = (req, res, next) => {
    req.user = {
        id: 1,
        email: 'admin@test.com',
        plan: 'pro',
        is_admin: true
    };
    next();
};

// Mock SmartLinks data for testing
const mockSmartLinks = [
    { id: 1, title: 'Test Song 1', artist: 'Artist 1', user_id: 1 },
    { id: 42, title: 'Test Song 42', artist: 'Artist 42', user_id: 1 },
    { id: 43, title: 'Test Song 43', artist: 'Artist 43', user_id: 1 }
];

// GET /api/smartlinks - Return mock data
app.get('/api/smartlinks', mockAuth, (req, res) => {
    console.log('📋 GET /api/smartlinks - returning mock data');
    res.json({
        success: true,
        isAdmin: true,
        smartlinks: mockSmartLinks,
        total: mockSmartLinks.length
    });
});

// DELETE /api/smartlinks/:id - Mock successful deletion
app.delete('/api/smartlinks/:id', mockAuth, (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`🗑️ DELETE /api/smartlinks/${id} - Mock deletion`);

    const index = mockSmartLinks.findIndex(sl => sl.id === id);
    if (index !== -1) {
        const deleted = mockSmartLinks.splice(index, 1)[0];
        console.log(`✅ Mock deleted SmartLink:`, deleted);
        res.json({
            success: true,
            message: `SmartLink ${id} supprimé avec succès (MOCK)`
        });
    } else {
        console.log(`❌ SmartLink ${id} not found in mock data`);
        res.status(404).json({
            success: false,
            error: 'SmartLink non trouvé'
        });
    }
});

// Other endpoints return success for testing
app.get('/api/smartlinks/:id', mockAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const smartlink = mockSmartLinks.find(sl => sl.id === id);
    if (smartlink) {
        res.json({ success: true, smartlink });
    } else {
        res.status(404).json({ success: false, error: 'SmartLink non trouvé' });
    }
});

// Serve pages
app.get('/pages/:page', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', req.params.page));
});

const PORT = 3004;
app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log(`📋 Test interface: http://localhost:${PORT}/pages/list-smartlinks.html`);
    console.log(`🗑️ Ready to test SmartLink deletion with mock data`);
});
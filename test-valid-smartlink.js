const fetch = require('node-fetch');

async function testValidSmartlink() {
    console.log('🧪 Test avec un SmartLink ID valide');
    console.log('===================================');

    const baseUrl = 'https://smartlink.mdmcmusicads.com';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkZW5pc0BtZG1jbXVzaWNhZHMuY29tIiwicGxhbiI6InBybyIsImlzX2FkbWluIjp0cnVlLCJpYXQiOjE3NjI0NDcwNTMsImV4cCI6MTc2MzA1MTg1M30.tV1PaEg3HGlZMGgl_EFccaSZ57rEhP8L304Vu7fXfak';

    // Test avec les IDs qui existent réellement
    const validIds = [50, 47];

    for (const id of validIds) {
        console.log(`\n📋 Test GET /api/smartlinks/${id}`);
        try {
            const response = await fetch(`${baseUrl}/api/smartlinks/${id}`, {
                method: 'GET',
                headers: {
                    'Cookie': `auth_token=${token}`,
                    'User-Agent': 'Mozilla/5.0 (Test Script)'
                }
            });

            console.log(`Status: ${response.status}`);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ SmartLink trouvé:', {
                    id: result.id,
                    title: result.title,
                    slug: result.slug,
                    artist: result.artist
                });
            } else {
                const error = await response.text();
                console.log('❌ Erreur:', error);
            }

        } catch (error) {
            console.error('❌ Erreur de requête:', error.message);
        }
    }
}

testValidSmartlink();
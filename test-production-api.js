const https = require('https');
const fetch = require('node-fetch');

async function testProductionAPI() {
    console.log('🧪 Test API de production pour diagnostiquer l\'authentification');
    console.log('===============================================================');

    const baseUrl = 'https://smartlink.mdmcmusicads.com';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkZW5pc0BtZG1jbXVzaWNhZHMuY29tIiwicGxhbiI6InBybyIsImlzX2FkbWluIjp0cnVlLCJpYXQiOjE3NjI0NDcwNTMsImV4cCI6MTc2MzA1MTg1M30.tV1PaEg3HGlZMGgl_EFccaSZ57rEhP8L304Vu7fXfak';

    // Test 1: Vérifier le profil avec le token
    console.log('\n1️⃣ Test GET /api/auth/profile');
    try {
        const response1 = await fetch(`${baseUrl}/api/auth/profile`, {
            method: 'GET',
            headers: {
                'Cookie': `auth_token=${token}`,
                'User-Agent': 'Mozilla/5.0 (Test Script)'
            }
        });

        console.log('Status:', response1.status);
        console.log('Headers:', Object.fromEntries(response1.headers));

        const result1 = await response1.text();
        console.log('Response:', result1.substring(0, 500));

    } catch (error) {
        console.error('Erreur:', error.message);
    }

    // Test 2: Vérifier la liste des smartlinks
    console.log('\n2️⃣ Test GET /api/smartlinks');
    try {
        const response2 = await fetch(`${baseUrl}/api/smartlinks`, {
            method: 'GET',
            headers: {
                'Cookie': `auth_token=${token}`,
                'User-Agent': 'Mozilla/5.0 (Test Script)'
            }
        });

        console.log('Status:', response2.status);
        console.log('Headers:', Object.fromEntries(response2.headers));

        const result2 = await response2.text();
        console.log('Response:', result2.substring(0, 500));

    } catch (error) {
        console.error('Erreur:', error.message);
    }

    // Test 3: Vérifier un smartlink spécifique
    console.log('\n3️⃣ Test GET /api/smartlinks/1');
    try {
        const response3 = await fetch(`${baseUrl}/api/smartlinks/1`, {
            method: 'GET',
            headers: {
                'Cookie': `auth_token=${token}`,
                'User-Agent': 'Mozilla/5.0 (Test Script)'
            }
        });

        console.log('Status:', response3.status);
        console.log('Headers:', Object.fromEntries(response3.headers));

        const result3 = await response3.text();
        console.log('Response:', result3.substring(0, 500));

    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

testProductionAPI();
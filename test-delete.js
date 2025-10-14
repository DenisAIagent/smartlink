const fetch = require('node-fetch');

const API_URL = 'http://localhost:3003/api';

async function testBulkDelete() {
  console.log('🧪 Test de suppression multiple de SmartLinks');

  // Login as admin
  console.log('\n1️⃣ Connexion en tant qu\'admin...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@mdmcmusicads.com',
      password: 'xvEh@AK@tC3H9@V'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('❌ Échec de la connexion:', loginData);
    return;
  }

  const token = loginData.token;
  console.log('✅ Connecté avec succès');

  // Create 3 test SmartLinks
  console.log('\n2️⃣ Création de 3 SmartLinks de test...');
  const testIds = [];

  for (let i = 1; i <= 3; i++) {
    const createRes = await fetch(`${API_URL}/smartlinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: `Test Delete ${i}`,
        artist: 'Test Artist',
        platforms: [
          { name: 'Spotify', url: 'https://spotify.com' },
          { name: 'Apple Music', url: 'https://music.apple.com' }
        ]
      })
    });

    const createData = await createRes.json();
    if (createData.success) {
      testIds.push(createData.smartlink.id);
      console.log(`✅ SmartLink ${i} créé avec ID: ${createData.smartlink.id}`);
    }
  }

  // Test deleting non-existent SmartLink
  console.log('\n3️⃣ Test de suppression d\'un SmartLink inexistant (ID: 99999)...');
  const deleteNonExistent = await fetch(`${API_URL}/smartlinks/99999`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  console.log(`   Status: ${deleteNonExistent.status}`);
  const nonExistentData = await deleteNonExistent.json();
  console.log(`   Response:`, nonExistentData);

  // Test multiple deletion
  console.log('\n4️⃣ Test de suppression multiple (inclut un ID inexistant)...');
  const idsToDelete = [...testIds, 99998]; // Include non-existent ID

  const deletePromises = idsToDelete.map(async (id) => {
    const res = await fetch(`${API_URL}/smartlinks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return {
      id,
      status: res.status,
      data: await res.json()
    };
  });

  const results = await Promise.allSettled(deletePromises);

  console.log('\n📊 Résultats de la suppression multiple:');
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { id, status, data } = result.value;
      console.log(`   ID ${id}: Status ${status} - ${data.success ? '✅ Succès' : '❌ Échec'} - ${data.message || data.error}`);
    } else {
      console.log(`   ID ${idsToDelete[index]}: ❌ Erreur réseau - ${result.reason}`);
    }
  });

  // Count successes and failures
  const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
  const failures = results.length - successes;

  console.log(`\n📈 Résumé: ${successes} suppressions réussies, ${failures} échecs`);

  // Try to delete the same IDs again
  console.log('\n5️⃣ Test de re-suppression des mêmes IDs...');
  const retryPromises = testIds.map(async (id) => {
    const res = await fetch(`${API_URL}/smartlinks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return {
      id,
      status: res.status,
      data: await res.json()
    };
  });

  const retryResults = await Promise.allSettled(retryPromises);

  console.log('\n📊 Résultats de la re-suppression:');
  retryResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { id, status, data } = result.value;
      console.log(`   ID ${id}: Status ${status} - ${data.success ? '✅' : '❌'} - ${data.error || data.message}`);
    }
  });

  console.log('\n✅ Test terminé!');
}

testBulkDelete().catch(console.error);
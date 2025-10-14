// Test direct de la fonction getBySlug
const { smartlinks } = require('./src/lib/smartlinks');

async function testSlugQuery() {
  console.log('🔍 Testing getBySlug function...');

  try {
    // Test avec un slug qui existe
    console.log('\n1. Testing with existing slug: vlcpmx');
    const result1 = await smartlinks.getBySlug('vlcpmx');
    console.log('Result:', result1 ? 'FOUND' : 'NOT FOUND');
    if (result1) {
      console.log('SmartLink data:', {
        id: result1.id,
        title: result1.title,
        slug: result1.slug,
        platforms_count: result1.platforms?.length || 0
      });
    }

    // Test avec un slug qui n'existe pas
    console.log('\n2. Testing with non-existing slug: tj3veg');
    const result2 = await smartlinks.getBySlug('tj3veg');
    console.log('Result:', result2 ? 'FOUND' : 'NOT FOUND');

    console.log('\n✅ Test completed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

testSlugQuery();
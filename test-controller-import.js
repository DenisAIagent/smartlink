// Test de l'import du controller SmartLinks
console.log('🔍 Testing smartlinks controller import...');

try {
  const smartlinksController = require('./src/api/smartlinks');
  console.log('✅ Controller imported successfully');
  console.log('📋 Available methods:', Object.keys(smartlinksController));

  if (smartlinksController.getPublicSmartLink) {
    console.log('✅ getPublicSmartLink method exists');
    console.log('🔍 Function type:', typeof smartlinksController.getPublicSmartLink);
  } else {
    console.log('❌ getPublicSmartLink method NOT found!');
  }

} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n🔍 Testing direct function call...');
try {
  const { getPublicSmartLink } = require('./src/api/smartlinks');
  console.log('✅ Direct import worked:', typeof getPublicSmartLink);
} catch (error) {
  console.error('❌ Direct import failed:', error.message);
}
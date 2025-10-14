#!/usr/bin/env node

require('dotenv').config();
const { odesli } = require('../src/lib/odesli');

async function testOdesli() {
  console.log('🧪 Testing MDMC Odesli Integration');
  console.log('===================================\n');
  
  const testUrls = [
    {
      name: 'Spotify Track',
      url: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'
    },
    {
      name: 'Apple Music Track',
      url: 'https://music.apple.com/fr/album/flowers/1663973555?i=1663973562'
    },
    {
      name: 'YouTube Video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      name: 'Deezer Track',
      url: 'https://www.deezer.com/track/916424'
    }
  ];
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const test of testUrls) {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`📍 URL: ${test.url}\n`);
    
    try {
      const startTime = Date.now();
      
      // Test URL validation
      odesli.validateUrl(test.url);
      console.log('✅ URL validation passed');
      
      // Fetch data
      const data = await odesli.fetchLinks(test.url);
      const parsed = odesli.parseData(data);
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Data fetched successfully (${duration}ms)`);
      console.log(`📀 Title: ${parsed.title || 'N/A'}`);
      console.log(`🎤 Artist: ${parsed.artist || 'N/A'}`);
      console.log(`🖼️  Cover: ${parsed.coverUrl ? 'Available' : 'N/A'}`);
      console.log(`🔗 Platforms: ${parsed.platforms.length} (${parsed.platforms.map(p => p.name).join(', ')})`);
      
      if (parsed.platforms.length === 0) {
        console.warn('⚠️  Warning: No platforms found');
      }
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      failureCount++;
    }
    
    console.log('─'.repeat(50));
  }
  
  // Test cache stats
  console.log('\n📊 Testing Cache Statistics...');
  try {
    const stats = await odesli.getCacheStats();
    console.log('✅ Cache stats retrieved:');
    console.log(`   📦 Total entries: ${stats.totalEntries}`);
    console.log(`   ✅ Valid entries: ${stats.validEntries}`);
    console.log(`   ⏰ Expired entries: ${stats.expiredEntries}`);
    console.log(`   👆 Total hits: ${stats.totalHits}`);
    console.log(`   📈 Avg platforms: ${stats.avgPlatforms}`);
    console.log(`   🕐 Last cached: ${stats.lastCached || 'Never'}`);
  } catch (error) {
    console.error(`❌ Cache stats failed: ${error.message}`);
    failureCount++;
  }
  
  // Test popular songs
  console.log('\n🎵 Testing Popular Songs...');
  try {
    const popular = await odesli.getPopularSongs(3);
    console.log('✅ Popular songs retrieved:');
    popular.forEach((song, index) => {
      console.log(`   ${index + 1}. ${song.title} - ${song.artist} (${song.hit_count} hits)`);
    });
  } catch (error) {
    console.error(`❌ Popular songs failed: ${error.message}`);
  }
  
  // Summary
  console.log('\n📋 Test Summary');
  console.log('===============');
  console.log(`✅ Successful tests: ${successCount}`);
  console.log(`❌ Failed tests: ${failureCount}`);
  console.log(`📈 Success rate: ${Math.round((successCount / (successCount + failureCount)) * 100)}%`);
  
  if (failureCount === 0) {
    console.log('\n🎉 All tests passed! Odesli integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above and your configuration.');
    console.log('\nCommon issues:');
    console.log('- Rate limiting from Odesli API');
    console.log('- Network connectivity issues');
    console.log('- Invalid or expired URLs');
    console.log('- Database connection problems');
  }
  
  console.log('\n💡 Tips:');
  console.log('- The cache will improve performance on subsequent requests');
  console.log('- Rate limits are automatically handled with fallback to cache');
  console.log('- Clean expired cache with: npm run cache:clean');
  
  process.exit(failureCount > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
  process.exit(1);
});

testOdesli();
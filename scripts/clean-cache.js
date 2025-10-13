#!/usr/bin/env node

require('dotenv').config();
const { odesli } = require('../src/lib/odesli');

async function cleanCache() {
  console.log('🧹 MDMC Odesli Cache Cleanup');
  console.log('=============================\n');
  
  try {
    // Get stats before cleanup
    console.log('📊 Cache statistics before cleanup:');
    const statsBefore = await odesli.getCacheStats();
    console.log(`   📦 Total entries: ${statsBefore.totalEntries}`);
    console.log(`   ✅ Valid entries: ${statsBefore.validEntries}`);
    console.log(`   ⏰ Expired entries: ${statsBefore.expiredEntries}`);
    console.log(`   👆 Total hits: ${statsBefore.totalHits}\n`);
    
    if (statsBefore.expiredEntries === 0) {
      console.log('✨ No expired entries to clean. Cache is healthy!');
      return;
    }
    
    // Clean expired cache
    console.log('🗑️  Cleaning expired cache entries...');
    const deletedCount = await odesli.cleanupCache();
    
    console.log(`✅ Cleaned ${deletedCount} expired entries`);
    
    // Get stats after cleanup
    console.log('\n📊 Cache statistics after cleanup:');
    const statsAfter = await odesli.getCacheStats();
    console.log(`   📦 Total entries: ${statsAfter.totalEntries}`);
    console.log(`   ✅ Valid entries: ${statsAfter.validEntries}`);
    console.log(`   ⏰ Expired entries: ${statsAfter.expiredEntries}`);
    console.log(`   👆 Total hits: ${statsAfter.totalHits}`);
    
    // Calculate savings
    const spaceFreed = statsBefore.totalEntries - statsAfter.totalEntries;
    const percentCleaned = Math.round((spaceFreed / statsBefore.totalEntries) * 100);
    
    console.log(`\n💾 Space freed: ${spaceFreed} entries (${percentCleaned}%)`);
    
    if (statsAfter.totalEntries > 0) {
      console.log('\n🎵 Top cached songs:');
      const popular = await odesli.getPopularSongs(5);
      popular.forEach((song, index) => {
        console.log(`   ${index + 1}. ${song.title} - ${song.artist} (${song.hit_count} hits, ${song.platforms_count} platforms)`);
      });
    }
    
    console.log('\n✨ Cache cleanup completed successfully!');
    console.log('\n💡 Tip: You can set up a cron job to run this automatically:');
    console.log('   0 2 * * * cd /path/to/mdmc-admin && npm run cache:clean');
    
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
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

cleanCache();
const bcrypt = require('bcrypt');
const { query, queryOne } = require('../src/lib/db');

async function setupDemoData() {
  try {
    console.log('🚀 Setting up demo data...');

    // 1. Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Check if admin user exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      ['admin@mdmcmusicads.com']
    );

    let userId;
    if (!existingUser) {
      const user = await queryOne(
        `INSERT INTO users (email, password_hash, display_name, plan, is_admin, smartlinks_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id`,
        ['admin@mdmcmusicads.com', hashedPassword, 'Admin MDMC', 'pro', true, 0]
      );
      userId = user.id;
      console.log('✅ Admin user created:', userId);
    } else {
      userId = existingUser.id;
      console.log('✅ Admin user already exists:', userId);
    }

    // 2. Create sample SmartLinks
    const sampleSmartLinks = [
      {
        title: 'Test Track 1',
        artist: 'Artist Demo',
        description: 'Premier titre de test pour les analytics',
        cover_url: 'https://i.scdn.co/image/ab67616d0000b273f7b7e0f0f0f0f0f0f0f0f0f0',
        platforms: [
          { name: 'Spotify', url: 'https://open.spotify.com/track/test1' },
          { name: 'Apple Music', url: 'https://music.apple.com/track/test1' },
          { name: 'YouTube', url: 'https://youtube.com/watch?v=test1' }
        ]
      },
      {
        title: 'Another Song',
        artist: 'Demo Artist 2',
        description: 'Deuxième titre pour tester le dashboard',
        cover_url: 'https://i.scdn.co/image/ab67616d0000b273a1a1a1a1a1a1a1a1a1a1a1a1',
        platforms: [
          { name: 'Spotify', url: 'https://open.spotify.com/track/test2' },
          { name: 'Deezer', url: 'https://deezer.com/track/test2' },
          { name: 'SoundCloud', url: 'https://soundcloud.com/track/test2' }
        ]
      }
    ];

    for (const sl of sampleSmartLinks) {
      // Generate unique slug
      const slug = Math.random().toString(36).substring(2, 8);

      // Check if already exists
      const existing = await queryOne(
        'SELECT id FROM smartlinks WHERE title = $1 AND artist = $2 AND user_id = $3',
        [sl.title, sl.artist, userId]
      );

      if (!existing) {
        const smartlink = await queryOne(
          `INSERT INTO smartlinks (
            user_id, slug, title, artist, description, cover_url,
            platforms, template, customization, tracking_pixels,
            is_active, click_count, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          RETURNING id, slug`,
          [
            userId,
            slug,
            sl.title,
            sl.artist,
            sl.description,
            sl.cover_url,
            JSON.stringify(sl.platforms),
            'default',
            JSON.stringify({
              primaryColor: '#1976d2',
              backgroundColor: '#ffffff',
              textColor: '#333333'
            }),
            JSON.stringify({
              google_analytics: null,
              google_tag_manager: null,
              meta_pixel: null,
              tiktok_pixel: null,
              custom_scripts: []
            }),
            true,
            Math.floor(Math.random() * 100) // Random click count for demo
          ]
        );

        console.log(`✅ SmartLink created: ${sl.title} (${smartlink.slug})`);

        // 3. Create some demo analytics data (simplified)
        const platforms = sl.platforms.map(p => p.name.toLowerCase());

        for (let i = 0; i < 5; i++) {
          const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];

          await query(
            `INSERT INTO analytics (
              smartlink_id, ip_address, user_agent, country, platform, clicked_at
            ) VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${i} days')`,
            [
              smartlink.id,
              `192.168.1.${Math.floor(Math.random() * 255)}`,
              'Mozilla/5.0 (Demo User Agent)',
              'FR',
              randomPlatform
            ]
          );
        }
      } else {
        console.log(`✅ SmartLink already exists: ${sl.title}`);
      }
    }

    // Update user smartlinks count
    await query(
      'UPDATE users SET smartlinks_count = (SELECT COUNT(*) FROM smartlinks WHERE user_id = $1) WHERE id = $1',
      [userId]
    );

    console.log('🎉 Demo data setup complete!');
    console.log('🔑 Login: admin@mdmcmusicads.com / admin123');

  } catch (error) {
    console.error('❌ Error setting up demo data:', error);
  } finally {
    process.exit(0);
  }
}

setupDemoData();
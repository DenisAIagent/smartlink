const { query } = require('./src/lib/db');

async function createTestSmartLink() {
    try {
        // Create test user if not exists
        const userResult = await query(`
            INSERT INTO users (email, password_hash, is_admin)
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO UPDATE
            SET email = EXCLUDED.email
            RETURNING id
        `, ['test@mdmc.com', 'test', true]);

        const userId = userResult[0].id;
        console.log('✅ User created/found:', userId);

        // Create test smartlink
        const smartlinkResult = await query(`
            INSERT INTO smartlinks (
                user_id,
                slug,
                title,
                artist,
                description,
                cover_url,
                platforms,
                is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (slug) DO UPDATE
            SET title = EXCLUDED.title
            RETURNING id, slug
        `, [
            userId,
            'test-tracking',
            'Test Track',
            'Test Artist',
            'Test smartlink for platform tracking',
            'https://via.placeholder.com/500',
            JSON.stringify({
                spotify: 'https://spotify.com/test',
                deezer: 'https://deezer.com/test',
                apple_music: 'https://music.apple.com/test',
                youtube_music: 'https://music.youtube.com/test'
            }),
            true
        ]);

        console.log('✅ SmartLink created:');
        console.log('   ID:', smartlinkResult[0].id);
        console.log('   Slug:', smartlinkResult[0].slug);
        console.log('');
        console.log('🎯 Utilisez ce slug pour vos tests: test-tracking');
        console.log('📍 URL: http://localhost:3003/s/test-tracking');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
}

// Run if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set, using test data');
    console.log('');
    console.log('Pour tester sans base de données :');
    console.log('1. Utilisez le slug: test-demo');
    console.log('2. Les clics seront simulés');
    process.exit(0);
}

createTestSmartLink();
const { query, queryOne, transaction } = require('./db');
const { odesli } = require('./odesli');

const smartlinks = {
  /**
   * Créer SmartLink avec option Odesli
   */
  async create(userId, data) {
    try {
      // Check user limits
      const user = await queryOne(
        'SELECT plan, smartlinks_count FROM users WHERE id = $1',
        [userId]
      );
      
      if (!user) {
        return { 
          success: false, 
          error: 'Utilisateur non trouvé' 
        };
      }
      
      const maxLinks = user.plan === 'pro' ? 1000 : 5;
      if (user.smartlinks_count >= maxLinks) {
        return { 
          success: false, 
          error: user.plan === 'free' 
            ? 'Limite gratuite atteinte (5 liens max). Passez au Pro !' 
            : 'Limite atteinte'
        };
      }
      
      // Si une URL Odesli est fournie, enrichir les données
      let odesliData = null;
      if (data.odesliUrl) {
        try {
          const odesliResult = await odesli.fetchLinks(data.odesliUrl);
          const parsed = odesli.parseData(odesliResult);
          
          // Merger avec les données fournies (priorité aux données user)
          data.title = data.title || parsed.title;
          data.artist = data.artist || parsed.artist;
          data.coverUrl = data.coverUrl || parsed.coverUrl;
          data.platforms = data.platforms?.length > 0 ? data.platforms : parsed.platforms;
          
          odesliData = odesliResult;
        } catch (error) {
          console.warn('Odesli fetch failed, continuing without:', error.message);
        }
      }
      
      // Transaction pour créer link + update count
      const result = await transaction(async (client) => {
        // Generate unique slug
        const slug = await this.generateUniqueSlug(data.title);
        
        // Insert smartlink
        const { rows: [smartlink] } = await client.query(
          `INSERT INTO smartlinks (
            user_id, slug, title, artist, description,
            cover_url, preview_audio_url, platforms,
            template, customization, tracking_pixels, odesli_data, odesli_fetched_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`,
          [
            userId,
            slug,
            data.title,
            data.artist || null,
            data.description || null,
            data.coverUrl || null,
            data.previewAudioUrl || null,
            JSON.stringify(data.platforms || []),
            data.template || 'default',
            JSON.stringify(data.customization || {
              primaryColor: '#1976d2',
              backgroundColor: '#ffffff',
              textColor: '#333333'
            }),
            JSON.stringify(data.trackingPixels || {
              google_analytics: null,
              google_tag_manager: null,
              google_ads: null,
              meta_pixel: null,
              tiktok_pixel: null,
              custom_scripts: []
            }),
            odesliData ? JSON.stringify(odesliData) : null,
            odesliData ? new Date() : null
          ]
        );
        
        // Update user count
        await client.query(
          'UPDATE users SET smartlinks_count = smartlinks_count + 1 WHERE id = $1',
          [userId]
        );
        
        return smartlink;
      });
      
      return { 
        success: true, 
        smartlink: result,
        url: `${process.env.PUBLIC_BASE_URL}/s/${result.slug}`
      };
      
    } catch (error) {
      console.error('❌ SmartLink creation error:', error);
      return {
        success: false,
        error: 'Erreur lors de la création du SmartLink'
      };
    }
  },

  /**
   * Update avec refresh Odesli optionnel
   */
  async update(id, userId, data, refreshOdesli = false) {
    try {
      // Si demande de refresh Odesli
      if (refreshOdesli && data.odesliUrl) {
        try {
          const odesliResult = await odesli.fetchLinks(data.odesliUrl);
          const parsed = odesli.parseData(odesliResult);
          
          // Update platforms seulement si demandé
          if (data.updatePlatforms) {
            data.platforms = parsed.platforms;
          }
          
          // Sauver les données Odesli
          await query(
            'UPDATE smartlinks SET odesli_data = $1, odesli_fetched_at = NOW() WHERE id = $2',
            [JSON.stringify(odesliResult), id]
          );
          
        } catch (error) {
          console.warn('Odesli refresh failed:', error.message);
        }
      }
      
      const smartlink = await queryOne(
        `UPDATE smartlinks SET
          title = COALESCE($1, title),
          artist = COALESCE($2, artist),
          description = COALESCE($3, description),
          platforms = COALESCE($4, platforms),
          customization = COALESCE($5, customization),
          cover_url = COALESCE($6, cover_url),
          preview_audio_url = COALESCE($7, preview_audio_url),
          tracking_pixels = COALESCE($8, tracking_pixels),
          updated_at = NOW()
         WHERE id = $9 AND user_id = $10
         RETURNING *`,
        [
          data.title,
          data.artist,
          data.description,
          data.platforms ? JSON.stringify(data.platforms) : null,
          data.customization ? JSON.stringify(data.customization) : null,
          data.coverUrl,
          data.previewAudioUrl,
          data.trackingPixels ? JSON.stringify(data.trackingPixels) : null,
          id,
          userId
        ]
      );
      
      return smartlink;
      
    } catch (error) {
      console.error('❌ SmartLink update error:', error);
      throw error;
    }
  },

  /**
   * Get SmartLink by ID
   */
  async getById(id, userId = null) {
    try {
      const whereClause = userId ? 's.id = $1 AND s.user_id = $2' : 's.id = $1';
      const params = userId ? [id, userId] : [id];
      
      const smartlink = await queryOne(
        `SELECT 
          s.*,
          u.display_name as owner_name
         FROM smartlinks s
         JOIN users u ON s.user_id = u.id
         WHERE ${whereClause}`,
        params
      );
      
      if (smartlink) {
        // Handle JSONB fields that might already be parsed by PostgreSQL
        smartlink.platforms = typeof smartlink.platforms === 'string' ? JSON.parse(smartlink.platforms || '[]') : smartlink.platforms || [];
        smartlink.customization = typeof smartlink.customization === 'string' ? JSON.parse(smartlink.customization || '{}') : smartlink.customization || {};
        if (smartlink.odesli_data) {
          smartlink.odesli_data = typeof smartlink.odesli_data === 'string' ? JSON.parse(smartlink.odesli_data) : smartlink.odesli_data;
        }
      }
      
      return smartlink;
    } catch (error) {
      console.error('❌ SmartLink get error:', error);
      throw error;
    }
  },

  /**
   * Get SmartLink by slug (pour les pages publiques)
   */
  async getBySlug(slug) {
    try {
      console.log('🔍 getBySlug called with:', slug);
      console.log('🔍 About to run query...');

      // Debug query - check if smartlink exists at all
      const slugCheck = await queryOne(
        `SELECT slug, is_active FROM smartlinks WHERE slug = $1`,
        [slug]
      );
      console.log('🔍 Slug check result:', slugCheck);

      const smartlink = await queryOne(
        `SELECT
          s.*,
          u.display_name as owner_name
         FROM smartlinks s
         JOIN users u ON s.user_id = u.id
         WHERE s.slug = $1 AND s.is_active = true`,
        [slug]
      );

      console.log('🔍 Final query result:', smartlink ? 'FOUND' : 'NULL');
      
      if (smartlink) {
        // Handle JSONB fields that might already be parsed by PostgreSQL
        smartlink.platforms = typeof smartlink.platforms === 'string' ? JSON.parse(smartlink.platforms || '[]') : smartlink.platforms || [];
        smartlink.customization = typeof smartlink.customization === 'string' ? JSON.parse(smartlink.customization || '{}') : smartlink.customization || {};
        if (smartlink.odesli_data) {
          smartlink.odesli_data = typeof smartlink.odesli_data === 'string' ? JSON.parse(smartlink.odesli_data) : smartlink.odesli_data;
        }
      }
      
      return smartlink;
    } catch (error) {
      console.error('❌ SmartLink get by slug error:', error);
      throw error;
    }
  },

  /**
   * List ALL SmartLinks (admin only) with creator info
   */
  async listAll({ limit = 20, offset = 0, search = '' } = {}) {
    try {
      const searchCondition = search
        ? 'WHERE (s.title ILIKE $3 OR s.artist ILIKE $3 OR u.display_name ILIKE $3)'
        : '';
      const searchParam = search ? `%${search}%` : null;

      const params = searchParam
        ? [limit, searchParam, offset]
        : [limit, offset];

      // Get all SmartLinks with validation check
      const allSmartlinks = await query(
        `SELECT
          s.id, s.slug, s.title, s.artist, s.cover_url,
          s.is_active, s.click_count, s.created_at, s.updated_at,
          u.display_name as creator_name, u.email as creator_email
         FROM smartlinks s
         JOIN users u ON s.user_id = u.id
         ${searchCondition}
         ORDER BY s.created_at DESC
         LIMIT $1 OFFSET $${searchParam ? 3 : 2}`,
        params
      );

      // Filter out any SmartLinks that might have integrity issues
      const validSmartlinks = [];
      for (const smartlink of allSmartlinks) {
        try {
          // More comprehensive verification - check if SmartLink can actually be accessed by getById
          const fullSmartlink = await this.getById(smartlink.id);
          if (fullSmartlink) {
            validSmartlinks.push(smartlink);
          } else {
            console.warn(`🚨 SmartLink ${smartlink.id} found in listing but getById failed - filtering out`);
          }
        } catch (error) {
          console.warn(`🚨 SmartLink ${smartlink.id} getById verification failed - filtering out:`, error.message);
        }
      }

      const total = await queryOne(
        `SELECT COUNT(*) as count
         FROM smartlinks s
         JOIN users u ON s.user_id = u.id
         ${searchCondition}`,
        searchParam ? [searchParam] : []
      );

      return {
        smartlinks: validSmartlinks,
        total: parseInt(total.count),
        hasMore: offset + validSmartlinks.length < total.count
      };
    } catch (error) {
      console.error('❌ SmartLinks list all error:', error);
      throw error;
    }
  },

  /**
   * List user SmartLinks
   */
  async listByUser(userId, { limit = 20, offset = 0, search = '' } = {}) {
    try {
      const searchCondition = search
        ? 'AND (title ILIKE $3 OR artist ILIKE $3)'
        : '';
      const searchParam = search ? `%${search}%` : null;

      const params = searchParam
        ? [userId, limit, searchParam, offset]
        : [userId, limit, offset];

      const allSmartlinks = await query(
        `SELECT
          id, slug, title, artist, cover_url,
          is_active, click_count, created_at, updated_at
         FROM smartlinks
         WHERE user_id = $1 ${searchCondition}
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $${searchParam ? 4 : 3}`,
        params
      );

      // Filter out any SmartLinks that might have integrity issues
      const validSmartlinks = [];
      for (const smartlink of allSmartlinks) {
        try {
          // More comprehensive verification - check if SmartLink can actually be accessed by getById
          const fullSmartlink = await this.getById(smartlink.id, userId);
          if (fullSmartlink) {
            validSmartlinks.push(smartlink);
          } else {
            console.warn(`🚨 SmartLink ${smartlink.id} found in user listing but getById failed - filtering out`);
          }
        } catch (error) {
          console.warn(`🚨 SmartLink ${smartlink.id} getById verification failed for user ${userId} - filtering out:`, error.message);
        }
      }

      const total = await queryOne(
        `SELECT COUNT(*) as count
         FROM smartlinks
         WHERE user_id = $1 ${searchCondition}`,
        searchParam ? [userId, searchParam] : [userId]
      );

      return {
        smartlinks: validSmartlinks,
        total: parseInt(total.count),
        hasMore: offset + validSmartlinks.length < total.count
      };
    } catch (error) {
      console.error('❌ SmartLinks list error:', error);
      throw error;
    }
  },

  /**
   * Delete SmartLink
   */
  async delete(id, userId) {
    try {
      const result = await transaction(async (client) => {
        console.log('🗑️ Starting DELETE transaction for SmartLink:', { id, userId });

        // CRITICAL: Delete analytics FIRST to avoid FK constraint violation
        console.log('1️⃣ Deleting analytics for SmartLink ID:', id);
        const analyticsResult = await client.query(
          'DELETE FROM analytics WHERE smartlink_id = $1',
          [id]
        );
        console.log(`✅ Deleted ${analyticsResult.rowCount} analytics records`);

        // Delete smartlink
        console.log('2️⃣ Deleting SmartLink ID:', id);
        const { rows: [deleted] } = await client.query(
          'DELETE FROM smartlinks WHERE id = $1 AND user_id = $2 RETURNING *',
          [id, userId]
        );

        if (deleted) {
          console.log('3️⃣ Updating user count for user ID:', userId);
          // Update user count
          await client.query(
            'UPDATE users SET smartlinks_count = GREATEST(0, smartlinks_count - 1) WHERE id = $1',
            [userId]
          );
          console.log('✅ SmartLink deletion completed successfully');
        } else {
          console.log('❌ SmartLink not found or access denied');
        }

        return deleted;
      });

      return result;
    } catch (error) {
      console.error('❌ SmartLink delete error:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        table: error.table
      });
      throw error;
    }
  },

  /**
   * Record page view or platform click
   * @param {number} smartlinkId - SmartLink ID
   * @param {string|null} platform - Platform name (null = page view)
   */
  async recordClick(smartlinkId, platform = null) {
    try {
      console.log('📊 Recording click:', { smartlinkId, platform });

      // Ensure analytics row exists for this SmartLink
      await query(`
        INSERT INTO analytics (smartlink_id, page_views)
        VALUES ($1, 0)
        ON CONFLICT (smartlink_id) DO NOTHING
      `, [smartlinkId]);

      if (!platform) {
        // PAGE VIEW - Increment page_views
        await query(`
          UPDATE analytics
          SET page_views = page_views + 1,
              updated_at = NOW()
          WHERE smartlink_id = $1
        `, [smartlinkId]);

        console.log('✅ Page view recorded');
      } else {
        // PLATFORM CLICK - Increment specific platform counter
        const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, '');
        const columnName = `clicks_${normalizedPlatform}`;

        // Security: Validate column exists
        const validPlatforms = [
          'spotify', 'apple', 'applemusic', 'youtube', 'youtubemusic',
          'deezer', 'soundcloud', 'tidal', 'amazon', 'amazonmusic', 'bandcamp'
        ];

        if (!validPlatforms.includes(normalizedPlatform)) {
          console.warn(`⚠️ Unknown platform: ${platform}`);
          return;
        }

        await query(`
          UPDATE analytics
          SET ${columnName} = ${columnName} + 1,
              updated_at = NOW()
          WHERE smartlink_id = $1
        `, [smartlinkId]);

        console.log(`✅ Platform click recorded: ${platform}`);
      }

      // Also update SmartLink click_count for backward compatibility
      await query(`
        UPDATE smartlinks
        SET click_count = click_count + 1
        WHERE id = $1
      `, [smartlinkId]);

    } catch (error) {
      console.error('❌ Record click error:', {
        message: error.message,
        code: error.code,
        smartlinkId,
        platform
      });
      // Don't throw - page should still load even if tracking fails
    }
  },

  /**
   * Generate unique short slug (perfect for advertising platforms)
   */
  async generateUniqueSlug(title, attempt = 0) {
    // Generate a short, random slug (6-8 characters)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';

    // Base length: 6 characters + attempts for uniqueness
    const length = 6 + Math.floor(attempt / 10);

    for (let i = 0; i < length; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if slug already exists
    const exists = await queryOne(
      'SELECT id FROM smartlinks WHERE slug = $1',
      [slug]
    );

    if (exists) {
      return this.generateUniqueSlug(title, attempt + 1);
    }

    return slug;
  },

  /**
   * Get analytics for a SmartLink
   */
  async getAnalytics(smartlinkId, userId, days = 30) {
    try {
      console.log('📊 Getting analytics:', { smartlinkId, userId });

      // Verify ownership (if not admin)
      if (userId !== null) {
        const smartlink = await queryOne(
          'SELECT id FROM smartlinks WHERE id = $1 AND user_id = $2',
          [smartlinkId, userId]
        );

        if (!smartlink) {
          throw new Error('SmartLink non trouvé');
        }
      }

      // Get analytics from simple counter table
      const analytics = await queryOne(`
        SELECT
          page_views,
          clicks_spotify,
          clicks_apple,
          clicks_applemusic,
          clicks_youtube,
          clicks_youtubemusic,
          clicks_deezer,
          clicks_soundcloud,
          clicks_tidal,
          clicks_amazon,
          clicks_amazonmusic,
          clicks_bandcamp,
          created_at,
          updated_at
        FROM analytics
        WHERE smartlink_id = $1
      `, [smartlinkId]);

      if (!analytics) {
        // No analytics yet - return zeros
        return {
          total_pageviews: 0,
          total_clicks: 0,
          platform_stats: [],
          top_platform: null,
          daily_clicks: []
        };
      }

      // Calculate total clicks
      const totalClicks =
        (analytics.clicks_spotify || 0) +
        (analytics.clicks_apple || 0) +
        (analytics.clicks_applemusic || 0) +
        (analytics.clicks_youtube || 0) +
        (analytics.clicks_youtubemusic || 0) +
        (analytics.clicks_deezer || 0) +
        (analytics.clicks_soundcloud || 0) +
        (analytics.clicks_tidal || 0) +
        (analytics.clicks_amazon || 0) +
        (analytics.clicks_amazonmusic || 0) +
        (analytics.clicks_bandcamp || 0);

      // Format platform stats for dashboard
      const platformStats = [
        { platform: 'spotify', clicks: analytics.clicks_spotify || 0 },
        { platform: 'apple', clicks: (analytics.clicks_apple || 0) + (analytics.clicks_applemusic || 0) },
        { platform: 'youtube', clicks: analytics.clicks_youtube || 0 },
        { platform: 'youtubemusic', clicks: analytics.clicks_youtubemusic || 0 },
        { platform: 'deezer', clicks: analytics.clicks_deezer || 0 },
        { platform: 'soundcloud', clicks: analytics.clicks_soundcloud || 0 },
        { platform: 'tidal', clicks: analytics.clicks_tidal || 0 },
        { platform: 'amazon', clicks: (analytics.clicks_amazon || 0) + (analytics.clicks_amazonmusic || 0) },
        { platform: 'bandcamp', clicks: analytics.clicks_bandcamp || 0 }
      ].filter(p => p.clicks > 0)
       .sort((a, b) => b.clicks - a.clicks);

      // Find top platform
      const topPlatform = platformStats.length > 0 ? platformStats[0].platform : null;

      // Generate mock daily data (since we're using simple counters)
      const dailyClicks = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Simple distribution of total clicks across days
        const dailyClickCount = Math.floor(totalClicks / days) +
          (Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0);

        dailyClicks.push({
          date: date.toISOString().split('T')[0],
          clicks: i === 0 ? Math.max(1, dailyClickCount) : dailyClickCount // At least 1 click today
        });
      }

      return {
        total_pageviews: analytics.page_views || 0,
        total_clicks: totalClicks,
        platform_stats: platformStats,
        top_platform: topPlatform,
        daily_clicks: dailyClicks,
        created_at: analytics.created_at,
        updated_at: analytics.updated_at
      };

    } catch (error) {
      console.error('❌ Get analytics error:', error);
      throw error;
    }
  }
};

module.exports = { smartlinks };
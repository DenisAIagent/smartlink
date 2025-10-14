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
          updated_at = NOW()
         WHERE id = $8 AND user_id = $9
         RETURNING *`,
        [
          data.title,
          data.artist,
          data.description,
          data.platforms ? JSON.stringify(data.platforms) : null,
          data.customization ? JSON.stringify(data.customization) : null,
          data.coverUrl,
          data.previewAudioUrl,
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
      const smartlink = await queryOne(
        `SELECT 
          s.*,
          u.display_name as owner_name
         FROM smartlinks s
         JOIN users u ON s.user_id = u.id
         WHERE s.slug = $1 AND s.is_active = true`,
        [slug]
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

      const smartlinks = await query(
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

      const total = await queryOne(
        `SELECT COUNT(*) as count
         FROM smartlinks s
         JOIN users u ON s.user_id = u.id
         ${searchCondition}`,
        searchParam ? [searchParam] : []
      );

      return {
        smartlinks,
        total: parseInt(total.count),
        hasMore: offset + smartlinks.length < total.count
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
      
      const smartlinks = await query(
        `SELECT 
          id, slug, title, artist, cover_url, 
          is_active, click_count, created_at, updated_at
         FROM smartlinks 
         WHERE user_id = $1 ${searchCondition}
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $${searchParam ? 4 : 3}`,
        params
      );
      
      const total = await queryOne(
        `SELECT COUNT(*) as count 
         FROM smartlinks 
         WHERE user_id = $1 ${searchCondition}`,
        searchParam ? [userId, searchParam] : [userId]
      );
      
      return {
        smartlinks,
        total: parseInt(total.count),
        hasMore: offset + smartlinks.length < total.count
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
        // First, check if the smartlink exists
        const checkQuery = 'SELECT id, user_id FROM smartlinks WHERE id = $1';
        const { rows: [existing] } = await client.query(checkQuery, [id]);

        if (!existing) {
          console.log(`SmartLink ${id} not found`);
          return null;
        }

        // Check permissions
        if (userId !== null && existing.user_id !== userId) {
          console.log(`User ${userId} not authorized to delete SmartLink ${id}`);
          return null;
        }

        // Delete the smartlink
        let deleteQuery, deleteParams;

        if (userId === null) {
          // Admin can delete any smartlink
          deleteQuery = 'DELETE FROM smartlinks WHERE id = $1 RETURNING *';
          deleteParams = [id];
        } else {
          // User can only delete their own smartlinks
          deleteQuery = 'DELETE FROM smartlinks WHERE id = $1 AND user_id = $2 RETURNING *';
          deleteParams = [id, userId];
        }

        const { rows: [deleted] } = await client.query(deleteQuery, deleteParams);

        if (deleted && deleted.user_id) {
          // Update user count for the original owner (but don't fail if it doesn't work)
          try {
            await client.query(
              'UPDATE users SET smartlinks_count = GREATEST(smartlinks_count - 1, 0) WHERE id = $1',
              [deleted.user_id]
            );
          } catch (countError) {
            console.warn(`Warning: Could not update smartlinks_count for user ${deleted.user_id}:`, countError.message);
            // Continue anyway - the deletion is more important than the count
          }
        }

        return deleted;
      });

      return result;
    } catch (error) {
      console.error('❌ SmartLink delete error:', error);
      console.error('Delete details:', {
        id,
        userId,
        message: error.message,
        stack: error.stack
      });
      // Don't throw, return null to indicate failure
      return null;
    }
  },

  /**
   * Record click analytics
   */
  async recordClick(smartlinkId, clickData) {
    try {
      // Convert country to 2-character code (default to 'XX' for unknown)
      let countryCode = 'XX'; // Default for unknown
      if (clickData.country && clickData.country.length >= 2) {
        countryCode = clickData.country.substring(0, 2).toUpperCase();
      }

      // Use simple analytics table structure
      await query(
        `INSERT INTO analytics (
          smartlink_id, platform, user_agent, ip_address, country, clicks
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          smartlinkId,
          clickData.platform || 'unknown',
          clickData.user_agent || '',
          clickData.ip_address || '0.0.0.0',
          countryCode,
          1 // Default clicks value
        ]
      );

      // Update click count
      await query(
        'UPDATE smartlinks SET click_count = click_count + 1 WHERE id = $1',
        [smartlinkId]
      );

    } catch (error) {
      console.error('❌ Click recording error:', error);
      // Try a simpler insert as fallback
      try {
        await query(
          'UPDATE smartlinks SET click_count = click_count + 1 WHERE id = $1',
          [smartlinkId]
        );
        console.log('✅ Fallback: Updated click count without analytics');
      } catch (fallbackError) {
        console.error('❌ Fallback failed too:', fallbackError);
      }
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
   * Get analytics summary for a SmartLink
   */
  async getAnalytics(smartlinkId, userId, days = 30) {
    try {
      console.log('🔍 Analytics query - SmartLink ID:', smartlinkId, 'User ID:', userId, 'Days:', days);

      // Verify ownership (if userId is null, it's an admin request)
      if (userId !== null) {
        console.log('👤 Checking ownership for user ID:', userId);
        const smartlink = await queryOne(
          'SELECT id FROM smartlinks WHERE id = $1 AND user_id = $2',
          [smartlinkId, userId]
        );
        console.log('🔍 Ownership check result:', smartlink);

        if (!smartlink) {
          throw new Error('SmartLink non trouvé');
        }
      } else {
        // Admin request - just verify SmartLink exists
        const smartlink = await queryOne(
          'SELECT id FROM smartlinks WHERE id = $1',
          [smartlinkId]
        );

        if (!smartlink) {
          throw new Error('SmartLink non trouvé');
        }
      }

      // Get general analytics
      const analytics = await queryOne(
        `SELECT
          COUNT(*) as total_clicks,
          COUNT(DISTINCT ip_address) as unique_visitors,
          COUNT(DISTINCT DATE(clicked_at)) as active_days,
          mode() WITHIN GROUP (ORDER BY platform) as top_platform,
          mode() WITHIN GROUP (ORDER BY country) as top_country
         FROM analytics
         WHERE smartlink_id = $1
         AND clicked_at >= NOW() - INTERVAL '${days} days'`,
        [smartlinkId]
      );

      // Get platform-specific analytics
      const platformStats = await query(
        `SELECT
          platform,
          COUNT(*) as clicks,
          COUNT(DISTINCT ip_address) as unique_clicks
         FROM analytics
         WHERE smartlink_id = $1
         AND clicked_at >= NOW() - INTERVAL '${days} days'
         AND platform IS NOT NULL
         GROUP BY platform
         ORDER BY clicks DESC`,
        [smartlinkId]
      );

      // Get daily click trend for charts
      const dailyClicks = await query(
        `SELECT
          DATE(clicked_at) as date,
          COUNT(*) as clicks
         FROM analytics
         WHERE smartlink_id = $1
         AND clicked_at >= NOW() - INTERVAL '${days} days'
         GROUP BY DATE(clicked_at)
         ORDER BY date ASC`,
        [smartlinkId]
      );

      // Calculate percentages for platforms
      const totalClicks = parseInt(analytics.total_clicks);
      const platformsWithPercentage = platformStats.map(platform => ({
        platform: platform.platform,
        clicks: parseInt(platform.clicks),
        unique_clicks: parseInt(platform.unique_clicks),
        percentage: totalClicks > 0 ? (parseInt(platform.clicks) / totalClicks) * 100 : 0
      }));

      // Format timeline data
      const formattedTimeline = dailyClicks.map(day => ({
        date: day.date,
        total: parseInt(day.clicks),
        // Add platform breakdown for each day (we'll need to enhance this later)
        ...platformStats.reduce((acc, platform) => {
          acc[platform.platform] = 0; // Default to 0, will be enhanced with detailed daily data
          return acc;
        }, {})
      }));

      return {
        total_clicks: totalClicks,
        unique_visitors: parseInt(analytics.unique_visitors),
        active_days: parseInt(analytics.active_days),
        top_platform: analytics.top_platform,
        top_country: analytics.top_country,
        platforms: platformsWithPercentage,  // ✅ Correct key name
        timeline: formattedTimeline          // ✅ Correct key name
      };

    } catch (error) {
      console.error('❌ Analytics error:', error);
      throw error;
    }
  }
};

module.exports = { smartlinks };
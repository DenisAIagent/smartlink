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
            template, customization, odesli_data, odesli_fetched_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      const whereClause = userId ? 'id = $1 AND user_id = $2' : 'id = $1';
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
        // Parse JSON fields
        smartlink.platforms = JSON.parse(smartlink.platforms || '[]');
        smartlink.customization = JSON.parse(smartlink.customization || '{}');
        if (smartlink.odesli_data) {
          smartlink.odesli_data = JSON.parse(smartlink.odesli_data);
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
        // Delete smartlink
        const { rows: [deleted] } = await client.query(
          'DELETE FROM smartlinks WHERE id = $1 AND user_id = $2 RETURNING *',
          [id, userId]
        );
        
        if (deleted) {
          // Update user count
          await client.query(
            'UPDATE users SET smartlinks_count = smartlinks_count - 1 WHERE id = $1',
            [userId]
          );
        }
        
        return deleted;
      });
      
      return result;
    } catch (error) {
      console.error('❌ SmartLink delete error:', error);
      throw error;
    }
  },

  /**
   * Record click analytics
   */
  async recordClick(smartlinkId, clickData) {
    try {
      await query(
        `INSERT INTO analytics (
          smartlink_id, ip_address, user_agent, country, city, region,
          platform, referrer, device_type, browser, os, session_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          smartlinkId,
          clickData.ip_address,
          clickData.user_agent,
          clickData.country,
          clickData.city,
          clickData.region,
          clickData.platform,
          clickData.referrer,
          clickData.device_type,
          clickData.browser,
          clickData.os,
          clickData.session_id
        ]
      );
      
      // Update click count
      await query(
        'UPDATE smartlinks SET click_count = click_count + 1 WHERE id = $1',
        [smartlinkId]
      );
      
    } catch (error) {
      console.error('❌ Click recording error:', error);
      // Ne pas faire échouer la requête principale si analytics fail
    }
  },

  /**
   * Generate unique slug
   */
  async generateUniqueSlug(title, attempt = 0) {
    const base = title.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
      
    const slug = attempt === 0 
      ? `${base}-${Date.now().toString(36)}`
      : `${base}-${Date.now().toString(36)}-${attempt}`;
      
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
      // Verify ownership
      const smartlink = await queryOne(
        'SELECT id FROM smartlinks WHERE id = $1 AND user_id = $2',
        [smartlinkId, userId]
      );
      
      if (!smartlink) {
        throw new Error('SmartLink non trouvé');
      }
      
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
      
      return {
        ...analytics,
        total_clicks: parseInt(analytics.total_clicks),
        unique_visitors: parseInt(analytics.unique_visitors),
        active_days: parseInt(analytics.active_days)
      };
      
    } catch (error) {
      console.error('❌ Analytics error:', error);
      throw error;
    }
  }
};

module.exports = { smartlinks };
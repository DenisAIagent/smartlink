const fetch = require('node-fetch');

// Safe DB import - only load if DATABASE_URL exists
let dbModule = null;
if (process.env.DATABASE_URL) {
  try {
    dbModule = require('./db');
  } catch (error) {
    console.warn('⚠️ Database module not available, running without cache:', error.message);
  }
}

const ODESLI_API_URL = process.env.ODESLI_API_URL || 'https://api.song.link/v1-alpha.1';
const CACHE_TTL = parseInt(process.env.ODESLI_CACHE_TTL || '86400000'); // 24h
const RATE_LIMIT = parseInt(process.env.ODESLI_RATE_LIMIT || '10'); // 10 req/min

// Rate limiter simple
let requestCount = 0;
let resetTime = Date.now() + 60000;

const odesli = {
  /**
   * Récupère les données Odesli avec cache DB
   */
  async fetchLinks(sourceUrl) {
    try {
      // 1. Check cache DB (skip if no DATABASE_URL or dbModule)
      if (process.env.DATABASE_URL && dbModule) {
        try {
          const cached = await dbModule.queryOne(
            `SELECT data, hit_count
             FROM odesli_cache
             WHERE source_url = $1 AND expires_at > NOW()`,
            [sourceUrl]
          );

          if (cached) {
            console.log('💾 Odesli cache hit from DB');
            // Update hit count
            await dbModule.query(
              'UPDATE odesli_cache SET hit_count = hit_count + 1 WHERE source_url = $1',
              [sourceUrl]
            );
            return cached.data;
          }
        } catch (dbError) {
          console.warn('⚠️ Cache lookup failed, continuing without cache:', dbError.message);
        }
      }
      
      // 2. Check rate limit
      if (Date.now() > resetTime) {
        requestCount = 0;
        resetTime = Date.now() + 60000;
      }
      
      if (requestCount >= RATE_LIMIT) {
        throw new Error(`Rate limit atteint (${RATE_LIMIT} req/min). Réessayez dans ${Math.ceil((resetTime - Date.now()) / 1000)}s`);
      }
      
      // 3. Fetch from Odesli API
      console.log('🔄 Fetching from Odesli API:', sourceUrl);
      requestCount++;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(
        `${ODESLI_API_URL}/links?url=${encodeURIComponent(sourceUrl)}&userCountry=FR&songIfSingle=true`,
        {
          headers: {
            'User-Agent': 'SmartLink/1.0 (https://mdmcmusicads.com)',
            'Accept': 'application/json'
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Musique non trouvée sur Odesli');
        }
        if (response.status === 429) {
          throw new Error('Odesli rate limit atteint');
        }
        throw new Error(`Odesli API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 4. Extract metadata - Prioritize Spotify for better CORS compatibility
      const entities = data.entitiesByUniqueId || {};
      let entityId = null;
      let entity = null;

      // Priority order: Spotify > Apple Music > YouTube > Others
      const priorityOrder = ['SPOTIFY_SONG', 'ITUNES_SONG', 'YOUTUBE_VIDEO'];

      for (const priority of priorityOrder) {
        entityId = Object.keys(entities).find(id => id.startsWith(priority));
        if (entityId) {
          entity = entities[entityId];
          break;
        }
      }

      // Fallback to first available entity if none of the priority ones found
      if (!entity) {
        entityId = Object.keys(entities)[0];
        entity = entityId ? entities[entityId] : null;
      }
      
      // 5. Save to cache (skip if no DATABASE_URL or dbModule)
      if (process.env.DATABASE_URL && dbModule) {
        try {
          await dbModule.query(
            `INSERT INTO odesli_cache (
              source_url, data, entity_id, title, artist,
              thumbnail_url, platforms_count, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '${CACHE_TTL / 1000} seconds')
            ON CONFLICT (source_url)
            DO UPDATE SET
              data = $2,
              entity_id = $3,
              title = $4,
              artist = $5,
              thumbnail_url = $6,
              platforms_count = $7,
              expires_at = NOW() + INTERVAL '${CACHE_TTL / 1000} seconds',
              hit_count = odesli_cache.hit_count + 1`,
            [
              sourceUrl,
              JSON.stringify(data),
              entityId || null,
              entity?.title || null,
              entity?.artistName || null,
              entity?.thumbnailUrl || null,
              Object.keys(data.linksByPlatform || {}).length
            ]
          );
        } catch (dbError) {
          console.warn('⚠️ Cache save failed, continuing without cache:', dbError.message);
        }
      }
      
      console.log('✅ Odesli data cached:', {
        title: entity?.title,
        artist: entity?.artistName,
        thumbnail: entity?.thumbnailUrl,
        platforms: Object.keys(data.linksByPlatform || {}).length
      });
      
      return data;
      
    } catch (error) {
      console.error('❌ Odesli error:', error.message);
      
      // Fallback: chercher dans le cache même expiré (skip if no DATABASE_URL or dbModule)
      if (process.env.DATABASE_URL && dbModule) {
        try {
          const expired = await dbModule.queryOne(
            'SELECT data FROM odesli_cache WHERE source_url = $1 ORDER BY created_at DESC LIMIT 1',
            [sourceUrl]
          );

          if (expired) {
            console.log('⚠️ Using expired cache as fallback');
            return expired.data;
          }
        } catch (dbError) {
          console.warn('⚠️ Cannot access cache fallback:', dbError.message);
        }
      }
      
      throw error;
    }
  },

  /**
   * Parse les données Odesli pour extraire les plateformes
   */
  parseData(odesliData) {
    const platforms = [];
    const linksByPlatform = odesliData.linksByPlatform || {};
    const entityId = Object.keys(odesliData.entitiesByUniqueId || {})[0];
    const entity = entityId ? odesliData.entitiesByUniqueId[entityId] : {};
    
    // Mapping des plateformes
    const platformMapping = {
      'spotify': { 
        name: 'Spotify', 
        color: '#1DB954', 
        icon: '/assets/images/platforms/png/picto_spotify.png',
        priority: 1 
      },
      'appleMusic': { 
        name: 'Apple Music', 
        color: '#FA243C', 
        icon: '/assets/images/platforms/png/picto_apple.png',
        priority: 2 
      },
      'youtubeMusic': { 
        name: 'YouTube Music', 
        color: '#FF0000', 
        icon: '/assets/images/platforms/png/picto_youtubemusic.png',
        priority: 3 
      },
      'youtube': { 
        name: 'YouTube', 
        color: '#FF0000', 
        icon: '/assets/images/platforms/png/picto_youtubemusic.png',
        priority: 4 
      },
      'deezer': { 
        name: 'Deezer', 
        color: '#FF6600', 
        icon: '/assets/images/platforms/png/picto_deezer.png',
        priority: 5 
      },
      'soundcloud': { 
        name: 'SoundCloud', 
        color: '#FF5500', 
        icon: '/assets/images/platforms/png/picto_soundcloud.png',
        priority: 6 
      },
      'tidal': { 
        name: 'Tidal', 
        color: '#000000', 
        icon: '/assets/images/platforms/png/picto_tidal.png',
        priority: 7 
      },
      'amazonMusic': { 
        name: 'Amazon Music', 
        color: '#FF9900', 
        icon: '/assets/images/platforms/png/picto_amazon.png',
        priority: 8 
      },
      'bandcamp': { 
        name: 'Bandcamp', 
        color: '#629AA0', 
        icon: '/images/platforms/picto_bandcamp.png',
        priority: 9 
      }
    };
    
    // Extraire les plateformes
    Object.keys(linksByPlatform).forEach(key => {
      const mapping = platformMapping[key];
      const platformData = linksByPlatform[key];
      
      if (mapping && platformData?.url) {
        platforms.push({
          ...mapping,
          url: platformData.url,
          nativeAppUriMobile: platformData.nativeAppUriMobile || null,
          nativeAppUriDesktop: platformData.nativeAppUriDesktop || null
        });
      }
    });
    
    // Trier par priorité
    platforms.sort((a, b) => a.priority - b.priority);

    const result = {
      title: entity.title || '',
      artist: entity.artistName || '',
      coverUrl: entity.thumbnailUrl || '',
      platforms,
      pageUrl: odesliData.pageUrl || '',
      entityId
    };

    console.log('🎨 Parsed Odesli data:', {
      title: result.title,
      artist: result.artist,
      coverUrl: result.coverUrl,
      coverUrlLength: result.coverUrl.length,
      platformsCount: result.platforms.length
    });

    return result;
  },

  /**
   * Validate URL format
   */
  validateUrl(url) {
    try {
      const urlObj = new URL(url);
      // Vérifier que c'est une URL de streaming
      const validDomains = [
        'spotify.com', 'music.apple.com', 'youtube.com', 'youtu.be',
        'deezer.com', 'soundcloud.com', 'tidal.com', 'music.amazon.',
        'bandcamp.com', 'qobuz.com'
      ];
      
      const isValid = validDomains.some(domain => urlObj.hostname.includes(domain));
      if (!isValid) {
        throw new Error('URL invalide. Utilisez un lien Spotify, Apple Music, YouTube, Deezer, etc.');
      }
      
      return true;
    } catch {
      throw new Error('URL invalide');
    }
  },

  /**
   * Stats du cache
   */
  async getCacheStats() {
    if (!process.env.DATABASE_URL || !dbModule) {
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        totalHits: 0,
        avgPlatforms: 0,
        lastCached: null,
        cacheEnabled: false
      };
    }

    try {
      const stats = await dbModule.queryOne(`
        SELECT
          COUNT(*) as total_entries,
          COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_entries,
          COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries,
          SUM(hit_count) as total_hits,
          ROUND(AVG(platforms_count), 1) as avg_platforms,
          MAX(created_at) as last_cached
        FROM odesli_cache
      `);

      return {
        totalEntries: parseInt(stats.total_entries),
        validEntries: parseInt(stats.valid_entries),
        expiredEntries: parseInt(stats.expired_entries),
        totalHits: parseInt(stats.total_hits) || 0,
        avgPlatforms: parseFloat(stats.avg_platforms) || 0,
        lastCached: stats.last_cached,
        cacheEnabled: true
      };
    } catch (error) {
      console.warn('⚠️ Cache stats failed:', error.message);
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        totalHits: 0,
        avgPlatforms: 0,
        lastCached: null,
        cacheEnabled: false,
        error: error.message
      };
    }
  },

  /**
   * Nettoyer le cache expiré
   */
  async cleanupCache() {
    if (!process.env.DATABASE_URL || !dbModule) {
      return 0;
    }

    try {
      const result = await dbModule.query(
        'DELETE FROM odesli_cache WHERE expires_at < NOW() RETURNING id'
      );
      return result.length;
    } catch (error) {
      console.warn('⚠️ Cache cleanup failed:', error.message);
      return 0;
    }
  },

  /**
   * Get popular cached songs
   */
  async getPopularSongs(limit = 10) {
    if (!process.env.DATABASE_URL || !dbModule) {
      return [];
    }

    try {
      const songs = await dbModule.query(`
        SELECT title, artist, hit_count, created_at, platforms_count
        FROM odesli_cache
        WHERE title IS NOT NULL AND artist IS NOT NULL
        ORDER BY hit_count DESC, created_at DESC
        LIMIT $1
      `, [limit]);

      return songs;
    } catch (error) {
      console.warn('⚠️ Popular songs query failed:', error.message);
      return [];
    }
  }
};

module.exports = { odesli };
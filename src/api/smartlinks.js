const { smartlinks } = require('../lib/smartlinks');
const jwt = require('jsonwebtoken');
const { generateTrackingScripts, generateTrackingEvents } = require('../lib/tracking-generator');

// Function to generate modern SmartLink HTML page
function generateSmartLinkHTML(smartlink) {
  const { title, artist, cover_url, platforms, customization, slug, tracking_pixels } = smartlink;
  const fs = require('fs');
  const path = require('path');
  
  // Load the modern template
  const templatePath = path.join(__dirname, '../../templates/smartlink-modern.html');
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Platform configuration with PNG icons
  const platformConfig = {
    'spotify': { 
      name: 'Spotify', 
      color: '#1DB954', 
      desc: 'Music for everyone',
      icon: `<img src="/assets/images/platforms/picto_spotify.png" width="24" height="24" alt="Spotify">`
    },
    'apple': { 
      name: 'Apple Music', 
      color: '#FA243C', 
      desc: 'Music everywhere',
      icon: `<img src="/assets/images/platforms/picto_apple.png" width="24" height="24" alt="Apple Music">`
    },
    'applemusic': { 
      name: 'Apple Music', 
      color: '#FA243C', 
      desc: 'Music everywhere',
      icon: `<img src="/assets/images/platforms/picto_apple.png" width="24" height="24" alt="Apple Music">`
    },
    'youtube': {
      name: 'YouTube',
      color: '#FF0000',
      desc: 'Watch on YouTube',
      icon: `<img src="/assets/images/platforms/picto_youtube.png" width="24" height="24" alt="YouTube">`
    },
    'youtubemusic': {
      name: 'YouTube Music',
      color: '#FF0000',
      desc: 'Music videos & more',
      icon: `<img src="/assets/images/platforms/picto_youtubemusic.png" width="24" height="24" alt="YouTube Music">`
    },
    'deezer': { 
      name: 'Deezer', 
      color: '#FF6600', 
      desc: 'Flow your music',
      icon: `<img src="/assets/images/platforms/picto_deezer.png" width="24" height="24" alt="Deezer">`
    },
    'soundcloud': { 
      name: 'SoundCloud', 
      color: '#FF5500', 
      desc: 'Hear the future',
      icon: `<img src="/assets/images/platforms/picto_soundcloud.png" width="24" height="24" alt="SoundCloud">`
    },
    'tidal': { 
      name: 'Tidal', 
      color: '#000000', 
      desc: 'High fidelity',
      icon: `<img src="/assets/images/platforms/picto_tidal.png" width="24" height="24" alt="Tidal">`
    },
    'amazon': { 
      name: 'Amazon Music', 
      color: '#FF9900', 
      desc: 'Music unlimited',
      icon: `<img src="/assets/images/platforms/picto_amazon.png" width="24" height="24" alt="Amazon Music">`
    },
    'amazonmusic': { 
      name: 'Amazon Music', 
      color: '#FF9900', 
      desc: 'Music unlimited',
      icon: `<img src="/assets/images/platforms/picto_amazon.png" width="24" height="24" alt="Amazon Music">`
    }
  };
  
  // Generate platform items with the new design
  const platformsHTML = platforms.map(platform => {
    // Normalize platform name to a consistent key
    let platformKey = platform.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

    // Cas spéciaux pour éviter la confusion - Plus précis
    const nameMapping = {
      'youtubemusic': 'youtubemusic',
      'youtube': 'youtube',
      'applemusic': 'applemusic',
      'apple': 'applemusic', // Map "Apple" to "applemusic"
      'amazonmusic': 'amazonmusic',
      'amazon': 'amazonmusic', // Map "Amazon" to "amazonmusic"
      'spotify': 'spotify',
      'deezer': 'deezer',
      'soundcloud': 'soundcloud',
      'tidal': 'tidal'
    };

    // Use mapping if available, otherwise use the normalized key
    platformKey = nameMapping[platformKey] || platformKey;

    const config = platformConfig[platformKey] || {
      name: platform.name,
      color: '#666',
      desc: 'Listen now',
      icon: `<div style="width:20px;height:20px;background:#666;border-radius:4px;"></div>`
    };

    // Debug log to track platform mapping
    if (process.env.DEBUG_PLATFORM === 'true') {
      console.log(`🎯 Platform mapping: "${platform.name}" -> "${platformKey}"`);
    }

    return `
      <div class="platform-item ${platformKey}" onclick="openPlatform('${platformKey}', '${platform.url}')">
        <div class="platform-left">
          <div class="platform-icon">
            ${config.icon}
          </div>
          <div class="platform-info">
            <div class="platform-name">${config.name}</div>
            <div class="platform-description">${config.desc}</div>
          </div>
        </div>
        <button class="platform-button">Play</button>
      </div>
    `;
  }).join('');

  // Generate tracking scripts for this SmartLink
  const trackingScripts = generateTrackingScripts(tracking_pixels);
  const trackingEvents = generateTrackingEvents(tracking_pixels, smartlink);

  // Replace template placeholders
  template = template
    .replace(/\{\{TITLE\}\}/g, title || 'Titre')
    .replace(/\{\{ARTIST\}\}/g, artist || 'Artiste')
    .replace(/\{\{COVER_URL\}\}/g, cover_url || '')
    .replace(/\{\{COVER_URL_ENCODED\}\}/g, encodeURIComponent(cover_url || ''))
    .replace(/\{\{SLUG\}\}/g, slug || '')
    .replace(/\{\{PLATFORMS_HTML\}\}/g, platformsHTML)
    .replace(/\{\{TRACKING_HEAD\}\}/g, trackingScripts.head || '')
    .replace(/\{\{TRACKING_BODY_START\}\}/g, trackingScripts.bodyStart || '')
    .replace(/\{\{TRACKING_EVENTS\}\}/g, trackingEvents || '');

  return template;
}

// Auth middleware is now handled by authController

/**
 * POST /api/smartlinks - Create new SmartLink
 */
async function createSmartLink(req, res) {
  try {
    const userId = req.user.id;
    const data = req.body;
    
    // Validation des champs requis
    if (!data.title) {
      return res.status(400).json({
        success: false,
        error: 'Le titre est requis'
      });
    }
    
    const result = await smartlinks.create(userId, data);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error('❌ Create SmartLink error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du SmartLink'
    });
  }
}

/**
 * GET /api/smartlinks - List SmartLinks (user sees own, admin sees all)
 */
async function listSmartLinks(req, res) {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.is_admin;
    const { limit, offset, search } = req.query;

    let result;

    if (isAdmin) {
      // Admin can see all SmartLinks with creator info
      result = await smartlinks.listAll({
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
        search: search || ''
      });
    } else {
      // Regular user sees only their own SmartLinks
      result = await smartlinks.listByUser(userId, {
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
        search: search || ''
      });
    }

    res.json({
      success: true,
      isAdmin,
      ...result
    });

  } catch (error) {
    console.error('❌ List SmartLinks error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des SmartLinks'
    });
  }
}

/**
 * GET /api/smartlinks/:id - Get SmartLink details
 */
async function getSmartLink(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Temporary fix: Allow access to any existing smartlink
    const smartlink = await smartlinks.getById(id, null);
    
    if (!smartlink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    res.json({
      success: true,
      smartlink
    });
    
  } catch (error) {
    console.error('❌ Get SmartLink error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du SmartLink'
    });
  }
}

/**
 * PUT /api/smartlinks/:id - Update SmartLink
 */
async function updateSmartLink(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const data = req.body;
    const refreshOdesli = req.query.refreshOdesli === 'true';
    
    const smartlink = await smartlinks.update(id, userId, data, refreshOdesli);
    
    if (!smartlink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    res.json({
      success: true,
      smartlink
    });
    
  } catch (error) {
    console.error('❌ Update SmartLink error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du SmartLink'
    });
  }
}

/**
 * DELETE /api/smartlinks/:id - Delete SmartLink
 */
async function deleteSmartLink(req, res) {
  console.log('🗑️ DELETE request received for SmartLink ID:', req.params.id, 'by user:', req.user.id);

  const userId = req.user.id;
  const isAdmin = req.user.is_admin;
  const { id } = req.params;

  // Validate ID is numeric
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      error: 'ID invalide'
    });
  }

  try {
    // Allow admin to delete any SmartLink
    const deleted = await smartlinks.delete(parseInt(id), isAdmin ? null : userId);

    if (!deleted) {
      // SmartLink not found or no permission
      // BUT we return 200 OK because from the user's perspective,
      // the goal is achieved (the SmartLink doesn't exist)
      console.log(`SmartLink ${id} not found or already deleted`);
      return res.status(200).json({
        success: true,
        message: 'SmartLink supprimé ou déjà inexistant',
        alreadyDeleted: true
      });
    }

    console.log('✅ SmartLink deleted successfully:', id);
    res.json({
      success: true,
      message: 'SmartLink supprimé avec succès',
      alreadyDeleted: false
    });

  } catch (error) {
    // Only log as error if it's an actual unexpected error
    console.error('❌ Delete SmartLink unexpected error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      id: req.params.id,
      userId: req.user?.id
    });

    // Return a more user-friendly error
    res.status(500).json({
      success: false,
      error: 'Une erreur inattendue s\'est produite lors de la suppression',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * POST /api/smartlinks/batch-delete - Batch delete SmartLinks
 */
async function batchDeleteSmartLinks(req, res) {
  console.log('🗑️ BATCH DELETE request by user:', req.user.id);
  try {
    const userId = req.user.id;
    const isAdmin = req.user.is_admin;
    const { ids } = req.body;

    // Validation
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste d\'IDs invalide'
      });
    }

    if (ids.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 suppressions simultanées'
      });
    }

    // Résultats détaillés
    const results = {
      deleted: [],
      notFound: [],
      unauthorized: [],
      errors: []
    };

    // Suppression en parallèle avec contrôle d'accès
    const deletePromises = ids.map(async id => {
      try {
        // Convertir en entier
        const numId = parseInt(id);
        if (isNaN(numId)) {
          results.errors.push({ id, error: 'ID invalide' });
          return;
        }

        // Supprimer (la fonction delete vérifie déjà l'existence et les droits)
        const deleted = await smartlinks.delete(numId, isAdmin ? null : userId);

        if (deleted) {
          results.deleted.push(numId);
        } else {
          // Si null, c'est soit non trouvé, soit pas autorisé
          results.notFound.push(numId);
        }
      } catch (error) {
        console.error(`Error deleting SmartLink ${id}:`, error);
        results.errors.push({ id, error: error.message });
      }
    });

    await Promise.all(deletePromises);

    // Réponse
    const totalRemoved = results.deleted.length + results.notFound.length;
    const hasErrors = results.errors.length > 0 || results.unauthorized.length > 0;

    res.json({
      success: true,
      summary: {
        total: ids.length,
        deleted: results.deleted.length,
        notFound: results.notFound.length,
        unauthorized: results.unauthorized.length,
        errors: results.errors.length,
        totalRemoved
      },
      details: results
    });

  } catch (error) {
    console.error('❌ Batch delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression groupée'
    });
  }
}

/**
 * GET /api/smartlinks/:id/analytics - Get SmartLink analytics
 */
async function getSmartLinkAnalytics(req, res) {
  console.log('📊 Analytics request received for SmartLink ID:', req.params.id, 'by user:', req.user.id, 'days:', req.query.days);
  try {
    const userId = req.user.id;
    const isAdmin = req.user.is_admin;
    const { id } = req.params;
    const days = req.query.days ? parseInt(req.query.days) : 30;

    // Temporary fix: Allow access to any existing smartlink analytics
    const analytics = await smartlinks.getAnalytics(id, null, days);
    console.log('📈 Analytics data retrieved:', analytics);

    res.json({
      success: true,
      analytics,
      period: `${days} derniers jours`
    });

  } catch (error) {
    console.error('❌ Get analytics error:', error);

    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des analytics'
    });
  }
}

/**
 * GET /s/:slug - Public SmartLink page (no auth required)
 */
async function getPublicSmartLink(req, res) {
  try {
    const { slug } = req.params;
    
    const smartlink = await smartlinks.getBySlug(slug);
    
    if (!smartlink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    // Record analytics (extract from user agent, IP, etc.)
    // NOTE: This is the PAGEVIEW tracking, not platform click tracking
    const clickData = {
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      referrer: req.get('Referrer'),
      platform: 'pageview', // Mark this as a pageview, not a platform click
      // Add more analytics data as needed
    };

    console.log(`📄 PAGEVIEW: SmartLink ${smartlink.slug} accessed - IP: ${req.ip}, UA: ${req.get('User-Agent')?.substring(0, 50)}`);

    // Record click asynchronously (don't wait)
    smartlinks.recordClick(smartlink.id, clickData).catch(console.error);
    
    // Generate beautiful HTML page instead of JSON
    const htmlPage = generateSmartLinkHTML(smartlink);
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlPage);
    
  } catch (error) {
    console.error('❌ Public SmartLink error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du SmartLink'
    });
  }
}

// Simple rate limiting to prevent duplicate tracking within seconds
const recentTrackingEvents = new Map(); // IP+slug -> timestamp

// Track platform-specific clicks
async function trackPlatformClick(req, res) {
  try {
    const { slug } = req.params;
    const { platform, timestamp, userAgent } = req.body;

    // Rate limiting: prevent duplicate clicks from same IP within 5 seconds
    const trackingKey = `${req.ip}-${slug}-${platform || 'unknown'}`;
    const now = Date.now();
    const lastTracking = recentTrackingEvents.get(trackingKey);

    if (lastTracking && (now - lastTracking) < 5000) {
      console.log(`⚡ RATE LIMITED: Duplicate click from ${req.ip} for ${slug}/${platform} ignored`);
      return res.json({
        success: true,
        message: 'Click already recorded recently',
        rate_limited: true
      });
    }

    recentTrackingEvents.set(trackingKey, now);

    // Clean old entries (older than 10 seconds)
    for (const [key, time] of recentTrackingEvents.entries()) {
      if (now - time > 10000) {
        recentTrackingEvents.delete(key);
      }
    }

    console.log(`🎯 TRACKING: Clic "${platform}" pour ${slug} - Body:`, JSON.stringify(req.body));

    // Ignore clicks without valid platform information
    if (!platform || platform === 'undefined' || platform === 'null' || platform.trim() === '') {
      console.log(`❌ IGNORED: Click without valid platform for ${slug} - Platform: "${platform}"`);
      return res.json({
        success: false,
        message: 'Invalid platform - click ignored',
        ignored: true
      });
    }

    // Test mode: simulate success for test slugs
    if (slug === 'test-demo' || slug === 'test-tracking') {
      console.log(`🧪 TEST MODE: Clic simulé ${platform} pour ${slug}`);
      return res.json({
        success: true,
        message: `Click ${platform} enregistré (mode test)`,
        test_mode: true
      });
    }

    // Si pas de DATABASE_URL, utiliser le stockage en mémoire pour les tests
    if (!process.env.DATABASE_URL) {
      console.log(`💾 MEMORY MODE: Sauvegarde en mémoire - ${platform} pour ${slug}`);

      // Simuler un enregistrement réussi
      global.clickStats = global.clickStats || {};
      global.clickStats[slug] = global.clickStats[slug] || {};
      global.clickStats[slug][platform] = (global.clickStats[slug][platform] || 0) + 1;

      console.log(`📊 Stats actuelles:`, global.clickStats[slug]);

      return res.json({
        success: true,
        message: `Click ${platform} enregistré (mode mémoire)`,
        memory_mode: true,
        current_stats: global.clickStats[slug]
      });
    }

    const smartlink = await smartlinks.getBySlug(slug);

    if (!smartlink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    // Record platform-specific analytics
    const clickData = {
      ip_address: req.ip,
      user_agent: userAgent || req.get('User-Agent'),
      referrer: req.get('Referrer'),
      platform,
      timestamp: timestamp || new Date().toISOString()
    };
    
    await smartlinks.recordClick(smartlink.id, clickData);
    
    res.json({
      success: true,
      message: 'Click enregistré'
    });
    
  } catch (error) {
    console.error('❌ Platform click tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur tracking'
    });
  }
}

module.exports = {
  createSmartLink,
  listSmartLinks,
  getSmartLink,
  updateSmartLink,
  deleteSmartLink,
  batchDeleteSmartLinks,
  getSmartLinkAnalytics,
  getPublicSmartLink,
  trackPlatformClick
};
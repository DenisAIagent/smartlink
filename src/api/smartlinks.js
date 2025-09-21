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
    // Mapping spécifique pour bien distinguer YouTube et YouTube Music
    let platformKey = platform.name.toLowerCase().replace(/\s+/g, '');

    // Cas spéciaux pour éviter la confusion
    if (platformKey === 'youtubemusic') {
      platformKey = 'youtubemusic';
    } else if (platformKey === 'youtube') {
      platformKey = 'youtube';
    } else if (platformKey === 'applemusic') {
      platformKey = 'applemusic';
    } else if (platformKey === 'amazonmusic') {
      platformKey = 'amazonmusic';
    } else {
      // Pour les autres, on peut enlever "music" si nécessaire
      platformKey = platformKey.replace('music', '');
    }

    const config = platformConfig[platformKey] || {
      name: platform.name,
      color: '#666',
      desc: 'Listen now',
      icon: `<div style="width:20px;height:20px;background:#666;border-radius:4px;"></div>`
    };
    
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
 * GET /api/smartlinks - List user SmartLinks
 */
async function listSmartLinks(req, res) {
  try {
    const userId = req.user.id;
    const { limit, offset, search } = req.query;
    
    const result = await smartlinks.listByUser(userId, {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      search: search || ''
    });
    
    res.json({
      success: true,
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
    
    const smartlink = await smartlinks.getById(id, userId);
    
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
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const deleted = await smartlinks.delete(id, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'SmartLink supprimé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Delete SmartLink error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du SmartLink'
    });
  }
}

/**
 * GET /api/smartlinks/:id/analytics - Get SmartLink analytics
 */
async function getSmartLinkAnalytics(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const days = req.query.days ? parseInt(req.query.days) : 30;
    
    const analytics = await smartlinks.getAnalytics(id, userId, days);
    
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
    const clickData = {
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      referrer: req.get('Referrer'),
      // Add more analytics data as needed
    };
    
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

// Track platform-specific clicks
async function trackPlatformClick(req, res) {
  try {
    const { slug } = req.params;
    const { platform, timestamp, userAgent } = req.body;
    
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
  getSmartLinkAnalytics,
  getPublicSmartLink,
  trackPlatformClick
};
const { odesli } = require('../lib/odesli');

/**
 * POST /api/odesli - Fetch music metadata via Odesli
 */
async function fetchMetadata(req, res) {
  try {
    const { url } = req.body;
    
    // Validation
    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: 'URL requise' 
      });
    }
    
    // Validate URL format
    try {
      odesli.validateUrl(url);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
    
    // Fetch via service Odesli
    const data = await odesli.fetchLinks(url);
    
    // Parse et retourner
    const parsed = odesli.parseData(data);
    
    return res.json({
      success: true,
      data: parsed,
      // Optionnel: données brutes pour debug en développement
      ...(process.env.NODE_ENV === 'development' && { raw: data })
    });
    
  } catch (error) {
    console.error('❌ Odesli API error:', error);
    
    // Gestion d'erreur user-friendly
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({ 
        success: false,
        error: 'Trop de requêtes. Réessayez dans quelques secondes.' 
      });
    }
    
    if (error.message.includes('non trouvée')) {
      return res.status(404).json({ 
        success: false,
        error: 'Cette musique n\'a pas été trouvée sur Odesli.' 
      });
    }
    
    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      return res.status(408).json({ 
        success: false,
        error: 'Délai d\'attente dépassé. Réessayez plus tard.' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des liens. Réessayez plus tard.' 
    });
  }
}

/**
 * GET /api/odesli/stats - Get cache statistics
 */
async function getCacheStats(req, res) {
  try {
    const stats = await odesli.getCacheStats();
    const popularSongs = await odesli.getPopularSongs(5);
    
    res.json({
      success: true,
      cache: stats,
      popularSongs,
      rateLimit: {
        limit: process.env.ODESLI_RATE_LIMIT || 10,
        window: '1 minute'
      }
    });
  } catch (error) {
    console.error('❌ Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
}

/**
 * DELETE /api/odesli/cache - Clean expired cache
 */
async function cleanCache(req, res) {
  try {
    const deletedCount = await odesli.cleanupCache();
    
    res.json({
      success: true,
      message: `${deletedCount} entrées expirées supprimées du cache`,
      deletedCount
    });
  } catch (error) {
    console.error('❌ Cache cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage du cache'
    });
  }
}

module.exports = {
  fetchMetadata,
  getCacheStats,
  cleanCache
};
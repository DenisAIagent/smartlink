const { smartlinks } = require('../lib/smartlinks');
const jwt = require('jsonwebtoken');

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
    
    res.json({
      success: true,
      smartlink
    });
    
  } catch (error) {
    console.error('❌ Public SmartLink error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du SmartLink'
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
  getPublicSmartLink
};
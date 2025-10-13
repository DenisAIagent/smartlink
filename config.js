/**
 * Configuration client-side pour MDMC Admin
 * Variables d'environnement disponibles côté navigateur
 */

// Configuration par défaut
const defaultConfig = {
    API_BASE_URL: window.location.origin,
    SMARTLINK_BASE_URL: 'https://smartlink.mdmcmusicads.com',
    BACKEND_URL: 'https://mdmcv7-backend-production.up.railway.app',
    ENVIRONMENT: 'development',
    VERSION: '2.0.0'
};

// Override avec les variables d'environnement si disponibles
const config = {
    ...defaultConfig,
    // Variables injectées par le serveur
    ...(window.ENV_CONFIG || {})
};

// Rendre la config disponible globalement
window.config = config;

// Pour compatibilité avec l'ancien code
window.API_BASE_URL = config.API_BASE_URL;
window.SMARTLINK_BASE_URL = config.SMARTLINK_BASE_URL;

// Debug
console.log('📋 MDMC Config loaded:', config);

// Export pour modules ES6 si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}
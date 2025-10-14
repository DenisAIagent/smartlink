/**
 * GDPR Consent Management System
 * Compliant with Articles 6, 7, 13, 14, 25 of GDPR
 */

class ConsentManager {
  constructor() {
    this.consentData = this.loadConsent();
    this.initializeEventListeners();
  }

  // Load existing consent from localStorage
  loadConsent() {
    try {
      const stored = localStorage.getItem('mdmc_consent');
      return stored ? JSON.parse(stored) : {
        analytics: false,
        marketing: false,
        functional: true, // Essential cookies always true
        timestamp: null,
        version: '1.0'
      };
    } catch (error) {
      console.error('Error loading consent:', error);
      return this.getDefaultConsent();
    }
  }

  // Get default consent structure
  getDefaultConsent() {
    return {
      analytics: false,
      marketing: false,
      functional: true,
      timestamp: null,
      version: '1.0'
    };
  }

  // Save consent to localStorage and server
  async saveConsent(consent) {
    const consentData = {
      ...consent,
      timestamp: new Date().toISOString(),
      version: '1.0',
      userAgent: navigator.userAgent,
      ipAddress: await this.getClientIP()
    };

    // Save locally
    localStorage.setItem('mdmc_consent', JSON.stringify(consentData));
    this.consentData = consentData;

    // Save to server for audit trail
    try {
      await fetch('/api/consent/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consentData)
      });
    } catch (error) {
      console.error('Error saving consent to server:', error);
    }

    // Trigger consent change event
    this.triggerConsentChange();
  }

  // Check if consent is given for specific purpose
  hasConsent(purpose) {
    if (purpose === 'functional') return true; // Always allowed
    return this.consentData[purpose] === true;
  }

  // Check if consent is still valid (1 year expiry)
  isConsentValid() {
    if (!this.consentData.timestamp) return false;

    const consentDate = new Date(this.consentData.timestamp);
    const now = new Date();
    const oneYear = 365 * 24 * 60 * 60 * 1000;

    return (now - consentDate) < oneYear;
  }

  // Show consent banner
  showConsentBanner() {
    if (this.hasValidConsent()) return;

    const banner = this.createConsentBanner();
    document.body.appendChild(banner);
  }

  // Create consent banner HTML
  createConsentBanner() {
    const banner = document.createElement('div');
    banner.id = 'mdmc-consent-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #1a1a1a;
      color: white;
      padding: 20px;
      z-index: 999999;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
      font-family: Arial, sans-serif;
    `;

    banner.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px;">
            <h3 style="margin: 0 0 10px 0; font-size: 18px;">🍪 Gestion des cookies</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.4;">
              Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation de notre site.
              <a href="/privacy-policy" style="color: #4CAF50; text-decoration: underline;" target="_blank">
                Politique de confidentialité
              </a>
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="consent-reject" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
              Refuser tout
            </button>
            <button id="consent-customize" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
              Personnaliser
            </button>
            <button id="consent-accept" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
              Accepter tout
            </button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    banner.querySelector('#consent-accept').addEventListener('click', () => {
      this.acceptAll();
      this.hideConsentBanner();
    });

    banner.querySelector('#consent-reject').addEventListener('click', () => {
      this.rejectAll();
      this.hideConsentBanner();
    });

    banner.querySelector('#consent-customize').addEventListener('click', () => {
      this.showConsentModal();
    });

    return banner;
  }

  // Create detailed consent modal
  showConsentModal() {
    const modal = document.createElement('div');
    modal.id = 'mdmc-consent-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;

    modal.innerHTML = `
      <div style="background: white; border-radius: 10px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <div style="padding: 30px;">
          <h2 style="margin: 0 0 20px 0; color: #333;">Préférences de confidentialité</h2>

          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #555;">🔧 Cookies fonctionnels (obligatoires)</h3>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
              Nécessaires au fonctionnement du site (connexion, navigation, sécurité).
            </p>
            <label style="display: flex; align-items: center;">
              <input type="checkbox" checked disabled style="margin-right: 10px;">
              <span>Toujours activés</span>
            </label>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #555;">📊 Cookies analytiques</h3>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
              Google Analytics pour comprendre l'utilisation du site et améliorer les performances.
            </p>
            <label style="display: flex; align-items: center;">
              <input type="checkbox" id="consent-analytics" ${this.consentData.analytics ? 'checked' : ''} style="margin-right: 10px;">
              <span>Autoriser les cookies analytiques</span>
            </label>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 10px 0; color: #555;">🎯 Cookies marketing</h3>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
              Meta Pixel, TikTok Pixel pour le remarketing et la publicité ciblée.
            </p>
            <label style="display: flex; align-items: center;">
              <input type="checkbox" id="consent-marketing" ${this.consentData.marketing ? 'checked' : ''} style="margin-right: 10px;">
              <span>Autoriser les cookies marketing</span>
            </label>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="modal-cancel" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
              Annuler
            </button>
            <button id="modal-save" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('#modal-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('#modal-save').addEventListener('click', () => {
      const analytics = modal.querySelector('#consent-analytics').checked;
      const marketing = modal.querySelector('#consent-marketing').checked;

      this.saveConsent({
        functional: true,
        analytics: analytics,
        marketing: marketing
      });

      document.body.removeChild(modal);
      this.hideConsentBanner();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Accept all cookies
  async acceptAll() {
    await this.saveConsent({
      functional: true,
      analytics: true,
      marketing: true
    });
  }

  // Reject non-essential cookies
  async rejectAll() {
    await this.saveConsent({
      functional: true,
      analytics: false,
      marketing: false
    });
  }

  // Hide consent banner
  hideConsentBanner() {
    const banner = document.getElementById('mdmc-consent-banner');
    if (banner) {
      banner.remove();
    }
  }

  // Check if we have valid consent
  hasValidConsent() {
    return this.consentData.timestamp && this.isConsentValid();
  }

  // Get client IP for audit trail
  async getClientIP() {
    try {
      const response = await fetch('/api/client-ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // Trigger consent change event
  triggerConsentChange() {
    window.dispatchEvent(new CustomEvent('consentChanged', {
      detail: this.consentData
    }));
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Listen for consent changes to update tracking
    window.addEventListener('consentChanged', (event) => {
      this.updateTrackingScripts(event.detail);
    });
  }

  // Update tracking scripts based on consent
  updateTrackingScripts(consent) {
    // Remove existing tracking scripts
    this.removeTrackingScripts();

    // Add allowed tracking scripts
    if (consent.analytics) {
      this.loadAnalyticsScripts();
    }

    if (consent.marketing) {
      this.loadMarketingScripts();
    }
  }

  // Remove all tracking scripts
  removeTrackingScripts() {
    // Remove Google Analytics
    const gaScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag"]');
    gaScripts.forEach(script => script.remove());

    // Remove GTM
    const gtmScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtm"]');
    gtmScripts.forEach(script => script.remove());

    // Remove Meta Pixel
    const metaScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');
    metaScripts.forEach(script => script.remove());

    // Remove TikTok Pixel
    const tiktokScripts = document.querySelectorAll('script[src*="analytics.tiktok.com"]');
    tiktokScripts.forEach(script => script.remove());

    // Clear dataLayer
    if (window.dataLayer) {
      window.dataLayer = [];
    }
  }

  // Load analytics scripts (GA, GTM)
  loadAnalyticsScripts() {
    const trackingPixels = window.TRACKING_PIXELS;
    if (!trackingPixels) return;

    // Load Google Analytics
    if (trackingPixels.google_analytics) {
      this.loadGoogleAnalytics(trackingPixels.google_analytics);
    }

    // Load Google Tag Manager
    if (trackingPixels.google_tag_manager) {
      this.loadGoogleTagManager(trackingPixels.google_tag_manager);
    }
  }

  // Load marketing scripts (Meta, TikTok)
  loadMarketingScripts() {
    const trackingPixels = window.TRACKING_PIXELS;
    if (!trackingPixels) return;

    // Load Meta Pixel
    if (trackingPixels.meta_pixel) {
      this.loadMetaPixel(trackingPixels.meta_pixel);
    }

    // Load TikTok Pixel
    if (trackingPixels.tiktok_pixel) {
      this.loadTikTokPixel(trackingPixels.tiktok_pixel);
    }
  }

  // Load Google Analytics
  loadGoogleAnalytics(measurementId) {
    if (!measurementId || measurementId === 'null') return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    const configScript = document.createElement('script');
    configScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        anonymize_ip: true,
        cookie_expires: 63072000,
        custom_map: {'custom_parameter': 'smartlink_id'}
      });
    `;
    document.head.appendChild(configScript);
  }

  // Load Google Tag Manager
  loadGoogleTagManager(gtmId) {
    if (!gtmId || gtmId === 'null') return;

    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(script);

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.appendChild(noscript);
  }

  // Load Meta Pixel
  loadMetaPixel(pixelId) {
    if (!pixelId || pixelId === 'null') return;

    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }

  // Load TikTok Pixel
  loadTikTokPixel(pixelId) {
    if (!pixelId || pixelId === 'null') return;

    const script = document.createElement('script');
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${pixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  }
}

// Initialize consent manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.consentManager = new ConsentManager();

  // Show consent banner if needed
  setTimeout(() => {
    window.consentManager.showConsentBanner();
  }, 1000);
});

// Export for server-side usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsentManager;
}
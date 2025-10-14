/**
 * Google Analytics Integration for MDMC Admin
 * Handles GA4 tracking with configurable measurement ID
 */

class GoogleAnalytics {
    constructor(measurementId) {
        this.measurementId = measurementId;
        this.isLoaded = false;
        this.init();
    }

    /**
     * Initialize Google Analytics
     */
    init() {
        if (!this.measurementId || this.measurementId === 'GA_MEASUREMENT_ID_PLACEHOLDER') {
            console.warn('Google Analytics: No measurement ID provided');
            return;
        }

        // Load gtag script
        this.loadGtagScript();

        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
            dataLayer.push(arguments);
        };

        // Configure GA
        gtag('js', new Date());
        gtag('config', this.measurementId, {
            // Enhanced measurement events
            enhanced_measurements: {
                scrolls: true,
                outbound_clicks: true,
                site_search: true,
                video_engagement: true,
                file_downloads: true
            },
            // Custom parameters for MDMC
            custom_map: {
                'custom_parameter_1': 'smartlink_id',
                'custom_parameter_2': 'user_role'
            }
        });

        this.isLoaded = true;
        console.log('Google Analytics initialized:', this.measurementId);
    }

    /**
     * Load Google Tag Manager script
     */
    loadGtagScript() {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
        document.head.insertBefore(script, document.head.firstChild);
    }

    /**
     * Track page view
     */
    trackPageView(pagePath, pageTitle) {
        if (!this.isLoaded) return;

        gtag('config', this.measurementId, {
            page_path: pagePath || window.location.pathname,
            page_title: pageTitle || document.title
        });

        console.log('GA: Page view tracked', {
            page_path: pagePath || window.location.pathname,
            page_title: pageTitle || document.title
        });
    }

    /**
     * Track custom events
     */
    trackEvent(eventName, parameters = {}) {
        if (!this.isLoaded) return;

        gtag('event', eventName, {
            event_category: parameters.category || 'engagement',
            event_label: parameters.label || '',
            value: parameters.value || 0,
            ...parameters
        });

        console.log('GA: Event tracked', eventName, parameters);
    }

    /**
     * Track SmartLink creation
     */
    trackSmartLinkCreation(smartlinkData) {
        this.trackEvent('smartlink_created', {
            category: 'smartlink',
            label: smartlinkData.title || 'unknown',
            smartlink_id: smartlinkData.id,
            artist: smartlinkData.artist,
            platforms_count: smartlinkData.platforms?.length || 0
        });
    }

    /**
     * Track SmartLink click
     */
    trackSmartLinkClick(smartlinkId, platform) {
        this.trackEvent('smartlink_click', {
            category: 'smartlink',
            label: platform,
            smartlink_id: smartlinkId
        });
    }

    /**
     * Track user actions
     */
    trackUserAction(action, details = {}) {
        this.trackEvent('user_action', {
            category: 'user',
            label: action,
            ...details
        });
    }

    /**
     * Track errors
     */
    trackError(error, context = {}) {
        this.trackEvent('error', {
            category: 'error',
            label: error.message || 'unknown_error',
            error_type: error.name || 'Error',
            context: JSON.stringify(context)
        });
    }

    /**
     * Set user properties
     */
    setUserProperties(properties) {
        if (!this.isLoaded) return;

        gtag('config', this.measurementId, {
            user_properties: properties
        });
    }

    /**
     * Track conversion/goal
     */
    trackConversion(conversionId, value = 0) {
        this.trackEvent('conversion', {
            category: 'conversion',
            label: conversionId,
            value: value
        });
    }
}

// Auto-initialize if measurement ID is available
window.MDMCAnalytics = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get GA ID from meta tag or window config
    const measurementId = document.querySelector('meta[name="ga-measurement-id"]')?.content ||
                         window.GA_MEASUREMENT_ID ||
                         'G-P11JTJ21NZ';

    if (measurementId) {
        window.MDMCAnalytics = new GoogleAnalytics(measurementId);

        // Track initial page view
        setTimeout(() => {
            window.MDMCAnalytics.trackPageView();
        }, 100);

        // Track navigation (for SPA-like behavior)
        let lastPath = window.location.pathname;
        setInterval(() => {
            if (window.location.pathname !== lastPath) {
                lastPath = window.location.pathname;
                window.MDMCAnalytics.trackPageView();
            }
        }, 1000);

        // Track unhandled errors
        window.addEventListener('error', function(event) {
            window.MDMCAnalytics.trackError(event.error, {
                filename: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
            window.MDMCAnalytics.trackError(new Error(event.reason), {
                type: 'unhandled_promise_rejection'
            });
        });
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleAnalytics;
}
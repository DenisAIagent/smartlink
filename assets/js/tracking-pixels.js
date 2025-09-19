// MDMC Tracking Pixels Manager - Facebook, Google, TikTok, etc.
class TrackingPixelsManager {
    constructor() {
        this.pixels = {
            facebook: null,
            google: null,
            tiktok: null,
            snapchat: null,
            twitter: null
        };
        this.initialized = false;
        this.retargetingAudiences = [];
    }

    // Initialize all configured pixels
    async initializePixels(config) {
        console.log('🎯 Initializing tracking pixels:', config);
        
        if (config.facebook) {
            this.initFacebookPixel(config.facebook);
        }
        
        if (config.google) {
            this.initGoogleAnalytics(config.google);
        }
        
        if (config.tiktok) {
            this.initTikTokPixel(config.tiktok);
        }
        
        if (config.snapchat) {
            this.initSnapchatPixel(config.snapchat);
        }
        
        if (config.twitter) {
            this.initTwitterPixel(config.twitter);
        }
        
        this.initialized = true;
        
        // Track page view on initialization
        this.trackPageView();
    }

    // Facebook Pixel
    initFacebookPixel(pixelId) {
        if (!pixelId || this.pixels.facebook) return;
        
        !function(f,b,e,v,n,t,s) {
            if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
        }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', pixelId);
        this.pixels.facebook = pixelId;
        
        console.log('✅ Facebook Pixel initialized:', pixelId);
    }

    // Google Analytics 4
    initGoogleAnalytics(measurementId) {
        if (!measurementId || this.pixels.google) return;
        
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);
        
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', measurementId);
        
        window.gtag = gtag;
        this.pixels.google = measurementId;
        
        console.log('✅ Google Analytics initialized:', measurementId);
    }

    // TikTok Pixel
    initTikTokPixel(pixelId) {
        if (!pixelId || this.pixels.tiktok) return;
        
        !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],
            ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},
            ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
            ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
            var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
            var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        }(window, document, 'ttq');
        
        ttq.load(pixelId);
        this.pixels.tiktok = pixelId;
        
        console.log('✅ TikTok Pixel initialized:', pixelId);
    }

    // Snapchat Pixel
    initSnapchatPixel(pixelId) {
        if (!pixelId || this.pixels.snapchat) return;
        
        (function(e,t,n){
            if(e.snaptr)return;var a=e.snaptr=function(){
            a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
            a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;
            r.src=n;var u=t.getElementsByTagName(s)[0];
            u.parentNode.insertBefore(r,u);
        })(window,document,'https://sc-static.net/scevent.min.js');
        
        snaptr('init', pixelId);
        this.pixels.snapchat = pixelId;
        
        console.log('✅ Snapchat Pixel initialized:', pixelId);
    }

    // Twitter Pixel
    initTwitterPixel(pixelId) {
        if (!pixelId || this.pixels.twitter) return;
        
        !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
        },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
        a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
        
        twq('config', pixelId);
        this.pixels.twitter = pixelId;
        
        console.log('✅ Twitter Pixel initialized:', pixelId);
    }

    // Track Events Across All Pixels
    trackEvent(eventName, parameters = {}) {
        console.log('📊 Tracking event:', eventName, parameters);
        
        // Facebook
        if (this.pixels.facebook && typeof fbq !== 'undefined') {
            const fbEventMap = {
                'page_view': 'PageView',
                'click': 'ViewContent',
                'play': 'ViewContent',
                'conversion': 'Purchase',
                'sign_up': 'CompleteRegistration',
                'add_to_cart': 'AddToCart',
                'pre_save': 'Lead'
            };
            
            const fbEvent = fbEventMap[eventName] || 'CustomEvent';
            fbq('track', fbEvent, parameters);
        }
        
        // Google Analytics
        if (this.pixels.google && typeof gtag !== 'undefined') {
            gtag('event', eventName, parameters);
        }
        
        // TikTok
        if (this.pixels.tiktok && typeof ttq !== 'undefined') {
            const ttEventMap = {
                'page_view': 'PageView',
                'click': 'ClickButton',
                'play': 'ViewContent',
                'conversion': 'CompletePayment',
                'sign_up': 'CompleteRegistration',
                'pre_save': 'SubmitForm'
            };
            
            const ttEvent = ttEventMap[eventName] || eventName;
            ttq.track(ttEvent, parameters);
        }
        
        // Snapchat
        if (this.pixels.snapchat && typeof snaptr !== 'undefined') {
            const snapEventMap = {
                'page_view': 'PAGE_VIEW',
                'click': 'VIEW_CONTENT',
                'conversion': 'PURCHASE',
                'sign_up': 'SIGN_UP',
                'pre_save': 'SUBSCRIBE'
            };
            
            const snapEvent = snapEventMap[eventName] || 'CUSTOM_EVENT';
            snaptr('track', snapEvent, parameters);
        }
        
        // Twitter
        if (this.pixels.twitter && typeof twq !== 'undefined') {
            twq('event', eventName, parameters);
        }
        
        // Custom webhook for server-side tracking
        this.sendToWebhook(eventName, parameters);
    }

    // Track page views
    trackPageView(url = window.location.href) {
        this.trackEvent('page_view', {
            page_location: url,
            page_title: document.title,
            timestamp: new Date().toISOString()
        });
    }

    // Track SmartLink clicks
    trackSmartLinkClick(platform, smartlinkId, artistName) {
        this.trackEvent('click', {
            platform: platform,
            smartlink_id: smartlinkId,
            artist: artistName,
            value: platform === 'spotify' ? 1.5 : 1.0, // Different values per platform
            currency: 'EUR'
        });
        
        // Add to retargeting audience
        this.addToRetargetingAudience('engaged_users', {
            platform,
            smartlinkId,
            engagement_level: 'high'
        });
    }

    // Track Pre-Save
    trackPreSave(platform, artistName, releaseDate) {
        this.trackEvent('pre_save', {
            platform: platform,
            artist: artistName,
            release_date: releaseDate,
            value: 5.0, // High value for pre-saves
            currency: 'EUR'
        });
        
        // Add to special audience
        this.addToRetargetingAudience('pre_save_users', {
            platform,
            artistName,
            releaseDate
        });
    }

    // Track email capture
    trackEmailCapture(email, source) {
        this.trackEvent('sign_up', {
            method: 'email',
            source: source,
            value: 3.0,
            currency: 'EUR'
        });
        
        // Hash email for privacy
        const hashedEmail = this.hashEmail(email);
        
        // Advanced matching for Facebook
        if (this.pixels.facebook && typeof fbq !== 'undefined') {
            fbq('init', this.pixels.facebook, {
                em: hashedEmail
            });
        }
    }

    // Track conversion
    trackConversion(platform, value, currency = 'EUR') {
        this.trackEvent('conversion', {
            platform: platform,
            value: value,
            currency: currency,
            conversion_type: 'stream_to_purchase'
        });
        
        // Enhanced conversion tracking
        this.trackEnhancedConversion({
            value,
            currency,
            transaction_id: this.generateTransactionId()
        });
    }

    // Create retargeting audiences
    addToRetargetingAudience(audienceName, userData) {
        const audience = {
            name: audienceName,
            data: userData,
            timestamp: new Date().toISOString()
        };
        
        this.retargetingAudiences.push(audience);
        
        // Facebook Custom Audiences
        if (this.pixels.facebook && typeof fbq !== 'undefined') {
            fbq('trackCustom', `AddToAudience_${audienceName}`, userData);
        }
        
        // Google Ads remarketing
        if (this.pixels.google && typeof gtag !== 'undefined') {
            gtag('event', 'add_to_audience', {
                audience_name: audienceName,
                ...userData
            });
        }
        
        console.log(`👥 Added to retargeting audience: ${audienceName}`, userData);
    }

    // Enhanced conversion tracking for iOS 14.5+
    trackEnhancedConversion(data) {
        // Server-side conversion API
        fetch('/api/tracking/conversion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                pixels: this.pixels,
                conversion_data: data,
                user_agent: navigator.userAgent,
                ip_address: 'server-side', // Will be captured server-side
                timestamp: new Date().toISOString()
            })
        }).catch(console.error);
    }

    // Send events to custom webhook
    async sendToWebhook(eventName, parameters) {
        if (!window.TRACKING_WEBHOOK_URL) return;
        
        try {
            await fetch(window.TRACKING_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event: eventName,
                    parameters: parameters,
                    pixels: Object.keys(this.pixels).filter(p => this.pixels[p]),
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    referrer: document.referrer
                })
            });
        } catch (error) {
            console.error('Webhook error:', error);
        }
    }

    // Helper: Hash email for privacy
    hashEmail(email) {
        // Simple hash for demonstration - use crypto library in production
        return btoa(email.toLowerCase().trim());
    }

    // Helper: Generate transaction ID
    generateTransactionId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get retargeting audience data
    getAudienceData(audienceName) {
        return this.retargetingAudiences.filter(a => a.name === audienceName);
    }

    // Export audience for campaigns
    exportAudienceForCampaign(audienceName, platform) {
        const audienceData = this.getAudienceData(audienceName);
        
        const exportFormats = {
            facebook: this.formatForFacebook(audienceData),
            google: this.formatForGoogle(audienceData),
            tiktok: this.formatForTikTok(audienceData)
        };
        
        return exportFormats[platform] || audienceData;
    }

    formatForFacebook(data) {
        return {
            data: data.map(item => ({
                match_keys: {
                    extern_id: item.data.smartlinkId,
                    custom_data: item.data
                }
            })),
            schema: 'EXTERN_ID'
        };
    }

    formatForGoogle(data) {
        return {
            operations: data.map(item => ({
                create: {
                    userIdentifiers: [{
                        hashedEmail: this.hashEmail(item.data.email || '')
                    }]
                }
            }))
        };
    }

    formatForTikTok(data) {
        return {
            list: data.map(item => ({
                id: item.data.smartlinkId,
                properties: item.data
            }))
        };
    }

    // Debug mode
    enableDebugMode() {
        // Facebook
        if (typeof fbq !== 'undefined') {
            fbq('set', 'debug', true);
        }
        
        // Google
        if (typeof gtag !== 'undefined') {
            gtag('config', this.pixels.google, { debug_mode: true });
        }
        
        console.log('🐛 Debug mode enabled for all pixels');
    }

    // Get pixel status
    getPixelStatus() {
        return {
            facebook: !!this.pixels.facebook,
            google: !!this.pixels.google,
            tiktok: !!this.pixels.tiktok,
            snapchat: !!this.pixels.snapchat,
            twitter: !!this.pixels.twitter,
            initialized: this.initialized,
            audienceCount: this.retargetingAudiences.length
        };
    }
}

// Auto-initialize with config from backend
async function initializeTracking() {
    try {
        const response = await fetch('/api/settings/tracking', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const config = await response.json();
            window.trackingManager = new TrackingPixelsManager();
            await window.trackingManager.initializePixels(config);
            
            console.log('✅ Tracking pixels initialized:', window.trackingManager.getPixelStatus());
        }
    } catch (error) {
        console.error('Failed to initialize tracking:', error);
        
        // Initialize with default/test pixels
        window.trackingManager = new TrackingPixelsManager();
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracking);
} else {
    initializeTracking();
}

// Export for use in other scripts
window.TrackingPixelsManager = TrackingPixelsManager;
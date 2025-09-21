/**
 * Tracking Pixels Generator for SmartLinks
 * Generates personalized tracking scripts for each SmartLink
 */

/**
 * Generate Google Analytics script
 */
function generateGoogleAnalytics(measurementId) {
  if (!measurementId || measurementId === 'null' || measurementId === 'undefined' || measurementId.includes('PLACEHOLDER')) return '';

  return `
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    </script>`;
}

/**
 * Generate Google Tag Manager script
 */
function generateGoogleTagManager(containerId) {
  if (!containerId || containerId === 'null' || containerId === 'undefined' || containerId.includes('PLACEHOLDER')) return '';

  return `
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${containerId}');</script>`;
}

/**
 * Generate Google Tag Manager noscript (for body)
 */
function generateGoogleTagManagerNoscript(containerId) {
  if (!containerId || containerId === 'null') return '';

  return `
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${containerId}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

/**
 * Generate Meta Pixel script
 */
function generateMetaPixel(pixelId) {
  if (!pixelId || pixelId === 'null' || pixelId === 'undefined' || pixelId.includes('PLACEHOLDER') || pixelId === '123456789012345') return '';

  return `
    <!-- Meta Pixel Code -->
    <script>
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
    </script>
    <noscript><img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
    /></noscript>`;
}

/**
 * Generate TikTok Pixel script
 */
function generateTikTokPixel(pixelId) {
  if (!pixelId || pixelId === 'null' || pixelId === 'undefined' || pixelId.includes('PLACEHOLDER') || pixelId === 'ABCDEFGHIJKLMNOP') return '';

  return `
    <!-- TikTok Pixel Code -->
    <script>
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${pixelId}');
      ttq.page();
    }(window, document, 'ttq');
    </script>`;
}

/**
 * Generate custom scripts
 */
function generateCustomScripts(customScripts) {
  if (!customScripts || !Array.isArray(customScripts) || customScripts.length === 0) {
    return '';
  }

  return customScripts.map(script => {
    // Sanitize and validate custom scripts
    if (typeof script === 'string' && script.trim()) {
      return `<!-- Custom Script -->\n<script>${script}</script>`;
    } else if (script && script.code && typeof script.code === 'string') {
      return `<!-- Custom Script: ${script.name || 'Unnamed'} -->\n<script>${script.code}</script>`;
    }
    return '';
  }).filter(Boolean).join('\n');
}

/**
 * Generate complete tracking scripts for a SmartLink
 */
function generateTrackingScripts(trackingPixels) {
  if (!trackingPixels || typeof trackingPixels !== 'object') {
    return { head: '', bodyStart: '' };
  }

  const headScripts = [];
  const bodyStartScripts = [];

  // Google Analytics
  if (trackingPixels.google_analytics) {
    headScripts.push(generateGoogleAnalytics(trackingPixels.google_analytics));
  }

  // Google Tag Manager
  if (trackingPixels.google_tag_manager) {
    headScripts.push(generateGoogleTagManager(trackingPixels.google_tag_manager));
    bodyStartScripts.push(generateGoogleTagManagerNoscript(trackingPixels.google_tag_manager));
  }

  // Meta Pixel
  if (trackingPixels.meta_pixel) {
    headScripts.push(generateMetaPixel(trackingPixels.meta_pixel));
  }

  // TikTok Pixel
  if (trackingPixels.tiktok_pixel) {
    headScripts.push(generateTikTokPixel(trackingPixels.tiktok_pixel));
  }

  // Custom Scripts
  if (trackingPixels.custom_scripts) {
    headScripts.push(generateCustomScripts(trackingPixels.custom_scripts));
  }

  return {
    head: headScripts.filter(Boolean).join('\n'),
    bodyStart: bodyStartScripts.filter(Boolean).join('\n')
  };
}

/**
 * Generate tracking events for SmartLink interactions
 */
function generateTrackingEvents(trackingPixels, smartlinkData) {
  if (!trackingPixels || typeof trackingPixels !== 'object') {
    return '';
  }

  const events = [];

  // Google Analytics events
  if (trackingPixels.google_analytics) {
    events.push(`
      // Track SmartLink view
      if (typeof gtag !== 'undefined') {
        gtag('event', 'smartlink_view', {
          'smartlink_id': '${smartlinkData.slug}',
          'smartlink_title': '${smartlinkData.title}',
          'smartlink_artist': '${smartlinkData.artist || ''}'
        });
      }
    `);
  }

  // Meta Pixel events
  if (trackingPixels.meta_pixel) {
    events.push(`
      // Track SmartLink view on Meta
      if (typeof fbq !== 'undefined') {
        fbq('track', 'ViewContent', {
          content_name: '${smartlinkData.title}',
          content_category: 'SmartLink',
          content_ids: ['${smartlinkData.slug}']
        });
      }
    `);
  }

  // TikTok Pixel events
  if (trackingPixels.tiktok_pixel) {
    events.push(`
      // Track SmartLink view on TikTok
      if (typeof ttq !== 'undefined') {
        ttq.track('ViewContent', {
          content_name: '${smartlinkData.title}',
          content_category: 'SmartLink',
          content_id: '${smartlinkData.slug}'
        });
      }
    `);
  }

  if (events.length === 0) return '';

  return `
    <script>
      // SmartLink Tracking Events
      ${events.join('\n')}

      // Track platform clicks
      function trackPlatformClick(platform, url) {
        ${trackingPixels.google_analytics ? `
        if (typeof gtag !== 'undefined') {
          gtag('event', 'platform_click', {
            'platform': platform,
            'smartlink_id': '${smartlinkData.slug}',
            'outbound_url': url
          });
        }` : ''}

        ${trackingPixels.meta_pixel ? `
        if (typeof fbq !== 'undefined') {
          fbq('track', 'Lead', {
            content_name: '${smartlinkData.title}',
            content_category: platform
          });
        }` : ''}

        ${trackingPixels.tiktok_pixel ? `
        if (typeof ttq !== 'undefined') {
          ttq.track('ClickButton', {
            content_name: '${smartlinkData.title}',
            content_category: platform
          });
        }` : ''}
      }
    </script>`;
}

module.exports = {
  generateTrackingScripts,
  generateTrackingEvents,
  generateGoogleAnalytics,
  generateGoogleTagManager,
  generateMetaPixel,
  generateTikTokPixel,
  generateCustomScripts
};
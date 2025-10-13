// MDMC QR Code Manager - Dynamic QR codes with tracking
class QRCodeManager {
    constructor() {
        this.qrCodes = new Map();
        this.qrLibLoaded = false;
        this.init();
    }

    async init() {
        await this.loadQRLibrary();
    }

    async loadQRLibrary() {
        if (typeof QRCode !== 'undefined') {
            this.qrLibLoaded = true;
            return;
        }

        // Load qrcode.js library (lightweight, 12kb)
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        document.head.appendChild(script);

        return new Promise((resolve) => {
            script.onload = () => {
                this.qrLibLoaded = true;
                console.log('✅ QR Code library loaded');
                resolve();
            };
        });
    }

    // Generate QR code for SmartLink
    async generateSmartLinkQR(smartlinkUrl, options = {}) {
        if (!this.qrLibLoaded) {
            await this.loadQRLibrary();
        }

        const defaultOptions = {
            width: 300,
            height: 300,
            margin: 2,
            color: {
                dark: options.darkColor || '#000000',
                light: options.lightColor || '#FFFFFF'
            },
            errorCorrectionLevel: 'H', // High error correction
            type: 'canvas',
            logo: options.logo || null,
            logoSize: options.logoSize || 60,
            dotStyle: options.dotStyle || 'square', // square, rounded, dots
            cornerStyle: options.cornerStyle || 'square' // square, rounded
        };

        const finalOptions = { ...defaultOptions, ...options };
        
        // Generate tracking URL
        const trackingUrl = this.createTrackingUrl(smartlinkUrl, options.campaign);
        
        // Create QR code
        const qrData = await this.createQRCode(trackingUrl, finalOptions);
        
        // Store in cache
        const qrId = this.generateQRId();
        this.qrCodes.set(qrId, {
            url: trackingUrl,
            originalUrl: smartlinkUrl,
            options: finalOptions,
            createdAt: new Date(),
            data: qrData
        });

        return {
            id: qrId,
            dataUrl: qrData.dataUrl,
            svg: qrData.svg,
            trackingUrl: trackingUrl
        };
    }

    async createQRCode(text, options) {
        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        const ctx = canvas.getContext('2d');

        // Generate base QR code
        await QRCode.toCanvas(canvas, text, {
            width: options.width,
            margin: options.margin,
            errorCorrectionLevel: options.errorCorrectionLevel,
            color: options.color
        });

        // Apply custom styles
        if (options.dotStyle !== 'square') {
            this.applyDotStyle(ctx, options);
        }

        // Add logo if provided
        if (options.logo) {
            await this.addLogoToQR(ctx, options);
        }

        // Add gradient if specified
        if (options.gradient) {
            this.applyGradient(ctx, options);
        }

        // Generate outputs
        const dataUrl = canvas.toDataURL('image/png');
        const svg = await this.generateSVG(text, options);

        return {
            dataUrl,
            svg,
            canvas
        };
    }

    applyDotStyle(ctx, options) {
        const imageData = ctx.getImageData(0, 0, options.width, options.height);
        const data = imageData.data;
        
        // Clear canvas
        ctx.clearRect(0, 0, options.width, options.height);
        
        // Calculate module size
        const moduleCount = Math.sqrt(data.length / 4);
        const moduleSize = options.width / moduleCount;
        
        // Redraw with custom dot style
        for (let y = 0; y < moduleCount; y++) {
            for (let x = 0; x < moduleCount; x++) {
                const i = (y * moduleCount + x) * 4;
                
                if (data[i] === 0) { // Dark module
                    const centerX = x * moduleSize + moduleSize / 2;
                    const centerY = y * moduleSize + moduleSize / 2;
                    
                    ctx.fillStyle = options.color.dark;
                    
                    switch (options.dotStyle) {
                        case 'rounded':
                            this.drawRoundedSquare(ctx, centerX - moduleSize/2, centerY - moduleSize/2, moduleSize, moduleSize * 0.2);
                            break;
                        case 'dots':
                            ctx.beginPath();
                            ctx.arc(centerX, centerY, moduleSize * 0.4, 0, Math.PI * 2);
                            ctx.fill();
                            break;
                        case 'diamond':
                            this.drawDiamond(ctx, centerX, centerY, moduleSize * 0.8);
                            break;
                        default:
                            ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
                    }
                }
            }
        }
    }

    drawRoundedSquare(ctx, x, y, size, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        ctx.lineTo(x + size, y + size - radius);
        ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        ctx.lineTo(x + radius, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    drawDiamond(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/2, y);
        ctx.lineTo(x, y + size/2);
        ctx.lineTo(x - size/2, y);
        ctx.closePath();
        ctx.fill();
    }

    async addLogoToQR(ctx, options) {
        return new Promise((resolve) => {
            const logo = new Image();
            logo.onload = () => {
                const logoSize = options.logoSize;
                const x = (options.width - logoSize) / 2;
                const y = (options.height - logoSize) / 2;
                
                // White background for logo
                ctx.fillStyle = 'white';
                ctx.fillRect(x - 10, y - 10, logoSize + 20, logoSize + 20);
                
                // Draw logo
                ctx.drawImage(logo, x, y, logoSize, logoSize);
                resolve();
            };
            logo.src = options.logo;
        });
    }

    applyGradient(ctx, options) {
        const gradient = ctx.createLinearGradient(0, 0, options.width, options.height);
        gradient.addColorStop(0, options.gradient.start);
        gradient.addColorStop(1, options.gradient.end);
        
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, options.width, options.height);
        ctx.globalCompositeOperation = 'source-over';
    }

    async generateSVG(text, options) {
        const svgString = await QRCode.toString(text, {
            type: 'svg',
            width: options.width,
            margin: options.margin,
            errorCorrectionLevel: options.errorCorrectionLevel,
            color: options.color
        });
        
        return svgString;
    }

    // Create tracking URL with UTM parameters
    createTrackingUrl(baseUrl, campaign) {
        const url = new URL(baseUrl);
        
        // Add UTM parameters
        url.searchParams.set('utm_source', 'qr_code');
        url.searchParams.set('utm_medium', campaign?.medium || 'offline');
        url.searchParams.set('utm_campaign', campaign?.name || 'qr_campaign');
        
        if (campaign?.content) {
            url.searchParams.set('utm_content', campaign.content);
        }
        
        // Add QR-specific tracking
        url.searchParams.set('qr_id', this.generateQRId());
        url.searchParams.set('qr_timestamp', Date.now());
        
        return url.toString();
    }

    // Generate unique QR ID
    generateQRId() {
        return `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Create dynamic QR code with real-time data
    async createDynamicQR(smartlinkId, options = {}) {
        // This QR points to a redirect URL that can be updated
        const redirectUrl = `${window.location.origin}/qr/${smartlinkId}`;
        
        const qrResult = await this.generateSmartLinkQR(redirectUrl, {
            ...options,
            isDynamic: true
        });
        
        // Store mapping in backend
        await this.saveDynamicQRMapping(qrResult.id, smartlinkId, redirectUrl);
        
        return qrResult;
    }

    // Save QR mapping to backend
    async saveDynamicQRMapping(qrId, smartlinkId, redirectUrl) {
        try {
            await fetch('/api/qr-codes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    qr_id: qrId,
                    smartlink_id: smartlinkId,
                    redirect_url: redirectUrl,
                    is_dynamic: true
                })
            });
        } catch (error) {
            console.error('Failed to save QR mapping:', error);
        }
    }

    // Generate bulk QR codes
    async generateBulkQRCodes(urls, options = {}) {
        const results = [];
        const batchSize = 5; // Process in batches to avoid blocking
        
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(url => this.generateSmartLinkQR(url, options))
            );
            results.push(...batchResults);
            
            // Update progress
            if (options.onProgress) {
                options.onProgress((i + batchSize) / urls.length * 100);
            }
        }
        
        return results;
    }

    // Download QR code
    downloadQR(qrId, format = 'png', filename = null) {
        const qrData = this.qrCodes.get(qrId);
        if (!qrData) {
            console.error('QR code not found:', qrId);
            return;
        }
        
        const link = document.createElement('a');
        
        if (format === 'svg') {
            const blob = new Blob([qrData.data.svg], { type: 'image/svg+xml' });
            link.href = URL.createObjectURL(blob);
            link.download = filename || `qr_code_${qrId}.svg`;
        } else {
            link.href = qrData.data.dataUrl;
            link.download = filename || `qr_code_${qrId}.png`;
        }
        
        link.click();
    }

    // Generate QR code with custom branding
    async generateBrandedQR(url, brandConfig) {
        return this.generateSmartLinkQR(url, {
            logo: brandConfig.logoUrl,
            logoSize: 80,
            darkColor: brandConfig.primaryColor || '#000000',
            lightColor: brandConfig.backgroundColor || '#FFFFFF',
            dotStyle: brandConfig.style || 'rounded',
            gradient: brandConfig.useGradient ? {
                start: brandConfig.gradientStart,
                end: brandConfig.gradientEnd
            } : null,
            campaign: {
                name: brandConfig.campaignName,
                medium: brandConfig.medium || 'print'
            }
        });
    }

    // Create QR code for different contexts
    async createContextualQR(context, data) {
        const configs = {
            poster: {
                width: 500,
                height: 500,
                margin: 4,
                dotStyle: 'rounded',
                errorCorrectionLevel: 'H'
            },
            business_card: {
                width: 200,
                height: 200,
                margin: 1,
                dotStyle: 'square',
                errorCorrectionLevel: 'M'
            },
            billboard: {
                width: 1000,
                height: 1000,
                margin: 8,
                dotStyle: 'dots',
                errorCorrectionLevel: 'H'
            },
            social_media: {
                width: 400,
                height: 400,
                margin: 3,
                dotStyle: 'rounded',
                errorCorrectionLevel: 'L'
            }
        };
        
        const config = configs[context] || configs.poster;
        return this.generateSmartLinkQR(data.url, {
            ...config,
            ...data.customOptions
        });
    }

    // Track QR code scan
    async trackQRScan(qrId) {
        const qrData = this.qrCodes.get(qrId);
        
        if (qrData) {
            // Update local stats
            qrData.scans = (qrData.scans || 0) + 1;
            qrData.lastScanned = new Date();
            
            // Send to analytics
            if (window.trackingManager) {
                window.trackingManager.trackEvent('qr_scan', {
                    qr_id: qrId,
                    url: qrData.originalUrl,
                    campaign: qrData.options.campaign
                });
            }
            
            // Send to backend
            await fetch('/api/qr-codes/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    qr_id: qrId,
                    timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent
                })
            }).catch(console.error);
        }
    }

    // Get QR code analytics
    getQRAnalytics(qrId) {
        const qrData = this.qrCodes.get(qrId);
        
        if (!qrData) return null;
        
        return {
            id: qrId,
            url: qrData.originalUrl,
            created: qrData.createdAt,
            scans: qrData.scans || 0,
            lastScanned: qrData.lastScanned || null,
            campaign: qrData.options.campaign || {}
        };
    }

    // Clear QR cache
    clearCache() {
        this.qrCodes.clear();
        console.log('🗑️ QR code cache cleared');
    }
}

// Initialize QR Code Manager
window.qrCodeManager = new QRCodeManager();

// Helper function for quick QR generation
window.generateQR = async function(url, elementId, options = {}) {
    const result = await window.qrCodeManager.generateSmartLinkQR(url, options);
    
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const img = document.createElement('img');
            img.src = result.dataUrl;
            img.style.width = '100%';
            img.style.maxWidth = options.width || '300px';
            element.innerHTML = '';
            element.appendChild(img);
        }
    }
    
    return result;
};

console.log('✅ QR Code Manager initialized');
// MDMC Pre-Save Widgets - Spotify, Apple Music, YouTube Music integration
class PreSaveWidgetManager {
    constructor() {
        this.widgets = new Map();
        this.spotifySDK = null;
        this.appleSDK = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        console.log('🎵 PreSave Widget Manager initialized');
    }

    // Load Spotify Web Playback SDK
    async loadSpotifySDK() {
        if (this.spotifySDK) return this.spotifySDK;

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            document.body.appendChild(script);

            window.onSpotifyWebPlaybackSDKReady = () => {
                this.spotifySDK = true;
                resolve(this.spotifySDK);
            };
        });
    }

    // Load Apple Music SDK
    async loadAppleMusicSDK() {
        if (this.appleSDK) return this.appleSDK;

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
            script.onload = () => {
                this.appleSDK = window.MusicKit;
                resolve(this.appleSDK);
            };
            document.head.appendChild(script);
        });
    }

    // Create pre-save widget
    createPreSaveWidget(container, config) {
        const widget = {
            id: this.generateWidgetId(),
            container: typeof container === 'string' ? document.getElementById(container) : container,
            config: {
                title: config.title || 'Pre-Save Now!',
                artist: config.artist || 'Artist',
                releaseDate: config.releaseDate,
                albumArt: config.albumArt,
                platforms: config.platforms || ['spotify', 'apple', 'youtube'],
                theme: config.theme || 'dark',
                style: config.style || 'card',
                collectEmail: config.collectEmail || false,
                socialGate: config.socialGate || false,
                customMessage: config.customMessage || 'Be the first to hear it when it drops!',
                ...config
            }
        };

        this.widgets.set(widget.id, widget);
        this.renderWidget(widget);
        
        return widget.id;
    }

    // Render widget HTML
    renderWidget(widget) {
        const { config } = widget;
        const releaseDate = new Date(config.releaseDate);
        const now = new Date();
        const isReleased = now >= releaseDate;
        
        const html = `
            <div class="presave-widget presave-${config.theme} presave-${config.style}" data-widget-id="${widget.id}">
                ${this.renderWidgetHeader(config)}
                ${this.renderAlbumArt(config)}
                ${this.renderTrackInfo(config)}
                ${this.renderCountdown(config, releaseDate, isReleased)}
                ${this.renderPlatforms(config, isReleased)}
                ${config.collectEmail ? this.renderEmailCapture(config) : ''}
                ${config.socialGate ? this.renderSocialGate(config) : ''}
                ${this.renderFooter(config)}
            </div>
        `;
        
        widget.container.innerHTML = html;
        this.attachWidgetEvents(widget);
    }

    renderWidgetHeader(config) {
        return `
            <div class="presave-header">
                <div class="presave-badge">🎵 Pre-Save</div>
                <h3 class="presave-title">${config.title}</h3>
                <p class="presave-message">${config.customMessage}</p>
            </div>
        `;
    }

    renderAlbumArt(config) {
        if (!config.albumArt) return '';
        
        return `
            <div class="presave-artwork">
                <img src="${config.albumArt}" alt="${config.title}" class="album-cover">
                <div class="play-overlay">
                    <button class="play-btn">▶</button>
                </div>
            </div>
        `;
    }

    renderTrackInfo(config) {
        return `
            <div class="presave-info">
                <h4 class="track-title">${config.title}</h4>
                <p class="artist-name">${config.artist}</p>
                <p class="release-date">Release: ${new Date(config.releaseDate).toLocaleDateString()}</p>
            </div>
        `;
    }

    renderCountdown(config, releaseDate, isReleased) {
        if (isReleased) {
            return `
                <div class="presave-countdown released">
                    <div class="countdown-message">🎉 Out Now!</div>
                </div>
            `;
        }
        
        return `
            <div class="presave-countdown" data-release-date="${releaseDate.toISOString()}">
                <div class="countdown-timer">
                    <div class="time-unit">
                        <span class="time-value" data-unit="days">--</span>
                        <span class="time-label">Days</span>
                    </div>
                    <div class="time-unit">
                        <span class="time-value" data-unit="hours">--</span>
                        <span class="time-label">Hours</span>
                    </div>
                    <div class="time-unit">
                        <span class="time-value" data-unit="minutes">--</span>
                        <span class="time-label">Minutes</span>
                    </div>
                    <div class="time-unit">
                        <span class="time-value" data-unit="seconds">--</span>
                        <span class="time-label">Seconds</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderPlatforms(config, isReleased) {
        const platforms = {
            spotify: {
                name: 'Spotify',
                icon: '🟢',
                color: '#1DB954',
                action: isReleased ? 'Listen' : 'Pre-Save'
            },
            apple: {
                name: 'Apple Music',
                icon: '🍎',
                color: '#FA243C',
                action: isReleased ? 'Listen' : 'Pre-Add'
            },
            youtube: {
                name: 'YouTube Music',
                icon: '📺',
                color: '#FF0000',
                action: isReleased ? 'Watch' : 'Set Reminder'
            },
            deezer: {
                name: 'Deezer',
                icon: '🎵',
                color: '#FF6600',
                action: isReleased ? 'Listen' : 'Pre-Save'
            }
        };

        const platformsHtml = config.platforms.map(platformKey => {
            const platform = platforms[platformKey];
            if (!platform) return '';

            return `
                <button class="presave-platform-btn" 
                        data-platform="${platformKey}"
                        style="background-color: ${platform.color};">
                    <span class="platform-icon">${platform.icon}</span>
                    <span class="platform-text">${platform.action} on ${platform.name}</span>
                </button>
            `;
        }).join('');

        return `
            <div class="presave-platforms">
                ${platformsHtml}
            </div>
        `;
    }

    renderEmailCapture(config) {
        return `
            <div class="presave-email-capture">
                <h4>Get notified when it's live!</h4>
                <div class="email-form">
                    <input type="email" 
                           placeholder="Enter your email" 
                           class="email-input"
                           required>
                    <button type="button" class="email-submit-btn">Notify Me</button>
                </div>
                <p class="email-disclaimer">We'll only email you about this release. No spam!</p>
            </div>
        `;
    }

    renderSocialGate(config) {
        return `
            <div class="presave-social-gate">
                <h4>Unlock Pre-Save</h4>
                <p>Follow us and unlock instant pre-save access!</p>
                <div class="social-buttons">
                    <button class="social-btn" data-platform="instagram">
                        📷 Follow on Instagram
                    </button>
                    <button class="social-btn" data-platform="tiktok">
                        🎵 Follow on TikTok
                    </button>
                    <button class="social-btn" data-platform="twitter">
                        🐦 Follow on Twitter
                    </button>
                </div>
                <div class="gate-unlock" style="display: none;">
                    <p>✅ Thanks! Pre-save is now unlocked!</p>
                </div>
            </div>
        `;
    }

    renderFooter(config) {
        return `
            <div class="presave-footer">
                <div class="share-buttons">
                    <button class="share-btn" data-platform="facebook">Share</button>
                    <button class="share-btn" data-platform="twitter">Tweet</button>
                    <button class="share-btn" data-platform="whatsapp">WhatsApp</button>
                </div>
                <p class="powered-by">Powered by MDMC Music</p>
            </div>
        `;
    }

    // Attach event listeners to widget
    attachWidgetEvents(widget) {
        const container = widget.container;
        const widgetId = widget.id;
        
        // Platform buttons
        container.querySelectorAll('.presave-platform-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                this.handlePlatformClick(platform, widget.config, widgetId);
            });
        });

        // Email capture
        const emailForm = container.querySelector('.email-form');
        if (emailForm) {
            const emailInput = emailForm.querySelector('.email-input');
            const submitBtn = emailForm.querySelector('.email-submit-btn');
            
            submitBtn.addEventListener('click', () => {
                this.handleEmailCapture(emailInput.value, widget.config, widgetId);
            });
            
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleEmailCapture(emailInput.value, widget.config, widgetId);
                }
            });
        }

        // Social gate
        container.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                this.handleSocialFollow(platform, widget.config, widgetId);
            });
        });

        // Share buttons
        container.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                this.handleShare(platform, widget.config);
            });
        });

        // Start countdown if needed
        this.startCountdown(container);
    }

    // Handle platform pre-save clicks
    async handlePlatformClick(platform, config, widgetId) {
        console.log(`🎵 Pre-save clicked: ${platform}`);
        
        // Track event
        if (window.trackingManager) {
            window.trackingManager.trackPreSave(platform, config.artist, config.releaseDate);
        }
        
        switch (platform) {
            case 'spotify':
                await this.handleSpotifyPreSave(config);
                break;
            case 'apple':
                await this.handleAppleMusicPreSave(config);
                break;
            case 'youtube':
                await this.handleYouTubePreSave(config);
                break;
            default:
                this.handleGenericPreSave(platform, config);
        }
        
        this.showSuccessMessage(widgetId, platform);
    }

    async handleSpotifyPreSave(config) {
        // Spotify Web API integration
        const spotifyUrl = `https://open.spotify.com/album/${config.spotifyAlbumId || 'preview'}`;
        
        // For demo purposes - in production, use Spotify Web API
        window.open(spotifyUrl, '_blank');
        
        // Real implementation would use:
        // await this.spotifyAPI.saveAlbum(config.spotifyAlbumId);
    }

    async handleAppleMusicPreSave(config) {
        if (!this.appleSDK) {
            await this.loadAppleMusicSDK();
        }
        
        // Apple Music pre-add functionality
        const appleUrl = `https://music.apple.com/album/${config.appleMusicId || 'preview'}`;
        window.open(appleUrl, '_blank');
        
        // Real implementation would use Apple MusicKit
    }

    async handleYouTubePreSave(config) {
        // YouTube Music reminder functionality
        const youtubeUrl = `https://music.youtube.com/watch?v=${config.youtubeVideoId || 'preview'}`;
        window.open(youtubeUrl, '_blank');
    }

    handleGenericPreSave(platform, config) {
        // Fallback for other platforms
        alert(`Pre-save for ${platform} will be available soon!`);
    }

    // Handle email capture
    handleEmailCapture(email, config, widgetId) {
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Send to backend
        fetch('/api/presave/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                artist: config.artist,
                title: config.title,
                releaseDate: config.releaseDate,
                widget_id: widgetId
            })
        });

        // Track email capture
        if (window.trackingManager) {
            window.trackingManager.trackEmailCapture(email, 'presave_widget');
        }

        this.showSuccessMessage(widgetId, 'email');
    }

    // Handle social follow
    handleSocialFollow(platform, config, widgetId) {
        const socialUrls = {
            instagram: `https://instagram.com/${config.instagramHandle || 'mdmcmusic'}`,
            tiktok: `https://tiktok.com/@${config.tiktokHandle || 'mdmcmusic'}`,
            twitter: `https://twitter.com/${config.twitterHandle || 'mdmcmusic'}`
        };

        window.open(socialUrls[platform], '_blank');
        
        // Simulate unlock after a delay
        setTimeout(() => {
            this.unlockSocialGate(widgetId);
        }, 2000);
    }

    unlockSocialGate(widgetId) {
        const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
        const gate = widget.querySelector('.presave-social-gate');
        const unlock = gate.querySelector('.gate-unlock');
        
        gate.style.display = 'none';
        unlock.style.display = 'block';
        
        // Show platform buttons
        const platforms = widget.querySelector('.presave-platforms');
        platforms.style.opacity = '1';
        platforms.style.pointerEvents = 'auto';
    }

    // Handle sharing
    handleShare(platform, config) {
        const text = `Check out "${config.title}" by ${config.artist} - Pre-save now!`;
        const url = window.location.href;
        
        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
        };
        
        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }

    // Start countdown timer
    startCountdown(container) {
        const countdown = container.querySelector('.presave-countdown');
        if (!countdown || countdown.classList.contains('released')) return;
        
        const releaseDate = new Date(countdown.dataset.releaseDate);
        
        const updateTimer = () => {
            const now = new Date();
            const diff = releaseDate - now;
            
            if (diff <= 0) {
                countdown.innerHTML = '<div class="countdown-message">🎉 Out Now!</div>';
                countdown.classList.add('released');
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            countdown.querySelector('[data-unit="days"]').textContent = days.toString().padStart(2, '0');
            countdown.querySelector('[data-unit="hours"]').textContent = hours.toString().padStart(2, '0');
            countdown.querySelector('[data-unit="minutes"]').textContent = minutes.toString().padStart(2, '0');
            countdown.querySelector('[data-unit="seconds"]').textContent = seconds.toString().padStart(2, '0');
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        
        // Store interval for cleanup
        countdown.dataset.intervalId = interval;
    }

    // Show success message
    showSuccessMessage(widgetId, platform) {
        const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
        
        const successDiv = document.createElement('div');
        successDiv.className = 'presave-success';
        successDiv.innerHTML = `
            <div class="success-message">
                ✅ Great! You'll be notified when it's available on ${platform}!
            </div>
        `;
        
        widget.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showError(message) {
        alert(message); // Replace with better error handling
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    generateWidgetId() {
        return `presave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Setup global event listeners
    setupEventListeners() {
        // Listen for pre-save widget creation
        document.addEventListener('createPreSaveWidget', (e) => {
            this.createPreSaveWidget(e.detail.container, e.detail.config);
        });
    }

    // Get widget analytics
    getWidgetAnalytics(widgetId) {
        // Return analytics for specific widget
        return {
            widgetId,
            // This would come from backend in real implementation
            views: 0,
            presaves: 0,
            emails: 0,
            shares: 0
        };
    }
}

// Initialize Pre-Save Widget Manager
window.preSaveManager = new PreSaveWidgetManager();

// Helper function for quick widget creation
window.createPreSaveWidget = function(containerId, config) {
    return window.preSaveManager.createPreSaveWidget(containerId, config);
};

// Add CSS styles
const styles = `
.presave-widget {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 400px;
    margin: 0 auto;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    background: #fff;
}

.presave-dark {
    background: #1a1a1a;
    color: #fff;
}

.presave-header {
    padding: 24px 24px 16px;
    text-align: center;
}

.presave-badge {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 16px;
}

.presave-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
    color: inherit;
}

.presave-message {
    color: #666;
    font-size: 14px;
    line-height: 1.4;
}

.presave-dark .presave-message {
    color: #ccc;
}

.presave-artwork {
    position: relative;
    padding: 0 24px 16px;
}

.album-cover {
    width: 100%;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.play-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 0.3s;
}

.presave-artwork:hover .play-overlay {
    opacity: 1;
}

.play-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255,255,255,0.9);
    border: none;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.presave-info {
    padding: 0 24px 16px;
    text-align: center;
}

.track-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
    color: inherit;
}

.artist-name {
    font-size: 16px;
    color: #666;
    margin-bottom: 8px;
}

.presave-dark .artist-name {
    color: #ccc;
}

.release-date {
    font-size: 14px;
    color: #999;
}

.presave-countdown {
    padding: 16px 24px;
    text-align: center;
}

.countdown-timer {
    display: flex;
    gap: 16px;
    justify-content: center;
}

.time-unit {
    text-align: center;
}

.time-value {
    display: block;
    font-size: 32px;
    font-weight: 700;
    color: #E50914;
}

.time-label {
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.presave-dark .time-label {
    color: #ccc;
}

.countdown-message {
    font-size: 24px;
    font-weight: 700;
    color: #10B981;
    margin: 16px 0;
}

.presave-platforms {
    padding: 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.presave-platform-btn {
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.3s;
}

.presave-platform-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.presave-email-capture {
    padding: 16px 24px;
    border-top: 1px solid #eee;
    text-align: center;
}

.presave-dark .presave-email-capture {
    border-color: #333;
}

.email-form {
    display: flex;
    gap: 8px;
    margin: 16px 0;
}

.email-input {
    flex: 1;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
}

.presave-dark .email-input {
    background: #333;
    border-color: #555;
    color: white;
}

.email-submit-btn {
    padding: 12px 24px;
    background: #E50914;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.email-disclaimer {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
}

.presave-social-gate {
    padding: 16px 24px;
    border-top: 1px solid #eee;
    text-align: center;
}

.presave-dark .presave-social-gate {
    border-color: #333;
}

.social-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 16px 0;
}

.social-btn {
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
}

.social-btn:hover {
    background: #f5f5f5;
    border-color: #E50914;
}

.presave-footer {
    padding: 16px 24px;
    border-top: 1px solid #eee;
    text-align: center;
}

.presave-dark .presave-footer {
    border-color: #333;
}

.share-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 12px;
}

.share-btn {
    padding: 8px 16px;
    background: #f5f5f5;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s;
}

.share-btn:hover {
    background: #e5e5e5;
}

.powered-by {
    font-size: 12px;
    color: #999;
}

.presave-success {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10B981;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

@media (max-width: 480px) {
    .presave-widget {
        margin: 0 16px;
        max-width: none;
    }
    
    .countdown-timer {
        gap: 8px;
    }
    
    .time-value {
        font-size: 24px;
    }
    
    .email-form {
        flex-direction: column;
    }
    
    .share-buttons {
        flex-direction: column;
    }
}
`;

// Add styles to page
if (!document.getElementById('presave-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'presave-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

console.log('✅ PreSave Widget Manager initialized');
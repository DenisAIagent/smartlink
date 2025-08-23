/**
 * Redirect Engine - Intelligence routing for SmartLinks
 * Optimized for Edge Functions with device detection and geo-targeting
 */

import UAParser from 'ua-parser-js';

/**
 * SmartLink Redirect Engine
 * Determines the best platform based on user device, location, and preferences
 */
export class RedirectEngine {
	constructor() {
		this.parser = new UAParser();
		
		// Platform priority matrix by device type
		this.platformPriority = {
			mobile: {
				ios: ['Apple Music', 'Spotify', 'YouTube Music', 'Deezer', 'SoundCloud'],
				android: ['Spotify', 'YouTube Music', 'Deezer', 'SoundCloud', 'Amazon Music'],
				other: ['Spotify', 'YouTube Music', 'SoundCloud', 'Deezer']
			},
			tablet: {
				ios: ['Apple Music', 'Spotify', 'YouTube Music'],
				android: ['Spotify', 'YouTube Music', 'Deezer'],
				other: ['Spotify', 'YouTube Music', 'SoundCloud']
			},
			desktop: {
				all: ['Spotify', 'YouTube Music', 'Apple Music', 'Deezer', 'SoundCloud', 'Bandcamp']
			}
		};

		// Regional preferences (for French market focus)
		this.regionalPreferences = {
			FR: ['Deezer', 'Spotify', 'Apple Music', 'YouTube Music'], // Deezer is French
			BE: ['Spotify', 'Deezer', 'Apple Music', 'YouTube Music'],
			CH: ['Spotify', 'Apple Music', 'Deezer', 'YouTube Music'],
			CA: ['Spotify', 'Apple Music', 'YouTube Music', 'Deezer'], // Quebec French market
			default: ['Spotify', 'Apple Music', 'YouTube Music', 'Deezer', 'SoundCloud']
		};
	}

	/**
	 * Get the best redirect URL for a user
	 * @param {Object} smartLink - SmartLink data
	 * @param {Object} context - Request context (headers, IP, etc.)
	 * @returns {Object} Redirect decision
	 */
	getBestRedirect(smartLink, context = {}) {
		// Parse user agent
		const userAgent = context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
		this.parser.setUA(userAgent);
		const device = this.parser.getResult();

		// Determine device info
		const deviceInfo = this.getDeviceInfo(device, userAgent);
		
		// Get user preferences from URL parameters or cookies
		const preferences = this.getUserPreferences(context);
		
		// Get geographic info
		const geoInfo = this.getGeographicInfo(context);
		
		// Find best platform match
		const bestPlatform = this.findBestPlatform(
			smartLink.platforms,
			deviceInfo,
			geoInfo,
			preferences
		);

		return {
			platform: bestPlatform,
			url: bestPlatform?.url || this.getFallbackUrl(smartLink),
			deviceInfo,
			geoInfo,
			confidence: bestPlatform?.confidence || 0
		};
	}

	/**
	 * Extract device information
	 * @param {Object} device - Parsed device info
	 * @param {string} userAgent - Raw user agent
	 * @returns {Object} Device information
	 */
	getDeviceInfo(device, userAgent) {
		const ua = userAgent.toLowerCase();
		
		let deviceType = 'desktop';
		let platform = 'other';
		
		// Determine device type
		if (device.device?.type === 'mobile' || ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
			deviceType = 'mobile';
		} else if (device.device?.type === 'tablet' || ua.includes('tablet') || ua.includes('ipad')) {
			deviceType = 'tablet';
		}
		
		// Determine platform
		if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') || device.os?.name === 'iOS') {
			platform = 'ios';
		} else if (ua.includes('android') || device.os?.name === 'Android') {
			platform = 'android';
		} else if (ua.includes('windows') || device.os?.name === 'Windows') {
			platform = 'windows';
		} else if (ua.includes('mac') || device.os?.name === 'Mac OS') {
			platform = 'macos';
		} else if (ua.includes('linux') || device.os?.name === 'Linux') {
			platform = 'linux';
		}

		return {
			type: deviceType,
			platform,
			os: device.os?.name || 'Unknown',
			osVersion: device.os?.version || 'Unknown',
			browser: device.browser?.name || 'Unknown',
			browserVersion: device.browser?.version || 'Unknown'
		};
	}

	/**
	 * Extract geographic information
	 * @param {Object} context - Request context
	 * @returns {Object} Geographic information
	 */
	getGeographicInfo(context) {
		// In a real Edge Function, you'd get this from request headers
		const country = context.country || 
			context.headers?.['cf-ipcountry'] || 
			context.headers?.['x-country-code'] || 
			'FR'; // Default to France for French market

		const region = context.region || context.headers?.['cf-region'] || '';
		const city = context.city || context.headers?.['cf-city'] || '';

		return { country, region, city };
	}

	/**
	 * Get user preferences from URL parameters or context
	 * @param {Object} context - Request context
	 * @returns {Object} User preferences
	 */
	getUserPreferences(context) {
		const preferences = {
			preferredPlatform: null,
			language: 'fr',
			previousChoice: null
		};

		// Extract from URL parameters
		if (context.url) {
			try {
				const url = new URL(context.url);
				preferences.preferredPlatform = url.searchParams.get('platform');
				preferences.language = url.searchParams.get('lang') || 'fr';
			} catch (error) {
				console.warn('Invalid URL for preferences extraction');
			}
		}

		// Extract from cookies (if available)
		if (context.cookies) {
			preferences.previousChoice = context.cookies['smartlink_preference'];
		}

		// Extract from Accept-Language header
		if (context.headers?.['accept-language']) {
			const lang = context.headers['accept-language'].split(',')[0].split('-')[0];
			preferences.language = lang || 'fr';
		}

		return preferences;
	}

	/**
	 * Find the best platform match
	 * @param {Array} availablePlatforms - Platforms configured for the SmartLink
	 * @param {Object} deviceInfo - Device information
	 * @param {Object} geoInfo - Geographic information
	 * @param {Object} preferences - User preferences
	 * @returns {Object|null} Best platform match
	 */
	findBestPlatform(availablePlatforms, deviceInfo, geoInfo, preferences) {
		if (!availablePlatforms || availablePlatforms.length === 0) {
			return null;
		}

		// If user has a specific preference, honor it
		if (preferences.preferredPlatform) {
			const preferredPlatform = availablePlatforms.find(
				p => p.name.toLowerCase() === preferences.preferredPlatform.toLowerCase()
			);
			if (preferredPlatform) {
				return { ...preferredPlatform, confidence: 1.0, reason: 'user_preference' };
			}
		}

		// Calculate scores for each platform
		const scoredPlatforms = availablePlatforms.map(platform => ({
			...platform,
			score: this.calculatePlatformScore(platform, deviceInfo, geoInfo, preferences),
			confidence: 0
		}));

		// Sort by score
		scoredPlatforms.sort((a, b) => b.score - a.score);

		const bestPlatform = scoredPlatforms[0];
		if (bestPlatform) {
			bestPlatform.confidence = this.calculateConfidence(bestPlatform.score, scoredPlatforms);
			bestPlatform.reason = this.getScoreReason(bestPlatform, deviceInfo, geoInfo);
		}

		return bestPlatform;
	}

	/**
	 * Calculate platform score based on multiple factors
	 * @param {Object} platform - Platform data
	 * @param {Object} deviceInfo - Device information
	 * @param {Object} geoInfo - Geographic information
	 * @param {Object} preferences - User preferences
	 * @returns {number} Platform score (0-100)
	 */
	calculatePlatformScore(platform, deviceInfo, geoInfo, preferences) {
		let score = 0;

		// Base availability score
		if (platform.url && platform.url.trim()) {
			score += 10;
		} else {
			return 0; // No URL, not usable
		}

		// Device type compatibility
		const devicePriority = this.getDevicePriority(deviceInfo);
		const platformIndex = devicePriority.indexOf(platform.name);
		if (platformIndex !== -1) {
			score += Math.max(0, 30 - (platformIndex * 5)); // Higher score for earlier in priority
		}

		// Regional preferences
		const regionalPriority = this.regionalPreferences[geoInfo.country] || this.regionalPreferences.default;
		const regionalIndex = regionalPriority.indexOf(platform.name);
		if (regionalIndex !== -1) {
			score += Math.max(0, 20 - (regionalIndex * 3));
		}

		// Platform-specific device optimization
		if (this.isPlatformOptimalForDevice(platform.name, deviceInfo)) {
			score += 15;
		}

		// Previous user choice (loyalty bonus)
		if (preferences.previousChoice === platform.name) {
			score += 10;
		}

		// Platform market share in target region (simplified)
		score += this.getMarketShareBonus(platform.name, geoInfo.country);

		// Ensure score is within bounds
		return Math.max(0, Math.min(100, score));
	}

	/**
	 * Get device priority list
	 * @param {Object} deviceInfo - Device information
	 * @returns {Array} Priority list of platforms
	 */
	getDevicePriority(deviceInfo) {
		if (deviceInfo.type === 'desktop') {
			return this.platformPriority.desktop.all;
		}

		const devicePlatforms = this.platformPriority[deviceInfo.type];
		if (!devicePlatforms) {
			return this.platformPriority.mobile.other;
		}

		return devicePlatforms[deviceInfo.platform] || devicePlatforms.other || [];
	}

	/**
	 * Check if platform is optimal for device
	 * @param {string} platformName - Platform name
	 * @param {Object} deviceInfo - Device information
	 * @returns {boolean} Is optimal
	 */
	isPlatformOptimalForDevice(platformName, deviceInfo) {
		// iOS devices - Apple Music is native
		if (deviceInfo.platform === 'ios' && platformName === 'Apple Music') {
			return true;
		}

		// Android devices - Google Play Music / YouTube Music integration
		if (deviceInfo.platform === 'android' && 
			(platformName === 'YouTube Music' || platformName === 'Google Play Music')) {
			return true;
		}

		// Desktop - Spotify has good web player
		if (deviceInfo.type === 'desktop' && platformName === 'Spotify') {
			return true;
		}

		return false;
	}

	/**
	 * Get market share bonus for platform in region
	 * @param {string} platformName - Platform name
	 * @param {string} country - Country code
	 * @returns {number} Bonus points
	 */
	getMarketShareBonus(platformName, country) {
		// Simplified market share data (you'd use real data in production)
		const marketShare = {
			FR: {
				'Deezer': 5,     // Strong in France
				'Spotify': 4,
				'Apple Music': 3,
				'YouTube Music': 2
			},
			US: {
				'Spotify': 5,
				'Apple Music': 4,
				'YouTube Music': 3,
				'Amazon Music': 2
			},
			default: {
				'Spotify': 4,
				'Apple Music': 3,
				'YouTube Music': 3,
				'Deezer': 2
			}
		};

		const countryData = marketShare[country] || marketShare.default;
		return countryData[platformName] || 1;
	}

	/**
	 * Calculate confidence score
	 * @param {number} bestScore - Best platform score
	 * @param {Array} allPlatforms - All scored platforms
	 * @returns {number} Confidence (0-1)
	 */
	calculateConfidence(bestScore, allPlatforms) {
		if (allPlatforms.length <= 1) return 1.0;

		const secondBestScore = allPlatforms[1]?.score || 0;
		const scoreDifference = bestScore - secondBestScore;
		
		// Higher difference = higher confidence
		return Math.min(1.0, Math.max(0.5, scoreDifference / 30));
	}

	/**
	 * Get reason for the platform choice
	 * @param {Object} platform - Chosen platform
	 * @param {Object} deviceInfo - Device information
	 * @param {Object} geoInfo - Geographic information
	 * @returns {string} Reason
	 */
	getScoreReason(platform, deviceInfo, geoInfo) {
		if (this.isPlatformOptimalForDevice(platform.name, deviceInfo)) {
			return 'device_optimization';
		}

		const regionalPriority = this.regionalPreferences[geoInfo.country];
		if (regionalPriority && regionalPriority[0] === platform.name) {
			return 'regional_preference';
		}

		const devicePriority = this.getDevicePriority(deviceInfo);
		if (devicePriority[0] === platform.name) {
			return 'device_priority';
		}

		return 'general_ranking';
	}

	/**
	 * Get fallback URL when no platforms are available
	 * @param {Object} smartLink - SmartLink data
	 * @returns {string} Fallback URL
	 */
	getFallbackUrl(smartLink) {
		// Return to SmartLink page or a search URL
		const searchQuery = encodeURIComponent(`${smartLink.artist} ${smartLink.title}`);
		return `https://www.google.com/search?q=${searchQuery}`;
	}

	/**
	 * Generate redirect analytics data
	 * @param {Object} decision - Redirect decision
	 * @returns {Object} Analytics data
	 */
	getRedirectAnalytics(decision) {
		return {
			selectedPlatform: decision.platform?.name || 'none',
			confidence: decision.confidence,
			reason: decision.platform?.reason || 'no_platform',
			deviceType: decision.deviceInfo?.type,
			devicePlatform: decision.deviceInfo?.platform,
			country: decision.geoInfo?.country,
			timestamp: new Date().toISOString()
		};
	}
}

// Export singleton instance
export const redirectEngine = new RedirectEngine();
export default redirectEngine;
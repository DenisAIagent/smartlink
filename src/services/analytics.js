/**
 * Analytics Service
 * Advanced tracking system for SmartLinks with comprehensive analytics
 */

import {
	collection,
	doc,
	addDoc,
	getDocs,
	query,
	where,
	orderBy,
	limit,
	startAt,
	endAt,
	serverTimestamp,
	Timestamp
} from 'firebase/firestore';
import { db, FIREBASE_CONFIG } from '$lib/firebase.js';
import UAParser from 'ua-parser-js';

class AnalyticsService {
	constructor() {
		this.collection = FIREBASE_CONFIG.COLLECTIONS.ANALYTICS;
		this.parser = new UAParser();
	}

	/**
	 * Track SmartLink click
	 * @param {string} smartLinkId
	 * @param {string} slug
	 * @param {Object} context
	 * @returns {Promise<void>}
	 */
	async trackClick(smartLinkId, slug, context = {}) {
		try {
			// Parse user agent
			this.parser.setUA(context.userAgent || navigator.userAgent);
			const device = this.parser.getResult();

			// Get geolocation (you might want to use a geolocation service)
			const location = await this.getLocationData(context.ip);

			// Create analytics record
			const analyticsData = {
				smartLinkId,
				slug,
				timestamp: serverTimestamp(),
				
				// Device information
				device: {
					type: this.getDeviceType(device),
					os: device.os.name || 'Unknown',
					osVersion: device.os.version || 'Unknown',
					browser: device.browser.name || 'Unknown',
					browserVersion: device.browser.version || 'Unknown'
				},
				
				// Location data
				location: {
					country: location.country || 'Unknown',
					countryCode: location.countryCode || 'XX',
					region: location.region || 'Unknown',
					city: location.city || 'Unknown',
					timezone: location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
				},
				
				// Referrer information
				referrer: {
					url: context.referrer || document.referrer || 'Direct',
					domain: this.extractDomain(context.referrer || document.referrer),
					source: this.categorizeReferrer(context.referrer || document.referrer)
				},
				
				// Additional context
				sessionId: context.sessionId || this.generateSessionId(),
				utmParams: this.extractUTMParams(context.url || window.location.href),
				
				// Technical data
				screenResolution: `${screen.width}x${screen.height}`,
				language: navigator.language || 'Unknown'
			};

			// Save to Firestore
			await addDoc(collection(db, this.collection), analyticsData);
			
		} catch (error) {
			console.error('Track click error:', error);
		}
	}

	/**
	 * Track platform click
	 * @param {string} smartLinkId
	 * @param {string} platform
	 * @param {string} url
	 * @param {Object} context
	 * @returns {Promise<void>}
	 */
	async trackPlatformClick(smartLinkId, platform, url, context = {}) {
		try {
			// Parse user agent
			this.parser.setUA(context.userAgent || navigator.userAgent);
			const device = this.parser.getResult();

			// Get location data
			const location = await this.getLocationData(context.ip);

			const analyticsData = {
				smartLinkId,
				platform,
				destinationUrl: url,
				timestamp: serverTimestamp(),
				
				device: {
					type: this.getDeviceType(device),
					os: device.os.name || 'Unknown',
					browser: device.browser.name || 'Unknown'
				},
				
				location: {
					country: location.country || 'Unknown',
					countryCode: location.countryCode || 'XX'
				},
				
				sessionId: context.sessionId || this.generateSessionId()
			};

			await addDoc(collection(db, this.collection), analyticsData);
		} catch (error) {
			console.error('Track platform click error:', error);
		}
	}

	/**
	 * Get SmartLink analytics
	 * @param {string} smartLinkId
	 * @param {Object} options
	 * @returns {Promise<Object>}
	 */
	async getSmartLinkAnalytics(smartLinkId, options = {}) {
		try {
			const {
				startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
				endDate = new Date(),
				groupBy = 'day'
			} = options;

			// Create query
			const q = query(
				collection(db, this.collection),
				where('smartLinkId', '==', smartLinkId),
				where('timestamp', '>=', Timestamp.fromDate(startDate)),
				where('timestamp', '<=', Timestamp.fromDate(endDate)),
				orderBy('timestamp', 'desc')
			);

			const querySnapshot = await getDocs(q);
			const rawData = [];

			querySnapshot.forEach((doc) => {
				rawData.push({ id: doc.id, ...doc.data() });
			});

			// Process analytics data
			return this.processAnalyticsData(rawData, groupBy);
		} catch (error) {
			console.error('Get SmartLink analytics error:', error);
			return null;
		}
	}

	/**
	 * Get user analytics overview
	 * @param {string} userId
	 * @param {Object} options
	 * @returns {Promise<Object>}
	 */
	async getUserAnalytics(userId, options = {}) {
		try {
			// This would require a compound query or denormalization
			// For now, we'll implement a simplified version
			
			const {
				startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				endDate = new Date()
			} = options;

			// Get user's SmartLinks first
			const smartLinksQuery = query(
				collection(db, FIREBASE_CONFIG.COLLECTIONS.SMARTLINKS),
				where('userId', '==', userId)
			);

			const smartLinksSnapshot = await getDocs(smartLinksQuery);
			const smartLinkIds = smartLinksSnapshot.docs.map(doc => doc.id);

			if (smartLinkIds.length === 0) {
				return this.getEmptyAnalytics();
			}

			// For each SmartLink, get analytics (this could be optimized with batch queries)
			const allAnalytics = [];
			
			for (const smartLinkId of smartLinkIds) {
				const analytics = await this.getSmartLinkAnalytics(smartLinkId, { startDate, endDate });
				if (analytics) {
					allAnalytics.push({ smartLinkId, ...analytics });
				}
			}

			return this.aggregateUserAnalytics(allAnalytics);
		} catch (error) {
			console.error('Get user analytics error:', error);
			return this.getEmptyAnalytics();
		}
	}

	/**
	 * Process raw analytics data
	 * @param {Array} rawData
	 * @param {string} groupBy
	 * @returns {Object}
	 */
	processAnalyticsData(rawData, groupBy) {
		const analytics = {
			totalClicks: rawData.length,
			uniqueVisitors: new Set(rawData.map(d => d.sessionId)).size,
			
			// Time series data
			timeSeries: this.groupDataByTime(rawData, groupBy),
			
			// Geographic data
			countries: this.groupDataBy(rawData, 'location.country'),
			regions: this.groupDataBy(rawData, 'location.region'),
			
			// Device data
			devices: this.groupDataBy(rawData, 'device.type'),
			browsers: this.groupDataBy(rawData, 'device.browser'),
			operatingSystems: this.groupDataBy(rawData, 'device.os'),
			
			// Traffic sources
			referrers: this.groupDataBy(rawData, 'referrer.source'),
			
			// Platform clicks (if available)
			platforms: this.groupDataBy(rawData.filter(d => d.platform), 'platform'),
			
			// Peak hours
			hours: this.groupDataByHour(rawData),
			
			// UTM tracking
			utmSources: this.groupDataBy(rawData, 'utmParams.source'),
			utmMediums: this.groupDataBy(rawData, 'utmParams.medium'),
			utmCampaigns: this.groupDataBy(rawData, 'utmParams.campaign')
		};

		return analytics;
	}

	/**
	 * Group data by time period
	 * @param {Array} data
	 * @param {string} period
	 * @returns {Array}
	 */
	groupDataByTime(data, period) {
		const groups = {};
		
		data.forEach(item => {
			const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
			let key;
			
			switch (period) {
				case 'hour':
					key = date.toISOString().substring(0, 13);
					break;
				case 'day':
					key = date.toISOString().substring(0, 10);
					break;
				case 'week':
					const weekStart = new Date(date);
					weekStart.setDate(date.getDate() - date.getDay());
					key = weekStart.toISOString().substring(0, 10);
					break;
				case 'month':
					key = date.toISOString().substring(0, 7);
					break;
				default:
					key = date.toISOString().substring(0, 10);
			}
			
			if (!groups[key]) {
				groups[key] = { date: key, clicks: 0, uniqueVisitors: new Set() };
			}
			
			groups[key].clicks++;
			groups[key].uniqueVisitors.add(item.sessionId);
		});
		
		// Convert to array and finalize unique visitors count
		return Object.values(groups)
			.map(group => ({
				...group,
				uniqueVisitors: group.uniqueVisitors.size
			}))
			.sort((a, b) => a.date.localeCompare(b.date));
	}

	/**
	 * Group data by specific field
	 * @param {Array} data
	 * @param {string} field
	 * @returns {Array}
	 */
	groupDataBy(data, field) {
		const groups = {};
		
		data.forEach(item => {
			const value = this.getNestedProperty(item, field) || 'Unknown';
			
			if (!groups[value]) {
				groups[value] = { name: value, count: 0 };
			}
			
			groups[value].count++;
		});
		
		return Object.values(groups)
			.sort((a, b) => b.count - a.count)
			.slice(0, 10); // Top 10
	}

	/**
	 * Group data by hour of day
	 * @param {Array} data
	 * @returns {Array}
	 */
	groupDataByHour(data) {
		const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, clicks: 0 }));
		
		data.forEach(item => {
			const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
			hours[date.getHours()].clicks++;
		});
		
		return hours;
	}

	/**
	 * Get nested property value
	 * @param {Object} obj
	 * @param {string} path
	 * @returns {any}
	 */
	getNestedProperty(obj, path) {
		return path.split('.').reduce((current, key) => current && current[key], obj);
	}

	/**
	 * Determine device type
	 * @param {Object} device
	 * @returns {string}
	 */
	getDeviceType(device) {
		if (device.device?.type) {
			return device.device.type;
		}
		
		const ua = device.ua?.toLowerCase() || '';
		
		if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
			return 'mobile';
		}
		if (ua.includes('tablet') || ua.includes('ipad')) {
			return 'tablet';
		}
		
		return 'desktop';
	}

	/**
	 * Extract domain from URL
	 * @param {string} url
	 * @returns {string}
	 */
	extractDomain(url) {
		if (!url) return 'Direct';
		
		try {
			const urlObj = new URL(url);
			return urlObj.hostname.replace('www.', '');
		} catch {
			return 'Unknown';
		}
	}

	/**
	 * Categorize referrer source
	 * @param {string} referrer
	 * @returns {string}
	 */
	categorizeReferrer(referrer) {
		if (!referrer) return 'Direct';
		
		const domain = this.extractDomain(referrer).toLowerCase();
		
		// Social media
		const socialDomains = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 'linkedin.com', 'youtube.com'];
		if (socialDomains.some(social => domain.includes(social))) {
			return 'Social Media';
		}
		
		// Search engines
		const searchDomains = ['google', 'bing', 'yahoo', 'duckduckgo', 'qwant'];
		if (searchDomains.some(search => domain.includes(search))) {
			return 'Search Engine';
		}
		
		// Music platforms
		const musicDomains = ['spotify.com', 'music.apple.com', 'youtube.com', 'soundcloud.com', 'deezer.com'];
		if (musicDomains.some(music => domain.includes(music))) {
			return 'Music Platform';
		}
		
		return 'Referral';
	}

	/**
	 * Extract UTM parameters
	 * @param {string} url
	 * @returns {Object}
	 */
	extractUTMParams(url) {
		if (!url) return {};
		
		try {
			const urlObj = new URL(url);
			const params = urlObj.searchParams;
			
			return {
				source: params.get('utm_source') || null,
				medium: params.get('utm_medium') || null,
				campaign: params.get('utm_campaign') || null,
				term: params.get('utm_term') || null,
				content: params.get('utm_content') || null
			};
		} catch {
			return {};
		}
	}

	/**
	 * Generate session ID
	 * @returns {string}
	 */
	generateSessionId() {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
	}

	/**
	 * Get location data (placeholder - you'd integrate with a geolocation service)
	 * @param {string} ip
	 * @returns {Promise<Object>}
	 */
	async getLocationData(ip) {
		try {
			// In a real implementation, you'd call a geolocation API
			// For now, return default French data or browser timezone
			const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			const language = navigator.language || 'fr-FR';
			
			return {
				country: 'France',
				countryCode: 'FR',
				region: 'Île-de-France',
				city: 'Paris',
				timezone: timezone
			};
		} catch (error) {
			return {
				country: 'Unknown',
				countryCode: 'XX',
				region: 'Unknown',
				city: 'Unknown',
				timezone: 'UTC'
			};
		}
	}

	/**
	 * Aggregate user analytics from multiple SmartLinks
	 * @param {Array} allAnalytics
	 * @returns {Object}
	 */
	aggregateUserAnalytics(allAnalytics) {
		if (allAnalytics.length === 0) {
			return this.getEmptyAnalytics();
		}

		const aggregated = {
			totalClicks: 0,
			uniqueVisitors: 0,
			smartLinksCount: allAnalytics.length,
			timeSeries: {},
			countries: {},
			devices: {},
			browsers: {},
			referrers: {},
			platforms: {}
		};

		allAnalytics.forEach(analytics => {
			aggregated.totalClicks += analytics.totalClicks || 0;
			aggregated.uniqueVisitors += analytics.uniqueVisitors || 0;
			
			// Merge time series
			analytics.timeSeries?.forEach(point => {
				if (!aggregated.timeSeries[point.date]) {
					aggregated.timeSeries[point.date] = { date: point.date, clicks: 0, uniqueVisitors: 0 };
				}
				aggregated.timeSeries[point.date].clicks += point.clicks;
				aggregated.timeSeries[point.date].uniqueVisitors += point.uniqueVisitors;
			});
			
			// Merge other metrics (simplified)
			['countries', 'devices', 'browsers', 'referrers', 'platforms'].forEach(metric => {
				analytics[metric]?.forEach(item => {
					if (!aggregated[metric][item.name]) {
						aggregated[metric][item.name] = { name: item.name, count: 0 };
					}
					aggregated[metric][item.name].count += item.count;
				});
			});
		});

		// Convert objects back to arrays
		Object.keys(aggregated).forEach(key => {
			if (typeof aggregated[key] === 'object' && !Array.isArray(aggregated[key]) && key !== 'timeSeries') {
				aggregated[key] = Object.values(aggregated[key]).sort((a, b) => b.count - a.count).slice(0, 10);
			}
		});

		aggregated.timeSeries = Object.values(aggregated.timeSeries).sort((a, b) => a.date.localeCompare(b.date));

		return aggregated;
	}

	/**
	 * Get empty analytics structure
	 * @returns {Object}
	 */
	getEmptyAnalytics() {
		return {
			totalClicks: 0,
			uniqueVisitors: 0,
			smartLinksCount: 0,
			timeSeries: [],
			countries: [],
			devices: [],
			browsers: [],
			referrers: [],
			platforms: [],
			hours: Array.from({ length: 24 }, (_, i) => ({ hour: i, clicks: 0 }))
		};
	}
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
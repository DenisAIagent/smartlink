/**
 * Client-side hooks for SmartLink application
 * Handles client-side error handling, navigation guards, and performance monitoring
 */

import { goto } from '$app/navigation';
import { notifications } from './stores/ui.js';

/**
 * Performance monitoring
 */
function initPerformanceMonitoring() {
	if (typeof window === 'undefined') return;
	
	// Web Vitals monitoring
	try {
		// Cumulative Layout Shift (CLS)
		let clsScore = 0;
		const observer = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				if (!entry.hadRecentInput) {
					clsScore += entry.value;
				}
			}
		});
		observer.observe({ entryTypes: ['layout-shift'] });
		
		// First Contentful Paint (FCP) and Largest Contentful Paint (LCP)
		window.addEventListener('load', () => {
			// Report Web Vitals after page load
			setTimeout(() => {
				const navigation = performance.getEntriesByType('navigation')[0];
				if (navigation) {
					const metrics = {
						loadTime: navigation.loadEventEnd - navigation.loadEventStart,
						domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
						firstByte: navigation.responseStart - navigation.requestStart,
						cls: clsScore
					};
					
					// In production, send to analytics
					if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
						console.log('Performance metrics:', metrics);
						// sendToAnalytics(metrics);
					}
				}
			}, 1000);
		});
		
	} catch (error) {
		console.warn('Performance monitoring failed:', error);
	}
}

/**
 * Initialize error tracking
 */
function initErrorTracking() {
	if (typeof window === 'undefined') return;
	
	// Global error handler
	window.addEventListener('error', (event) => {
		const error = {
			message: event.message,
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
			stack: event.error?.stack,
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href
		};
		
		console.error('Global error:', error);
		
		// In production, send to error tracking service
		if (import.meta.env.PROD) {
			// sendErrorToService(error);
		}
	});
	
	// Unhandled promise rejection handler
	window.addEventListener('unhandledrejection', (event) => {
		const error = {
			message: event.reason?.message || 'Unhandled promise rejection',
			stack: event.reason?.stack,
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href
		};
		
		console.error('Unhandled promise rejection:', error);
		
		// In production, send to error tracking service
		if (import.meta.env.PROD) {
			// sendErrorToService(error);
		}
	});
}

/**
 * Initialize offline detection
 */
function initOfflineDetection() {
	if (typeof window === 'undefined') return;
	
	function updateOnlineStatus() {
		if (!navigator.onLine) {
			notifications.warning('Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.', {
				duration: 10000
			});
		} else {
			// User came back online
			const wasOffline = localStorage.getItem('smartlink-was-offline');
			if (wasOffline) {
				notifications.success('Connexion rétablie !');
				localStorage.removeItem('smartlink-was-offline');
			}
		}
		
		localStorage.setItem('smartlink-was-offline', navigator.onLine ? '' : 'true');
	}
	
	window.addEventListener('online', updateOnlineStatus);
	window.addEventListener('offline', updateOnlineStatus);
	
	// Check initial state
	updateOnlineStatus();
}

/**
 * Initialize session timeout
 */
function initSessionTimeout() {
	if (typeof window === 'undefined') return;
	
	const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
	let sessionTimer;
	
	function resetSessionTimer() {
		clearTimeout(sessionTimer);
		sessionTimer = setTimeout(() => {
			notifications.warning('Votre session va expirer dans 5 minutes.', {
				duration: 10000
			});
			
			// Give user 5 more minutes before actual logout
			setTimeout(() => {
				notifications.error('Session expirée. Veuillez vous reconnecter.');
				goto('/login');
			}, 5 * 60 * 1000);
		}, SESSION_TIMEOUT);
	}
	
	// Reset timer on user activity
	['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
		document.addEventListener(event, resetSessionTimer, true);
	});
	
	// Initial timer
	resetSessionTimer();
}

/**
 * Initialize PWA update detection
 */
function initPWAUpdates() {
	if (typeof window === 'undefined') return;
	
	// Check for service worker updates
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.ready.then(registration => {
			registration.addEventListener('updatefound', () => {
				const newWorker = registration.installing;
				
				newWorker.addEventListener('statechange', () => {
					if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
						// New version available
						notifications.info('Une nouvelle version est disponible.', {
							duration: 0, // Don't auto-dismiss
							action: {
								label: 'Actualiser',
								handler: () => {
									window.location.reload();
								}
							}
						});
					}
				});
			});
		});
	}
}

/**
 * Handle client-side errors
 */
/** @type {import('@sveltejs/kit').HandleClientError} */
export async function handleError({ error, event }) {
	const errorId = crypto.randomUUID();
	
	// Log error details
	console.error(`Client Error ${errorId}:`, {
		error: error.message,
		stack: error.stack,
		url: event.url?.toString() || window?.location?.href,
		userAgent: navigator?.userAgent,
		timestamp: new Date().toISOString()
	});
	
	// Show user-friendly error message
	if (typeof window !== 'undefined') {
		notifications.error('Une erreur est survenue. Veuillez réessayer.', {
			duration: 5000
		});
	}
	
	// In production, send to error tracking service
	if (import.meta.env.PROD) {
		try {
			// sendErrorToService({
			//   errorId,
			//   message: error.message,
			//   stack: error.stack,
			//   url: event.url?.toString(),
			//   timestamp: new Date().toISOString()
			// });
		} catch (trackingError) {
			console.warn('Failed to send error to tracking service:', trackingError);
		}
	}
	
	return {
		message: 'Une erreur inattendue s\'est produite',
		errorId
	};
}

/**
 * Initialize all client-side functionality
 */
if (typeof window !== 'undefined') {
	// Wait for DOM to be ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
	
	function init() {
		initPerformanceMonitoring();
		initErrorTracking();
		initOfflineDetection();
		initSessionTimeout();
		initPWAUpdates();
		
		// Analytics initialization (if enabled)
		if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
			// initAnalytics();
		}
		
		// Development helpers
		if (import.meta.env.DEV) {
			// Add development console helpers
			window.SmartLinkDebug = {
				clearStorage: () => {
					localStorage.clear();
					sessionStorage.clear();
					location.reload();
				},
				showPerformance: () => {
					console.table(performance.getEntriesByType('navigation'));
				}
			};
			
			console.log('SmartLink Debug tools available at window.SmartLinkDebug');
		}
	}
}
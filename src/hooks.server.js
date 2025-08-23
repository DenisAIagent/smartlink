/**
 * Server-side hooks for SmartLink application
 * Handles authentication, security, rate limiting, and request processing
 */

import { redirect } from '@sveltejs/kit';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMITS = {
	anonymous: 10, // 10 requests per minute for anonymous users
	authenticated: 100 // 100 requests per minute for authenticated users
};

// Security headers
const SECURITY_HEADERS = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'X-XSS-Protection': '1; mode=block',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

// CSP policy
const CSP_POLICY = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.google.com",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"font-src 'self' https://fonts.gstatic.com",
	"img-src 'self' data: https: blob:",
	"connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://api.song.link",
	"frame-src 'self' https://www.google.com",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'"
].join('; ');

/**
 * Rate limiting function
 */
function checkRateLimit(clientId, isAuthenticated = false) {
	const now = Date.now();
	const windowStart = now - RATE_LIMIT_WINDOW;
	const limit = isAuthenticated ? RATE_LIMITS.authenticated : RATE_LIMITS.anonymous;
	
	// Get or create rate limit data for this client
	if (!rateLimitStore.has(clientId)) {
		rateLimitStore.set(clientId, []);
	}
	
	const requests = rateLimitStore.get(clientId);
	
	// Remove old requests outside the window
	const recentRequests = requests.filter(timestamp => timestamp > windowStart);
	
	// Check if limit exceeded
	if (recentRequests.length >= limit) {
		return false;
	}
	
	// Add current request
	recentRequests.push(now);
	rateLimitStore.set(clientId, recentRequests);
	
	// Clean up old entries periodically
	if (rateLimitStore.size > 10000) {
		const cutoff = now - (RATE_LIMIT_WINDOW * 2);
		for (const [key, timestamps] of rateLimitStore.entries()) {
			const filtered = timestamps.filter(t => t > cutoff);
			if (filtered.length === 0) {
				rateLimitStore.delete(key);
			} else {
				rateLimitStore.set(key, filtered);
			}
		}
	}
	
	return true;
}

/**
 * Get client identifier for rate limiting
 */
function getClientId(request) {
	// Use IP address as primary identifier
	const forwarded = request.headers.get('x-forwarded-for');
	const realIp = request.headers.get('x-real-ip');
	const remoteAddress = forwarded?.split(',')[0] || realIp || 'unknown';
	
	// Add user agent to make identifier more unique
	const userAgent = request.headers.get('user-agent') || '';
	const userAgentHash = userAgent.length > 0 ? 
		userAgent.slice(0, 50) : 'no-ua';
	
	return `${remoteAddress}:${userAgentHash}`;
}

/**
 * Check if route requires authentication
 */
function requiresAuth(pathname) {
	const protectedRoutes = [
		'/dashboard',
		'/smartlinks',
		'/analytics',
		'/profile',
		'/settings',
		'/billing'
	];
	
	return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if route is API route
 */
function isApiRoute(pathname) {
	return pathname.startsWith('/api/');
}

/**
 * Check if route is SmartLink redirect
 */
function isSmartLinkRoute(pathname) {
	return pathname.startsWith('/s/') || pathname.startsWith('/api/redirect/');
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const { request, url } = event;
	const pathname = url.pathname;
	
	// Get client identifier for rate limiting
	const clientId = getClientId(request);
	
	// Skip rate limiting for static assets and some special routes
	const skipRateLimit = pathname.startsWith('/_app/') ||
						  pathname.startsWith('/favicon') ||
						  pathname === '/robots.txt' ||
						  pathname === '/sitemap.xml';
	
	if (!skipRateLimit) {
		// Check rate limit (we'll implement auth check later)
		const isAuthenticated = false; // TODO: Check authentication status
		
		if (!checkRateLimit(clientId, isAuthenticated)) {
			return new Response('Too Many Requests', { 
				status: 429,
				headers: {
					'Retry-After': '60',
					'Content-Type': 'text/plain',
					...SECURITY_HEADERS
				}
			});
		}
	}
	
	// Handle authentication redirect for protected routes
	if (requiresAuth(pathname)) {
		// In a full implementation, you would check the authentication token here
		// For now, we'll let the client handle this
	}
	
	// Handle CORS for API routes
	if (isApiRoute(pathname)) {
		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
					'Access-Control-Max-Age': '86400',
					...SECURITY_HEADERS
				}
			});
		}
	}
	
	// Special handling for SmartLink routes (high performance)
	if (isSmartLinkRoute(pathname)) {
		// Add cache headers for SmartLink redirects
		const response = await resolve(event);
		
		// Don't cache error responses
		if (response.status >= 200 && response.status < 300) {
			response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
		}
		
		return response;
	}
	
	// Resolve the request
	const response = await resolve(event, {
		transformPageChunk: ({ html, done }) => {
			// Add security headers to HTML pages
			if (done) {
				return html;
			}
			return html;
		}
	});
	
	// Add security headers
	Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
		response.headers.set(key, value);
	});
	
	// Add CSP header (only for HTML pages)
	if (response.headers.get('content-type')?.includes('text/html')) {
		response.headers.set('Content-Security-Policy', CSP_POLICY);
	}
	
	// Add CORS headers for API routes
	if (isApiRoute(pathname)) {
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Credentials', 'true');
	}
	
	// Add performance headers
	response.headers.set('X-Response-Time', Date.now() - event.locals.startTime);
	
	return response;
}

/** @type {import('@sveltejs/kit').HandleServerError} */
export async function handleError({ error, event }) {
	const errorId = crypto.randomUUID();
	
	// Log error (in production, use proper logging service)
	console.error(`Error ${errorId}:`, {
		error: error.message,
		stack: error.stack,
		url: event.url.toString(),
		userAgent: event.request.headers.get('user-agent'),
		timestamp: new Date().toISOString()
	});
	
	// Don't expose internal errors to client
	return {
		message: 'Une erreur inattendue s\'est produite',
		errorId
	};
}

/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ request, fetch }) {
	// Add default headers to internal requests
	if (request.url.startsWith('http://localhost') || 
		request.url.startsWith('https://your-app-domain.com')) {
		request.headers.set('User-Agent', 'SmartLink-Internal/1.0');
	}
	
	return fetch(request);
}
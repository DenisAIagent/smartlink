/**
 * SmartLink Redirect API
 * Edge Function for intelligent platform redirection
 */

import { json, redirect } from '@sveltejs/kit';
import { smartLinksService } from '../../../../services/smartlinks.js';
import { analyticsService } from '../../../../services/analytics.js';
import { redirectEngine } from '../../../../utils/redirect.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, request, url, getClientAddress }) {
	const { slug } = params;
	
	if (!slug) {
		throw redirect(302, '/');
	}
	
	try {
		// Get SmartLink data
		const smartLink = await smartLinksService.getSmartLinkBySlug(slug);
		
		if (!smartLink || !smartLink.isActive) {
			throw redirect(302, `/s/${slug}`);
		}
		
		// Get request context
		const userAgent = request.headers.get('user-agent') || '';
		const referrer = request.headers.get('referer') || '';
		const acceptLanguage = request.headers.get('accept-language') || '';
		const clientIP = getClientAddress();
		
		// Extract geolocation from headers (Vercel/Netlify provide these)
		const country = request.headers.get('x-vercel-ip-country') || 
						request.headers.get('cf-ipcountry') || 'FR';
		const region = request.headers.get('x-vercel-ip-country-region') || 
					   request.headers.get('cf-region') || '';
		const city = request.headers.get('x-vercel-ip-city') || 
					 request.headers.get('cf-city') || '';
		
		// Build context for redirect engine
		const context = {
			userAgent,
			referrer,
			url: url.toString(),
			ip: clientIP,
			country,
			region,
			city,
			headers: Object.fromEntries(request.headers.entries())
		};
		
		// Get optimal redirect decision
		const redirectDecision = redirectEngine.getBestRedirect(smartLink, context);
		
		// Track the redirect
		try {
			await analyticsService.trackClick(smartLink.id, slug, {
				...context,
				redirectDecision: {
					platform: redirectDecision.platform?.name,
					confidence: redirectDecision.confidence,
					reason: redirectDecision.platform?.reason
				}
			});
			
			// Track platform click if we have a platform
			if (redirectDecision.platform) {
				await analyticsService.trackPlatformClick(
					smartLink.id,
					redirectDecision.platform.name,
					redirectDecision.platform.url,
					context
				);
				
				// Increment SmartLink click count
				await smartLinksService.incrementClickCount(smartLink.id);
			}
		} catch (analyticsError) {
			// Log error but don't fail the redirect
			console.error('Analytics tracking failed:', analyticsError);
		}
		
		// Check redirect confidence and URL parameters
		const forceRedirect = url.searchParams.get('redirect') === 'true';
		const platform = url.searchParams.get('platform');
		
		// Force redirect to specific platform if requested
		if (platform) {
			const requestedPlatform = smartLink.platforms.find(
				p => p.name.toLowerCase() === platform.toLowerCase()
			);
			if (requestedPlatform) {
				throw redirect(302, requestedPlatform.url);
			}
		}
		
		// Auto-redirect if high confidence or forced
		if (redirectDecision.platform && (redirectDecision.confidence > 0.8 || forceRedirect)) {
			throw redirect(302, redirectDecision.url);
		}
		
		// Otherwise, redirect to SmartLink page for user choice
		throw redirect(302, `/s/${slug}`);
		
	} catch (error) {
		// If it's already a redirect, re-throw it
		if (error.status >= 300 && error.status < 400) {
			throw error;
		}
		
		console.error('Redirect API error:', error);
		
		// Fallback to SmartLink page
		throw redirect(302, `/s/${slug}`);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request }) {
	const { slug } = params;
	
	try {
		const body = await request.json();
		const { platform, action = 'click' } = body;
		
		if (!slug || !platform) {
			return json({ error: 'Missing required parameters' }, { status: 400 });
		}
		
		// Get SmartLink data
		const smartLink = await smartLinksService.getSmartLinkBySlug(slug);
		
		if (!smartLink || !smartLink.isActive) {
			return json({ error: 'SmartLink not found' }, { status: 404 });
		}
		
		// Find the requested platform
		const requestedPlatform = smartLink.platforms.find(
			p => p.name.toLowerCase() === platform.toLowerCase()
		);
		
		if (!requestedPlatform) {
			return json({ error: 'Platform not found' }, { status: 404 });
		}
		
		// Get request context
		const userAgent = request.headers.get('user-agent') || '';
		const referrer = request.headers.get('referer') || '';
		const clientIP = request.headers.get('x-forwarded-for') || 
						 request.headers.get('x-real-ip') || '';
		
		const context = {
			userAgent,
			referrer,
			url: request.url,
			ip: clientIP,
			action
		};
		
		// Track the platform click
		await analyticsService.trackPlatformClick(
			smartLink.id,
			requestedPlatform.name,
			requestedPlatform.url,
			context
		);
		
		// Increment SmartLink click count
		await smartLinksService.incrementClickCount(smartLink.id);
		
		return json({ 
			success: true, 
			redirectUrl: requestedPlatform.url,
			platform: requestedPlatform.name
		});
		
	} catch (error) {
		console.error('POST redirect API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

/**
 * Preflight handler for CORS
 */
/** @type {import('./$types').RequestHandler} */
export async function OPTIONS() {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Max-Age': '86400'
		}
	});
}
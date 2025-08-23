/**
 * Configuration de l'application
 */

import { dev } from '$app/environment';

// Domaines selon l'environnement
export const DOMAINS = {
	development: 'localhost:5173',
	production: 'mdmcmusicads.com'
};

// URL de base selon l'environnement
export const BASE_URL = dev 
	? `http://${DOMAINS.development}` 
	: `https://${DOMAINS.production}`;

// Domaine actuel
export const CURRENT_DOMAIN = dev ? DOMAINS.development : DOMAINS.production;

/**
 * Génère une URL complète pour un SmartLink
 */
export function getSmartLinkUrl(slug) {
	return `${BASE_URL}/s/${slug}`;
}

/**
 * Génère une URL courte pour affichage
 */
export function getShortUrl(slug) {
	return `${CURRENT_DOMAIN}/s/${slug}`;
}

/**
 * Génère une URL complète à partir d'une URL courte
 */
export function getFullUrlFromShort(shortUrl) {
	if (shortUrl.startsWith('http')) {
		return shortUrl;
	}
	
	// Si c'est une URL courte, on ajoute le protocole approprié
	const protocol = dev ? 'http://' : 'https://';
	return `${protocol}${shortUrl}`;
}
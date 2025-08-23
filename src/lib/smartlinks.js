/**
 * Simple SmartLinks storage system
 * In a real application, this would use Firebase or a database
 */

// Storage system with localStorage persistence
const STORAGE_KEY = 'smartlinks_storage';

// Initialize storage with default data
function initializeStorage() {
	// Try to load from localStorage first
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				// Convert date strings back to Date objects
				Object.values(parsed).forEach(smartLink => {
					smartLink.createdAt = new Date(smartLink.createdAt);
					smartLink.updatedAt = new Date(smartLink.updatedAt);
				});
				return parsed;
			} catch (e) {
				console.warn('Error parsing stored SmartLinks:', e);
			}
		}
	}
	
	// Return default data if nothing in storage
	return getDefaultSmartLinks();
}

function getDefaultSmartLinks() {
	return {
	// Demo SmartLink
	'abc123': {
		slug: 'abc123',
		title: 'Electro Vibes',
		artist: 'DJ Laurent',
		description: 'Le nouveau hit électro qui fait danser toute la France !',
		coverUrl: 'https://via.placeholder.com/400x400/1DB954/FFFFFF?text=EV',
		previewAudioUrl: '',
		platforms: [
			{
				name: 'Spotify',
				url: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
				color: '#1DB954',
				icon: '/images/platforms/picto_spotify.png'
			},
			{
				name: 'Apple Music',
				url: 'https://music.apple.com/us/album/example/123456789',
				color: '#FA243C',
				icon: '/images/platforms/picto_applemusic.png'
			},
			{
				name: 'YouTube Music',
				url: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
				color: '#FF0000',
				icon: '/images/platforms/picto_youtubemusic.png'
			},
			{
				name: 'Deezer',
				url: 'https://deezer.com/track/123456789',
				color: '#FF6600',
				icon: '/images/platforms/picto_deezer.png'
			}
		],
		template: 'default',
		customization: {
			primaryColor: '#1DB954',
			backgroundColor: '#ffffff',
			textColor: '#333333'
		},
		clicks: 156,
		createdAt: new Date('2024-01-15T10:30:00Z'),
		updatedAt: new Date('2024-01-15T10:30:00Z')
	}
	};
}

// Initialize the store
let smartLinksStore = initializeStorage();

// Save to localStorage function
function saveToStorage() {
	if (typeof window !== 'undefined') {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(smartLinksStore));
		} catch (e) {
			console.warn('Error saving SmartLinks to localStorage:', e);
		}
	}
}

/**
 * Create a new SmartLink
 */
export function createSmartLink(smartLinkData) {
	const slug = generateSlug(smartLinkData.title);
	const now = new Date();
	
	const smartLink = {
		slug,
		title: smartLinkData.title,
		artist: smartLinkData.artist || '',
		description: smartLinkData.description || '',
		coverUrl: smartLinkData.coverUrl || '',
		previewAudioUrl: smartLinkData.previewAudioUrl || '',
		platforms: smartLinkData.platforms || [],
		template: smartLinkData.template || 'default',
		customization: smartLinkData.customization || {
			primaryColor: '#1976d2',
			backgroundColor: '#ffffff',
			textColor: '#333333'
		},
		clicks: 0,
		createdAt: now,
		updatedAt: now
	};
	
	// Ensure store is initialized
	if (!smartLinksStore) {
		smartLinksStore = getDefaultSmartLinks();
	}
	
	smartLinksStore[slug] = smartLink;
	saveToStorage();
	
	console.log('SmartLink created and saved:', smartLink);
	
	return smartLink;
}

/**
 * Get a SmartLink by slug
 */
export function getSmartLink(slug) {
	// Ensure store is initialized
	if (!smartLinksStore) {
		smartLinksStore = initializeStorage();
	}
	
	const smartLink = smartLinksStore[slug];
	if (!smartLink) {
		return null;
	}
	
	// Increment click count
	smartLink.clicks = (smartLink.clicks || 0) + 1;
	smartLink.updatedAt = new Date();
	saveToStorage();
	
	return smartLink;
}

/**
 * Get all SmartLinks for a user (demo)
 */
export function getAllSmartLinks() {
	// Ensure store is initialized
	if (!smartLinksStore) {
		smartLinksStore = initializeStorage();
	}
	
	return Object.values(smartLinksStore)
		.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Update a SmartLink
 */
export function updateSmartLink(slug, updates) {
	// Ensure store is initialized
	if (!smartLinksStore) {
		smartLinksStore = initializeStorage();
	}
	
	const smartLink = smartLinksStore[slug];
	if (!smartLink) {
		return null;
	}
	
	Object.assign(smartLink, updates, {
		updatedAt: new Date()
	});
	saveToStorage();
	
	return smartLink;
}

/**
 * Delete a SmartLink
 */
export function deleteSmartLink(slug) {
	// Ensure store is initialized
	if (!smartLinksStore) {
		smartLinksStore = initializeStorage();
	}
	
	if (!smartLinksStore[slug]) {
		return false;
	}
	
	delete smartLinksStore[slug];
	saveToStorage();
	return true;
}

/**
 * Generate a unique slug from title
 */
function generateSlug(title) {
	const baseSlug = title.toLowerCase()
		.replace(/[^a-z0-9]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
	
	// Add timestamp to ensure uniqueness
	const timestamp = Date.now().toString(36);
	
	return `${baseSlug}-${timestamp}`;
}

/**
 * Check if a slug exists
 */
export function slugExists(slug) {
	// Ensure store is initialized
	if (!smartLinksStore) {
		smartLinksStore = initializeStorage();
	}
	
	return smartLinksStore.hasOwnProperty(slug);
}

/**
 * Get SmartLink statistics
 */
export function getSmartLinkStats(slug) {
	// Ensure store is initialized
	if (!smartLinksStore) {
		smartLinksStore = initializeStorage();
	}
	
	const smartLink = smartLinksStore[slug];
	if (!smartLink) {
		return null;
	}
	
	return {
		slug: smartLink.slug,
		title: smartLink.title,
		clicks: smartLink.clicks || 0,
		platforms: smartLink.platforms?.length || 0,
		createdAt: smartLink.createdAt,
		updatedAt: smartLink.updatedAt
	};
}

/**
 * Get all SmartLinks stats
 */
export function getAllSmartLinksStats() {
	// Ensure store is initialized
	if (!smartLinksStore) {
		smartLinksStore = initializeStorage();
	}
	
	return Object.values(smartLinksStore).map(smartLink => ({
		slug: smartLink.slug,
		title: smartLink.title,
		artist: smartLink.artist,
		clicks: smartLink.clicks || 0,
		platforms: smartLink.platforms?.length || 0,
		createdAt: smartLink.createdAt,
		updatedAt: smartLink.updatedAt
	}));
}

/**
 * Clear all SmartLinks from storage (for debugging)
 */
export function clearAllSmartLinks() {
	if (typeof window !== 'undefined') {
		localStorage.removeItem(STORAGE_KEY);
	}
	smartLinksStore = getDefaultSmartLinks();
	saveToStorage();
	console.log('All SmartLinks cleared, reset to defaults');
}

/**
 * Debug function to log current storage state
 */
export function debugStorage() {
	console.log('Current SmartLinks storage:', smartLinksStore);
	if (typeof window !== 'undefined') {
		console.log('localStorage content:', localStorage.getItem(STORAGE_KEY));
	}
}

// Demo function to add more sample data
export function addDemoSmartLinks() {
	const demoLinks = [
		{
			title: 'Summer Vibes',
			artist: 'Marie Dubois',
			description: 'Le son de l\'été qui nous fait voyager !',
			platforms: [
				{
					name: 'Spotify',
					url: 'https://open.spotify.com/track/example1',
					color: '#1DB954',
					icon: '/images/platforms/picto_spotify.png'
				},
				{
					name: 'Apple Music', 
					url: 'https://music.apple.com/track/example1',
					color: '#FA243C',
					icon: '/images/platforms/picto_applemusic.png'
				}
			]
		},
		{
			title: 'Midnight Dreams',
			artist: 'Alex Martin',
			description: 'Une ballade nocturne pleine d\'émotion',
			platforms: [
				{
					name: 'Spotify',
					url: 'https://open.spotify.com/track/example2',
					color: '#1DB954',
					icon: '/images/platforms/picto_spotify.png'
				},
				{
					name: 'YouTube Music',
					url: 'https://music.youtube.com/watch?v=example2',
					color: '#FF0000',
					icon: '/images/platforms/picto_youtubemusic.png'
				},
				{
					name: 'Deezer',
					url: 'https://deezer.com/track/example2',
					color: '#FF6600',
					icon: '/images/platforms/picto_deezer.png'
				}
			]
		}
	];
	
	demoLinks.forEach(demoLink => {
		createSmartLink(demoLink);
	});
	
	console.log('Demo SmartLinks added:', demoLinks.length);
}
/**
 * SmartLinks Store
 * Svelte 5 reactive store for SmartLinks management
 */

import { writable } from 'svelte/store';
import { smartLinksService } from '../services/smartlinks.js';

// SmartLinks state store
function createSmartLinksStore() {
	const { subscribe, set, update } = writable({
		smartLinks: [],
		loading: false,
		error: null,
		hasMore: true,
		lastDoc: null,
		creating: false,
		updating: false,
		deleting: false
	});

	return {
		subscribe,
		
		// Load user's SmartLinks
		async loadSmartLinks(reset = false) {
			update(state => ({ 
				...state, 
				loading: true, 
				error: null,
				...(reset && { smartLinks: [], lastDoc: null, hasMore: true })
			}));

			try {
				const result = await smartLinksService.getUserSmartLinks(
					10, 
					reset ? null : (state) => state.lastDoc
				);

				if (result.success) {
					update(state => ({
						...state,
						smartLinks: reset ? result.smartLinks : [...state.smartLinks, ...result.smartLinks],
						lastDoc: result.lastDoc,
						hasMore: result.hasMore,
						loading: false
					}));
				} else {
					update(state => ({ ...state, loading: false, error: result.error }));
				}

				return result;
			} catch (error) {
				update(state => ({ ...state, loading: false, error: error.message }));
				return { success: false, error: error.message };
			}
		},

		// Load more SmartLinks (pagination)
		async loadMore() {
			let currentState;
			const unsubscribe = subscribe(state => currentState = state);
			unsubscribe();

			if (!currentState.hasMore || currentState.loading) return;

			return this.loadSmartLinks(false);
		},

		// Create new SmartLink
		async createSmartLink(smartLinkData) {
			update(state => ({ ...state, creating: true, error: null }));

			try {
				const result = await smartLinksService.createSmartLink(smartLinkData);

				if (result.success) {
					update(state => ({
						...state,
						smartLinks: [result.smartLink, ...state.smartLinks],
						creating: false
					}));
				} else {
					update(state => ({ ...state, creating: false, error: result.error }));
				}

				return result;
			} catch (error) {
				update(state => ({ ...state, creating: false, error: error.message }));
				return { success: false, error: error.message };
			}
		},

		// Update SmartLink
		async updateSmartLink(smartLinkId, updates) {
			update(state => ({ ...state, updating: true, error: null }));

			try {
				const result = await smartLinksService.updateSmartLink(smartLinkId, updates);

				if (result.success) {
					update(state => ({
						...state,
						smartLinks: state.smartLinks.map(link =>
							link.id === smartLinkId ? { ...link, ...updates } : link
						),
						updating: false
					}));
				} else {
					update(state => ({ ...state, updating: false, error: result.error }));
				}

				return result;
			} catch (error) {
				update(state => ({ ...state, updating: false, error: error.message }));
				return { success: false, error: error.message };
			}
		},

		// Delete SmartLink
		async deleteSmartLink(smartLinkId) {
			update(state => ({ ...state, deleting: true, error: null }));

			try {
				const result = await smartLinksService.deleteSmartLink(smartLinkId);

				if (result.success) {
					update(state => ({
						...state,
						smartLinks: state.smartLinks.filter(link => link.id !== smartLinkId),
						deleting: false
					}));
				} else {
					update(state => ({ ...state, deleting: false, error: result.error }));
				}

				return result;
			} catch (error) {
				update(state => ({ ...state, deleting: false, error: error.message }));
				return { success: false, error: error.message };
			}
		},

		// Upload cover image
		async uploadCoverImage(file, smartLinkId) {
			update(state => ({ ...state, error: null }));
			
			try {
				const result = await smartLinksService.uploadCoverImage(file, smartLinkId);
				
				if (!result.success) {
					update(state => ({ ...state, error: result.error }));
				}
				
				return result;
			} catch (error) {
				update(state => ({ ...state, error: error.message }));
				return { success: false, error: error.message };
			}
		},

		// Get SmartLink by ID
		async getSmartLink(smartLinkId) {
			try {
				return await smartLinksService.getSmartLink(smartLinkId);
			} catch (error) {
				update(state => ({ ...state, error: error.message }));
				return null;
			}
		},

		// Clear error
		clearError() {
			update(state => ({ ...state, error: null }));
		},

		// Reset store
		reset() {
			set({
				smartLinks: [],
				loading: false,
				error: null,
				hasMore: true,
				lastDoc: null,
				creating: false,
				updating: false,
				deleting: false
			});
		}
	};
}

export const smartLinksStore = createSmartLinksStore();

// Derived stores
import { derived } from 'svelte/store';

export const smartLinksCount = derived(
	smartLinksStore,
	$smartLinks => $smartLinks.smartLinks.length
);

export const recentSmartLinks = derived(
	smartLinksStore,
	$smartLinks => $smartLinks.smartLinks.slice(0, 5)
);

export const topSmartLinks = derived(
	smartLinksStore,
	$smartLinks => [...$smartLinks.smartLinks]
		.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
		.slice(0, 5)
);
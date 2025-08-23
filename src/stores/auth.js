/**
 * Authentication Store
 * Svelte 5 reactive store for auth state management
 */

import { writable } from 'svelte/store';
import { authService } from '../services/auth.js';

// Auth state store
function createAuthStore() {
	const { subscribe, set, update } = writable({
		user: null,
		userData: null,
		loading: true,
		initialized: false,
		error: null
	});

	// Initialize auth state listener
	const unsubscribe = authService.onAuthStateChanged(async (user) => {
		update(state => ({ ...state, loading: true }));
		
		if (user) {
			// Get additional user data from Firestore
			const userData = await authService.getUserData();
			set({
				user,
				userData,
				loading: false,
				initialized: true,
				error: null
			});
		} else {
			set({
				user: null,
				userData: null,
				loading: false,
				initialized: true,
				error: null
			});
		}
	});

	return {
		subscribe,
		
		// Actions
		async signIn(email, password) {
			update(state => ({ ...state, loading: true, error: null }));
			const result = await authService.signInWithEmail(email, password);
			
			if (!result.success) {
				update(state => ({ ...state, loading: false, error: result.error }));
			}
			
			return result;
		},

		async signUp(email, password, displayName) {
			update(state => ({ ...state, loading: true, error: null }));
			const result = await authService.signUpWithEmail(email, password, displayName);
			
			if (!result.success) {
				update(state => ({ ...state, loading: false, error: result.error }));
			}
			
			return result;
		},

		async signInWithGoogle() {
			update(state => ({ ...state, loading: true, error: null }));
			const result = await authService.signInWithGoogle();
			
			if (!result.success) {
				update(state => ({ ...state, loading: false, error: result.error }));
			}
			
			return result;
		},

		async signInWithSpotify() {
			update(state => ({ ...state, loading: true, error: null }));
			return await authService.signInWithSpotify();
		},

		async signOut() {
			update(state => ({ ...state, loading: true }));
			const result = await authService.signOut();
			
			// State will be updated by auth state listener
			return result;
		},

		async resetPassword(email) {
			return await authService.resetPassword(email);
		},

		async updateProfile(profileData) {
			update(state => ({ ...state, loading: true, error: null }));
			const result = await authService.updateUserProfile(profileData);
			
			if (result.success) {
				// Refresh user data
				const userData = await authService.getUserData();
				update(state => ({ 
					...state, 
					userData, 
					loading: false 
				}));
			} else {
				update(state => ({ ...state, loading: false, error: result.error }));
			}
			
			return result;
		},

		async updatePassword(currentPassword, newPassword) {
			return await authService.updateUserPassword(currentPassword, newPassword);
		},

		clearError() {
			update(state => ({ ...state, error: null }));
		},

		// Cleanup
		destroy() {
			if (unsubscribe) unsubscribe();
		}
	};
}

export const authStore = createAuthStore();

// Derived stores for common checks
import { derived } from 'svelte/store';

export const isAuthenticated = derived(
	authStore,
	$auth => $auth.initialized && !!$auth.user
);

export const isLoading = derived(
	authStore,
	$auth => $auth.loading
);

export const isProUser = derived(
	authStore,
	$auth => $auth.userData?.plan === 'pro'
);

export const userLimits = derived(
	authStore,
	$auth => {
		const isProUser = $auth.userData?.plan === 'pro';
		const currentCount = $auth.userData?.smartLinksCount || 0;
		const maxLinks = isProUser ? 1000 : 5;
		
		return {
			isPro: isProUser,
			currentCount,
			maxLinks,
			canCreateMore: currentCount < maxLinks,
			remaining: Math.max(0, maxLinks - currentCount)
		};
	}
);
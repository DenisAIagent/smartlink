/**
 * Authentication Service
 * Comprehensive auth management with Google, Spotify, and email/password
 */

import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	sendPasswordResetEmail,
	updateProfile,
	onAuthStateChanged,
	sendEmailVerification,
	updatePassword,
	reauthenticateWithCredential,
	EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, getFirebaseError, FIREBASE_CONFIG } from '$lib/firebase.js';

class AuthService {
	constructor() {
		this.currentUser = null;
		this.loading = true;
		this.initialized = false;
		this.authStateListeners = new Set();
		
		// Initialize auth state listener only if Firebase is available
		if (auth) {
			this.initAuthStateListener();
		}
	}

	/**
	 * Initialize auth state listener
	 */
	initAuthStateListener() {
		onAuthStateChanged(auth, async (user) => {
			this.loading = true;
			
			if (user) {
				// User is signed in
				this.currentUser = {
					uid: user.uid,
					email: user.email,
					displayName: user.displayName,
					photoURL: user.photoURL,
					emailVerified: user.emailVerified,
					metadata: user.metadata
				};
				
				// Update user document in Firestore
				await this.updateUserDocument(this.currentUser);
			} else {
				// User is signed out
				this.currentUser = null;
			}
			
			this.loading = false;
			this.initialized = true;
			
			// Notify listeners
			this.authStateListeners.forEach(callback => callback(this.currentUser));
		});
	}

	/**
	 * Subscribe to auth state changes
	 * @param {Function} callback - Callback function
	 * @returns {Function} Unsubscribe function
	 */
	onAuthStateChanged(callback) {
		this.authStateListeners.add(callback);
		
		// Call immediately with current state if initialized
		if (this.initialized) {
			callback(this.currentUser);
		}
		
		return () => {
			this.authStateListeners.delete(callback);
		};
	}

	/**
	 * Sign in with email and password
	 * @param {string} email
	 * @param {string} password
	 * @returns {Promise<Object>}
	 */
	async signInWithEmail(email, password) {
		try {
			const result = await signInWithEmailAndPassword(auth, email, password);
			return { success: true, user: result.user };
		} catch (error) {
			console.error('Sign in error:', error);
			return { success: false, error: getFirebaseError(error) };
		}
	}

	/**
	 * Create account with email and password
	 * @param {string} email
	 * @param {string} password
	 * @param {string} displayName
	 * @returns {Promise<Object>}
	 */
	async signUpWithEmail(email, password, displayName) {
		try {
			const result = await createUserWithEmailAndPassword(auth, email, password);
			
			// Update profile with display name
			if (displayName) {
				await updateProfile(result.user, { displayName });
			}
			
			// Send email verification
			await sendEmailVerification(result.user);
			
			return { 
				success: true, 
				user: result.user,
				message: 'Compte créé avec succès. Veuillez vérifier votre email.' 
			};
		} catch (error) {
			console.error('Sign up error:', error);
			return { success: false, error: getFirebaseError(error) };
		}
	}

	/**
	 * Sign in with Google
	 * @returns {Promise<Object>}
	 */
	async signInWithGoogle() {
		try {
			const provider = new GoogleAuthProvider();
			provider.addScope('email');
			provider.addScope('profile');
			
			const result = await signInWithPopup(auth, provider);
			
			return { success: true, user: result.user };
		} catch (error) {
			console.error('Google sign in error:', error);
			return { success: false, error: getFirebaseError(error) };
		}
	}

	/**
	 * Sign in with Spotify (Custom implementation)
	 * This would typically require backend integration for OAuth2 flow
	 * @returns {Promise<Object>}
	 */
	async signInWithSpotify() {
		try {
			const spotifyClientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
			const redirectUri = `${window.location.origin}/auth/spotify/callback`;
			const scopes = 'user-read-email user-read-private';
			
			const spotifyAuthUrl = `https://accounts.spotify.com/authorize?` +
				`client_id=${spotifyClientId}&` +
				`response_type=code&` +
				`redirect_uri=${encodeURIComponent(redirectUri)}&` +
				`scope=${encodeURIComponent(scopes)}`;
			
			// Redirect to Spotify authorization
			window.location.href = spotifyAuthUrl;
			
			return { success: true, message: 'Redirection vers Spotify...' };
		} catch (error) {
			console.error('Spotify sign in error:', error);
			return { success: false, error: 'Erreur lors de la connexion Spotify' };
		}
	}

	/**
	 * Sign out user
	 * @returns {Promise<Object>}
	 */
	async signOut() {
		try {
			await signOut(auth);
			return { success: true, message: 'Déconnexion réussie' };
		} catch (error) {
			console.error('Sign out error:', error);
			return { success: false, error: getFirebaseError(error) };
		}
	}

	/**
	 * Send password reset email
	 * @param {string} email
	 * @returns {Promise<Object>}
	 */
	async resetPassword(email) {
		try {
			await sendPasswordResetEmail(auth, email);
			return { 
				success: true, 
				message: 'Email de réinitialisation envoyé. Vérifiez votre boîte de réception.' 
			};
		} catch (error) {
			console.error('Password reset error:', error);
			return { success: false, error: getFirebaseError(error) };
		}
	}

	/**
	 * Update user password
	 * @param {string} currentPassword
	 * @param {string} newPassword
	 * @returns {Promise<Object>}
	 */
	async updateUserPassword(currentPassword, newPassword) {
		try {
			if (!this.currentUser) {
				throw new Error('User not authenticated');
			}
			
			// Re-authenticate user
			const credential = EmailAuthProvider.credential(this.currentUser.email, currentPassword);
			await reauthenticateWithCredential(auth.currentUser, credential);
			
			// Update password
			await updatePassword(auth.currentUser, newPassword);
			
			return { success: true, message: 'Mot de passe mis à jour avec succès' };
		} catch (error) {
			console.error('Password update error:', error);
			return { success: false, error: getFirebaseError(error) };
		}
	}

	/**
	 * Update user profile
	 * @param {Object} profileData
	 * @returns {Promise<Object>}
	 */
	async updateUserProfile(profileData) {
		try {
			if (!this.currentUser) {
				throw new Error('User not authenticated');
			}
			
			// Update Firebase Auth profile
			if (profileData.displayName || profileData.photoURL) {
				await updateProfile(auth.currentUser, {
					displayName: profileData.displayName || auth.currentUser.displayName,
					photoURL: profileData.photoURL || auth.currentUser.photoURL
				});
			}
			
			// Update Firestore document
			await this.updateUserDocument({
				...this.currentUser,
				...profileData,
				updatedAt: serverTimestamp()
			});
			
			return { success: true, message: 'Profil mis à jour avec succès' };
		} catch (error) {
			console.error('Profile update error:', error);
			return { success: false, error: getFirebaseError(error) };
		}
	}

	/**
	 * Update user document in Firestore
	 * @param {Object} userData
	 */
	async updateUserDocument(userData) {
		try {
			if (!userData.uid) return;
			
			const userRef = doc(db, FIREBASE_CONFIG.COLLECTIONS.USERS, userData.uid);
			const userDoc = await getDoc(userRef);
			
			if (userDoc.exists()) {
				// Update existing document
				await updateDoc(userRef, {
					email: userData.email,
					displayName: userData.displayName,
					photoURL: userData.photoURL,
					emailVerified: userData.emailVerified,
					lastLoginAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				});
			} else {
				// Create new document
				await setDoc(userRef, {
					uid: userData.uid,
					email: userData.email,
					displayName: userData.displayName,
					photoURL: userData.photoURL,
					emailVerified: userData.emailVerified,
					plan: 'free',
					smartLinksCount: 0,
					createdAt: serverTimestamp(),
					lastLoginAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				});
			}
		} catch (error) {
			console.error('User document update error:', error);
		}
	}

	/**
	 * Get user data from Firestore
	 * @returns {Promise<Object|null>}
	 */
	async getUserData() {
		try {
			if (!this.currentUser) return null;
			
			const userRef = doc(db, FIREBASE_CONFIG.COLLECTIONS.USERS, this.currentUser.uid);
			const userDoc = await getDoc(userRef);
			
			return userDoc.exists() ? userDoc.data() : null;
		} catch (error) {
			console.error('Get user data error:', error);
			return null;
		}
	}

	/**
	 * Check if user has pro plan
	 * @returns {Promise<boolean>}
	 */
	async isProUser() {
		try {
			const userData = await this.getUserData();
			return userData?.plan === 'pro';
		} catch (error) {
			console.error('Pro user check error:', error);
			return false;
		}
	}

	/**
	 * Get current user
	 * @returns {Object|null}
	 */
	getCurrentUser() {
		return this.currentUser;
	}

	/**
	 * Check if user is authenticated
	 * @returns {boolean}
	 */
	isAuthenticated() {
		return !!this.currentUser;
	}

	/**
	 * Check if auth is loading
	 * @returns {boolean}
	 */
	isLoading() {
		return this.loading;
	}
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
/**
 * SmartLinks Service
 * Complete CRUD operations for SmartLinks with Firestore optimization
 */

import {
	collection,
	doc,
	addDoc,
	getDoc,
	getDocs,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit,
	startAfter,
	serverTimestamp,
	increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, FIREBASE_CONFIG } from '$lib/firebase.js';
import { authService } from './auth.js';

class SmartLinksService {
	constructor() {
		this.collection = FIREBASE_CONFIG.COLLECTIONS.SMARTLINKS;
		this.defaultPlatforms = [
			{ name: 'Spotify', color: '#1DB954', icon: 'spotify' },
			{ name: 'Apple Music', color: '#FA243C', icon: 'apple' },
			{ name: 'YouTube Music', color: '#FF0000', icon: 'youtube' },
			{ name: 'Deezer', color: '#FEAA2D', icon: 'deezer' },
			{ name: 'SoundCloud', color: '#FF5500', icon: 'soundcloud' },
			{ name: 'Bandcamp', color: '#629AA0', icon: 'bandcamp' },
			{ name: 'Amazon Music', color: '#232F3E', icon: 'amazon' },
			{ name: 'Tidal', color: '#000000', icon: 'tidal' }
		];
	}

	/**
	 * Create a new SmartLink
	 * @param {Object} smartLinkData
	 * @returns {Promise<Object>}
	 */
	async createSmartLink(smartLinkData) {
		try {
			const user = authService.getCurrentUser();
			if (!user) {
				throw new Error('User not authenticated');
			}

			// Check user limits
			const canCreate = await this.checkUserLimits(user.uid);
			if (!canCreate.allowed) {
				return { success: false, error: canCreate.reason };
			}

			// Generate unique slug
			const slug = await this.generateUniqueSlug(smartLinkData.title);

			// Prepare SmartLink document
			const smartLink = {
				userId: user.uid,
				slug,
				title: smartLinkData.title,
				artist: smartLinkData.artist || '',
				description: smartLinkData.description || '',
				coverUrl: smartLinkData.coverUrl || '',
				platforms: smartLinkData.platforms || [],
				template: smartLinkData.template || 'default',
				customization: smartLinkData.customization || {},
				isActive: true,
				clickCount: 0,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			};

			// Create document
			const docRef = await addDoc(collection(db, this.collection), smartLink);

			// Update user's smartlinks count
			await this.updateUserSmartLinksCount(user.uid, 1);

			return {
				success: true,
				smartLink: { id: docRef.id, ...smartLink },
				slug,
				url: this.getSmartLinkUrl(slug)
			};
		} catch (error) {
			console.error('Create SmartLink error:', error);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Get SmartLink by ID
	 * @param {string} smartLinkId
	 * @returns {Promise<Object|null>}
	 */
	async getSmartLink(smartLinkId) {
		try {
			const docRef = doc(db, this.collection, smartLinkId);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				return { id: docSnap.id, ...docSnap.data() };
			}
			return null;
		} catch (error) {
			console.error('Get SmartLink error:', error);
			return null;
		}
	}

	/**
	 * Get SmartLink by slug (for public access)
	 * @param {string} slug
	 * @returns {Promise<Object|null>}
	 */
	async getSmartLinkBySlug(slug) {
		try {
			const q = query(
				collection(db, this.collection),
				where('slug', '==', slug),
				where('isActive', '==', true),
				limit(1)
			);
			
			const querySnapshot = await getDocs(q);
			
			if (!querySnapshot.empty) {
				const doc = querySnapshot.docs[0];
				return { id: doc.id, ...doc.data() };
			}
			return null;
		} catch (error) {
			console.error('Get SmartLink by slug error:', error);
			return null;
		}
	}

	/**
	 * Get user's SmartLinks with pagination
	 * @param {number} pageSize
	 * @param {Object} lastDoc
	 * @returns {Promise<Object>}
	 */
	async getUserSmartLinks(pageSize = 10, lastDoc = null) {
		try {
			const user = authService.getCurrentUser();
			if (!user) {
				throw new Error('User not authenticated');
			}

			let q = query(
				collection(db, this.collection),
				where('userId', '==', user.uid),
				orderBy('updatedAt', 'desc'),
				limit(pageSize)
			);

			if (lastDoc) {
				q = query(q, startAfter(lastDoc));
			}

			const querySnapshot = await getDocs(q);
			const smartLinks = [];
			let lastDocument = null;

			querySnapshot.forEach((doc) => {
				smartLinks.push({ id: doc.id, ...doc.data() });
				lastDocument = doc;
			});

			return {
				success: true,
				smartLinks,
				lastDoc: lastDocument,
				hasMore: querySnapshot.docs.length === pageSize
			};
		} catch (error) {
			console.error('Get user SmartLinks error:', error);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Update SmartLink
	 * @param {string} smartLinkId
	 * @param {Object} updates
	 * @returns {Promise<Object>}
	 */
	async updateSmartLink(smartLinkId, updates) {
		try {
			const user = authService.getCurrentUser();
			if (!user) {
				throw new Error('User not authenticated');
			}

			// Verify ownership
			const smartLink = await this.getSmartLink(smartLinkId);
			if (!smartLink || smartLink.userId !== user.uid) {
				return { success: false, error: 'SmartLink non trouvé ou accès refusé' };
			}

			// Prepare updates
			const updateData = {
				...updates,
				updatedAt: serverTimestamp()
			};

			// Update document
			const docRef = doc(db, this.collection, smartLinkId);
			await updateDoc(docRef, updateData);

			return { success: true, message: 'SmartLink mis à jour avec succès' };
		} catch (error) {
			console.error('Update SmartLink error:', error);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Delete SmartLink
	 * @param {string} smartLinkId
	 * @returns {Promise<Object>}
	 */
	async deleteSmartLink(smartLinkId) {
		try {
			const user = authService.getCurrentUser();
			if (!user) {
				throw new Error('User not authenticated');
			}

			// Verify ownership
			const smartLink = await this.getSmartLink(smartLinkId);
			if (!smartLink || smartLink.userId !== user.uid) {
				return { success: false, error: 'SmartLink non trouvé ou accès refusé' };
			}

			// Delete cover image if exists
			if (smartLink.coverUrl) {
				await this.deleteCoverImage(smartLink.coverUrl);
			}

			// Delete document
			const docRef = doc(db, this.collection, smartLinkId);
			await deleteDoc(docRef);

			// Update user's smartlinks count
			await this.updateUserSmartLinksCount(user.uid, -1);

			return { success: true, message: 'SmartLink supprimé avec succès' };
		} catch (error) {
			console.error('Delete SmartLink error:', error);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Upload cover image
	 * @param {File} file
	 * @param {string} smartLinkId
	 * @returns {Promise<Object>}
	 */
	async uploadCoverImage(file, smartLinkId) {
		try {
			const user = authService.getCurrentUser();
			if (!user) {
				throw new Error('User not authenticated');
			}

			// Validate file
			if (!file || !file.type.startsWith('image/')) {
				return { success: false, error: 'Veuillez sélectionner une image valide' };
			}

			if (file.size > FIREBASE_CONFIG.LIMITS.MAX_FILE_SIZE) {
				return { success: false, error: 'La taille du fichier ne doit pas dépasser 5MB' };
			}

			// Create storage reference
			const fileName = `${user.uid}/${smartLinkId}/${Date.now()}_${file.name}`;
			const storageRef = ref(storage, `${FIREBASE_CONFIG.STORAGE_PATHS.COVERS}/${fileName}`);

			// Upload file
			const snapshot = await uploadBytes(storageRef, file);
			const downloadURL = await getDownloadURL(snapshot.ref);

			return { success: true, url: downloadURL };
		} catch (error) {
			console.error('Upload cover image error:', error);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Delete cover image
	 * @param {string} imageUrl
	 */
	async deleteCoverImage(imageUrl) {
		try {
			if (!imageUrl.includes('firebase')) return;
			
			const imageRef = ref(storage, imageUrl);
			await deleteObject(imageRef);
		} catch (error) {
			console.error('Delete cover image error:', error);
		}
	}

	/**
	 * Increment SmartLink click count
	 * @param {string} smartLinkId
	 * @returns {Promise<void>}
	 */
	async incrementClickCount(smartLinkId) {
		try {
			const docRef = doc(db, this.collection, smartLinkId);
			await updateDoc(docRef, {
				clickCount: increment(1),
				lastClickedAt: serverTimestamp()
			});
		} catch (error) {
			console.error('Increment click count error:', error);
		}
	}

	/**
	 * Generate unique slug for SmartLink
	 * @param {string} title
	 * @returns {Promise<string>}
	 */
	async generateUniqueSlug(title) {
		const baseSlug = title
			.toLowerCase()
			.replace(/[àáâãäå]/g, 'a')
			.replace(/[èéêë]/g, 'e')
			.replace(/[ìíîï]/g, 'i')
			.replace(/[òóôõö]/g, 'o')
			.replace(/[ùúûü]/g, 'u')
			.replace(/[ýÿ]/g, 'y')
			.replace(/[ñ]/g, 'n')
			.replace(/[ç]/g, 'c')
			.replace(/[^a-z0-9]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
			.substring(0, 50);

		let slug = baseSlug;
		let counter = 0;

		while (await this.slugExists(slug)) {
			counter++;
			slug = `${baseSlug}-${counter}`;
		}

		return slug;
	}

	/**
	 * Check if slug exists
	 * @param {string} slug
	 * @returns {Promise<boolean>}
	 */
	async slugExists(slug) {
		try {
			const q = query(
				collection(db, this.collection),
				where('slug', '==', slug),
				limit(1)
			);
			
			const querySnapshot = await getDocs(q);
			return !querySnapshot.empty;
		} catch (error) {
			console.error('Slug exists check error:', error);
			return false;
		}
	}

	/**
	 * Check user limits for SmartLink creation
	 * @param {string} userId
	 * @returns {Promise<Object>}
	 */
	async checkUserLimits(userId) {
		try {
			const userData = await authService.getUserData();
			const isProUser = userData?.plan === 'pro';
			const currentCount = userData?.smartLinksCount || 0;
			
			const maxLinks = isProUser 
				? FIREBASE_CONFIG.LIMITS.MAX_SMARTLINKS_PRO 
				: FIREBASE_CONFIG.LIMITS.MAX_SMARTLINKS_FREE;

			if (currentCount >= maxLinks) {
				return {
					allowed: false,
					reason: isProUser 
						? 'Limite de SmartLinks atteinte. Contactez le support.'
						: 'Limite gratuite atteinte. Passez au plan Pro pour créer plus de SmartLinks.'
				};
			}

			return { allowed: true };
		} catch (error) {
			console.error('Check user limits error:', error);
			return { allowed: false, reason: 'Erreur lors de la vérification des limites' };
		}
	}

	/**
	 * Update user's SmartLinks count
	 * @param {string} userId
	 * @param {number} increment
	 */
	async updateUserSmartLinksCount(userId, increment) {
		try {
			const userRef = doc(db, FIREBASE_CONFIG.COLLECTIONS.USERS, userId);
			await updateDoc(userRef, {
				smartLinksCount: increment(increment)
			});
		} catch (error) {
			console.error('Update user SmartLinks count error:', error);
		}
	}

	/**
	 * Get SmartLink URL
	 * @param {string} slug
	 * @returns {string}
	 */
	getSmartLinkUrl(slug) {
		const domain = import.meta.env.VITE_APP_DOMAIN || 'localhost:5173';
		return `https://${domain}/s/${slug}`;
	}

	/**
	 * Get default platforms
	 * @returns {Array}
	 */
	getDefaultPlatforms() {
		return this.defaultPlatforms;
	}

	/**
	 * Validate SmartLink data
	 * @param {Object} data
	 * @returns {Object}
	 */
	validateSmartLinkData(data) {
		const errors = {};

		if (!data.title || data.title.trim().length === 0) {
			errors.title = 'Le titre est requis';
		} else if (data.title.length > 100) {
			errors.title = 'Le titre ne doit pas dépasser 100 caractères';
		}

		if (data.description && data.description.length > 500) {
			errors.description = 'La description ne doit pas dépasser 500 caractères';
		}

		if (!data.platforms || data.platforms.length === 0) {
			errors.platforms = 'Au moins une plateforme est requise';
		}

		return {
			isValid: Object.keys(errors).length === 0,
			errors
		};
	}
}

// Export singleton instance
export const smartLinksService = new SmartLinksService();
export default smartLinksService;
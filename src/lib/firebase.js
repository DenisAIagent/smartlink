/**
 * Firebase Configuration and Initialization
 * Optimized for SmartLink application with security best practices
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { dev } from '$app/environment';

// Firebase Configuration
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase is properly configured
function isFirebaseConfigured() {
	const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
	return requiredKeys.every(key => 
		firebaseConfig[key] && 
		!firebaseConfig[key].includes('your_') && 
		!firebaseConfig[key].includes('demo')
	);
}

// Initialize Firebase only if properly configured and not during build
let app = null;
let auth = null;
let db = null;
let storage = null;

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
	// Initialize Firebase App
	app = initializeApp(firebaseConfig);

	// Initialize Firebase Auth
	auth = getAuth(app);

	// Initialize Firestore
	db = getFirestore(app);

	// Initialize Firebase Storage
	storage = getStorage(app);
} else {
	console.warn('Firebase not initialized: Either running in build mode or configuration is incomplete');
}

export { app, auth, db, storage };

// Initialize Firebase Analytics (only in production and if supported)
export let analytics = null;
if (!dev && typeof window !== 'undefined') {
	isSupported().then((supported) => {
		if (supported) {
			analytics = getAnalytics(app);
		}
	});
}

// Connect to Firebase Emulators in development
if (dev && typeof window !== 'undefined') {
	try {
		// Only connect if not already connected
		if (auth._delegate?._config?.emulator?.url === undefined) {
			connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
		}
		if (db._delegate?._databaseId?.host?.includes('localhost') === false) {
			connectFirestoreEmulator(db, '127.0.0.1', 8080);
		}
		if (storage._delegate?._host?.includes('localhost') === false) {
			connectStorageEmulator(storage, '127.0.0.1', 9199);
		}
	} catch (error) {
		// Emulators might already be connected, ignore the error
		console.log('Firebase emulators connection:', error.message);
	}
}

// Firebase error codes translation
export const firebaseErrors = {
	'auth/user-not-found': 'Utilisateur non trouvé',
	'auth/wrong-password': 'Mot de passe incorrect',
	'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
	'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
	'auth/invalid-email': 'Adresse email invalide',
	'auth/user-disabled': 'Ce compte a été désactivé',
	'auth/too-many-requests': 'Trop de tentatives, veuillez réessayer plus tard',
	'auth/network-request-failed': 'Erreur de connexion réseau',
	'firestore/permission-denied': 'Accès refusé',
	'firestore/unavailable': 'Service temporairement indisponible',
	'storage/unauthorized': 'Accès non autorisé au stockage',
	'storage/canceled': 'Opération annulée',
	'storage/unknown': 'Erreur de stockage inconnue'
};

// Helper function to get localized error message
export function getFirebaseError(error) {
	return firebaseErrors[error.code] || error.message || 'Une erreur inattendue est survenue';
}

// Configuration constants
export const FIREBASE_CONFIG = {
	// Collections
	COLLECTIONS: {
		USERS: 'users',
		SMARTLINKS: 'smartlinks',
		ANALYTICS: 'analytics',
		TEMPLATES: 'templates'
	},
	
	// Storage paths
	STORAGE_PATHS: {
		AVATARS: 'avatars',
		COVERS: 'covers',
		ASSETS: 'assets'
	},
	
	// Limits
	LIMITS: {
		MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
		MAX_SMARTLINKS_FREE: 5,
		MAX_SMARTLINKS_PRO: 1000
	}
};

export default app;
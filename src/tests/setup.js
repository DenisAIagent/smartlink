/**
 * Test setup for Vitest
 * Global test configuration and mocks
 */

import { vi } from 'vitest';
import 'vitest-dom/extend-expect';

// Mock Firebase
vi.mock('firebase/app', () => ({
	initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
	getAuth: vi.fn(() => ({})),
	connectAuthEmulator: vi.fn(),
	signInWithEmailAndPassword: vi.fn(),
	createUserWithEmailAndPassword: vi.fn(),
	signInWithPopup: vi.fn(),
	GoogleAuthProvider: vi.fn(),
	signOut: vi.fn(),
	sendPasswordResetEmail: vi.fn(),
	updateProfile: vi.fn(),
	onAuthStateChanged: vi.fn(),
	sendEmailVerification: vi.fn(),
	updatePassword: vi.fn(),
	reauthenticateWithCredential: vi.fn(),
	EmailAuthProvider: {
		credential: vi.fn()
	}
}));

vi.mock('firebase/firestore', () => ({
	getFirestore: vi.fn(() => ({})),
	connectFirestoreEmulator: vi.fn(),
	collection: vi.fn(),
	doc: vi.fn(),
	addDoc: vi.fn(),
	getDoc: vi.fn(),
	getDocs: vi.fn(),
	updateDoc: vi.fn(),
	deleteDoc: vi.fn(),
	query: vi.fn(),
	where: vi.fn(),
	orderBy: vi.fn(),
	limit: vi.fn(),
	startAfter: vi.fn(),
	serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
	increment: vi.fn((value) => ({ _methodName: 'increment', _value: value })),
	Timestamp: {
		fromDate: vi.fn((date) => ({ toDate: () => date }))
	}
}));

vi.mock('firebase/storage', () => ({
	getStorage: vi.fn(() => ({})),
	connectStorageEmulator: vi.fn(),
	ref: vi.fn(),
	uploadBytes: vi.fn(),
	getDownloadURL: vi.fn(),
	deleteObject: vi.fn()
}));

vi.mock('firebase/analytics', () => ({
	getAnalytics: vi.fn(() => ({})),
	isSupported: vi.fn(() => Promise.resolve(true))
}));

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
	browser: false,
	dev: true,
	building: false,
	version: '1.0.0'
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	onNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

vi.mock('$app/stores', () => {
	const readable = (value) => ({
		subscribe: vi.fn(() => vi.fn())
	});
	
	return {
		page: readable({
			url: new URL('http://localhost:3000'),
			params: {},
			route: { id: null },
			status: 200,
			error: null,
			data: {}
		}),
		navigating: readable(null),
		updated: readable(false)
	};
});

// Mock UA Parser
vi.mock('ua-parser-js', () => {
	return {
		default: vi.fn(() => ({
			setUA: vi.fn(),
			getResult: vi.fn(() => ({
				ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				browser: { name: 'Chrome', version: '91.0.4472.124' },
				os: { name: 'Windows', version: '10' },
				device: { type: 'desktop' }
			}))
		}))
	};
});

// Global test utilities
global.createMockSmartLink = (overrides = {}) => ({
	id: 'test-smartlink-1',
	slug: 'test-smartlink',
	userId: 'test-user-1',
	title: 'Test Song',
	artist: 'Test Artist',
	description: 'A test song for unit tests',
	coverUrl: 'https://example.com/cover.jpg',
	platforms: [
		{
			name: 'Spotify',
			url: 'https://open.spotify.com/track/test',
			color: '#1DB954',
			icon: 'spotify'
		},
		{
			name: 'Apple Music',
			url: 'https://music.apple.com/track/test',
			color: '#FA243C',
			icon: 'apple'
		}
	],
	template: 'default',
	customization: {
		primaryColor: '#1976d2',
		backgroundColor: '#ffffff',
		textColor: '#333333'
	},
	isActive: true,
	clickCount: 42,
	createdAt: { toDate: () => new Date('2024-01-01') },
	updatedAt: { toDate: () => new Date('2024-01-02') },
	...overrides
});

global.createMockUser = (overrides = {}) => ({
	uid: 'test-user-1',
	email: 'test@example.com',
	displayName: 'Test User',
	photoURL: 'https://example.com/avatar.jpg',
	emailVerified: true,
	metadata: {
		creationTime: '2024-01-01T00:00:00Z',
		lastSignInTime: '2024-01-02T00:00:00Z'
	},
	...overrides
});

global.createMockUserData = (overrides = {}) => ({
	uid: 'test-user-1',
	email: 'test@example.com',
	displayName: 'Test User',
	photoURL: 'https://example.com/avatar.jpg',
	plan: 'free',
	smartLinksCount: 3,
	createdAt: { toDate: () => new Date('2024-01-01') },
	lastLoginAt: { toDate: () => new Date('2024-01-02') },
	updatedAt: { toDate: () => new Date('2024-01-02') },
	...overrides
});

// Setup DOM environment
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
	value: {
		getItem: vi.fn(() => null),
		setItem: vi.fn(() => null),
		removeItem: vi.fn(() => null),
		clear: vi.fn(() => null),
	},
	writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
	value: {
		getItem: vi.fn(() => null),
		setItem: vi.fn(() => null),
		removeItem: vi.fn(() => null),
		clear: vi.fn(() => null),
	},
	writable: true,
});

// Mock navigator
Object.defineProperty(navigator, 'clipboard', {
	value: {
		writeText: vi.fn(() => Promise.resolve())
	},
	writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Setup test environment
beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
	sessionStorage.clear();
});
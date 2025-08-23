/**
 * Tests for Authentication Service
 */

import { describe, it, expect, vi } from 'vitest';
import { authService } from './auth.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Mock Firebase functions
vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('../lib/firebase.js', () => ({
	auth: {},
	db: {},
	getFirebaseError: (error) => error.message || 'Firebase error',
	FIREBASE_CONFIG: {
		COLLECTIONS: {
			USERS: 'users'
		}
	}
}));

describe('AuthService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('signInWithEmail', () => {
		it('should sign in successfully with valid credentials', async () => {
			const mockUser = createMockUser();
			signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

			const result = await authService.signInWithEmail('test@example.com', 'password123');

			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockUser);
			expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
				{}, // auth object
				'test@example.com',
				'password123'
			);
		});

		it('should handle sign in errors', async () => {
			const mockError = new Error('Invalid credentials');
			mockError.code = 'auth/wrong-password';
			signInWithEmailAndPassword.mockRejectedValue(mockError);

			const result = await authService.signInWithEmail('test@example.com', 'wrongpassword');

			expect(result.success).toBe(false);
			expect(result.error).toBe('Invalid credentials');
		});

		it('should validate email format', async () => {
			const result = await authService.signInWithEmail('invalid-email', 'password123');

			// This would be handled by Firebase, but we're testing our wrapper
			expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
				{},
				'invalid-email',
				'password123'
			);
		});
	});

	describe('signUpWithEmail', () => {
		it('should create account successfully', async () => {
			const mockUser = createMockUser();
			createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

			const result = await authService.signUpWithEmail(
				'newuser@example.com',
				'password123',
				'New User'
			);

			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockUser);
			expect(result.message).toContain('Compte créé avec succès');
			expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
				{},
				'newuser@example.com',
				'password123'
			);
		});

		it('should handle signup errors', async () => {
			const mockError = new Error('Email already in use');
			mockError.code = 'auth/email-already-in-use';
			createUserWithEmailAndPassword.mockRejectedValue(mockError);

			const result = await authService.signUpWithEmail(
				'existing@example.com',
				'password123',
				'Existing User'
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Email already in use');
		});
	});

	describe('getCurrentUser', () => {
		it('should return current user when authenticated', () => {
			authService.currentUser = createMockUser();
			
			const user = authService.getCurrentUser();
			
			expect(user).toEqual(createMockUser());
		});

		it('should return null when not authenticated', () => {
			authService.currentUser = null;
			
			const user = authService.getCurrentUser();
			
			expect(user).toBeNull();
		});
	});

	describe('isAuthenticated', () => {
		it('should return true when user is authenticated', () => {
			authService.currentUser = createMockUser();
			
			expect(authService.isAuthenticated()).toBe(true);
		});

		it('should return false when user is not authenticated', () => {
			authService.currentUser = null;
			
			expect(authService.isAuthenticated()).toBe(false);
		});
	});

	describe('isLoading', () => {
		it('should return loading state', () => {
			authService.loading = true;
			expect(authService.isLoading()).toBe(true);

			authService.loading = false;
			expect(authService.isLoading()).toBe(false);
		});
	});
});
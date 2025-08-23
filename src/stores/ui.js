/**
 * UI Store
 * Global UI state management for modals, notifications, theme, etc.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Theme management
function createThemeStore() {
	const { subscribe, set, update } = writable('light');

	// Initialize theme from localStorage
	if (browser) {
		const savedTheme = localStorage.getItem('smartlink-theme') || 'light';
		set(savedTheme);
		document.documentElement.setAttribute('data-theme', savedTheme);
	}

	return {
		subscribe,
		set: (theme) => {
			set(theme);
			if (browser) {
				localStorage.setItem('smartlink-theme', theme);
				document.documentElement.setAttribute('data-theme', theme);
			}
		},
		toggle() {
			update(theme => {
				const newTheme = theme === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('smartlink-theme', newTheme);
					document.documentElement.setAttribute('data-theme', newTheme);
				}
				return newTheme;
			});
		}
	};
}

// Notification system
function createNotificationStore() {
	const { subscribe, update } = writable([]);

	return {
		subscribe,
		
		add(notification) {
			const id = Date.now() + Math.random();
			const newNotification = {
				id,
				type: 'info',
				duration: 5000,
				...notification
			};

			update(notifications => [...notifications, newNotification]);

			// Auto remove after duration
			if (newNotification.duration > 0) {
				setTimeout(() => {
					this.remove(id);
				}, newNotification.duration);
			}

			return id;
		},

		remove(id) {
			update(notifications => notifications.filter(n => n.id !== id));
		},

		clear() {
			update(() => []);
		},

		// Convenience methods
		success(message, options = {}) {
			return this.add({ ...options, type: 'success', message });
		},

		error(message, options = {}) {
			return this.add({ ...options, type: 'error', message, duration: 8000 });
		},

		warning(message, options = {}) {
			return this.add({ ...options, type: 'warning', message });
		},

		info(message, options = {}) {
			return this.add({ ...options, type: 'info', message });
		}
	};
}

// Modal system
function createModalStore() {
	const { subscribe, set, update } = writable({
		isOpen: false,
		component: null,
		props: {},
		onClose: null
	});

	return {
		subscribe,
		
		open(component, props = {}, onClose = null) {
			set({
				isOpen: true,
				component,
				props,
				onClose
			});

			// Prevent body scroll
			if (browser) {
				document.body.style.overflow = 'hidden';
			}
		},

		close() {
			update(state => {
				if (state.onClose) {
					state.onClose();
				}
				return {
					isOpen: false,
					component: null,
					props: {},
					onClose: null
				};
			});

			// Restore body scroll
			if (browser) {
				document.body.style.overflow = '';
			}
		}
	};
}

// Loading states
function createLoadingStore() {
	const { subscribe, update } = writable(new Set());

	return {
		subscribe,
		
		add(key) {
			update(loading => new Set([...loading, key]));
		},

		remove(key) {
			update(loading => {
				const newLoading = new Set(loading);
				newLoading.delete(key);
				return newLoading;
			});
		},

		clear() {
			update(() => new Set());
		},

		has: (loading, key) => loading.has(key),
		
		// Convenience methods
		async withLoading(key, asyncFunction) {
			this.add(key);
			try {
				return await asyncFunction();
			} finally {
				this.remove(key);
			}
		}
	};
}

// Mobile/responsive state
function createResponsiveStore() {
	const { subscribe, set } = writable({
		isMobile: false,
		isTablet: false,
		isDesktop: true,
		width: 0,
		height: 0
	});

	if (browser) {
		const updateSize = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;
			
			set({
				width,
				height,
				isMobile: width < 768,
				isTablet: width >= 768 && width < 1024,
				isDesktop: width >= 1024
			});
		};

		updateSize();
		window.addEventListener('resize', updateSize);
	}

	return { subscribe };
}

// Sidebar state
function createSidebarStore() {
	const { subscribe, set, update } = writable({
		isOpen: false,
		isPinned: false
	});

	return {
		subscribe,
		
		toggle() {
			update(state => ({ ...state, isOpen: !state.isOpen }));
		},

		open() {
			update(state => ({ ...state, isOpen: true }));
		},

		close() {
			update(state => ({ ...state, isOpen: false }));
		},

		pin() {
			update(state => ({ ...state, isPinned: true }));
		},

		unpin() {
			update(state => ({ ...state, isPinned: false }));
		},

		togglePin() {
			update(state => ({ ...state, isPinned: !state.isPinned }));
		}
	};
}

// Export stores
export const theme = createThemeStore();
export const notifications = createNotificationStore();
export const modal = createModalStore();
export const loading = createLoadingStore();
export const responsive = createResponsiveStore();
export const sidebar = createSidebarStore();

// Derived stores
import { derived } from 'svelte/store';

export const isDarkTheme = derived(theme, $theme => $theme === 'dark');

export const hasNotifications = derived(
	notifications,
	$notifications => $notifications.length > 0
);

export const isModalOpen = derived(
	modal,
	$modal => $modal.isOpen
);

export const isLoading = derived(
	loading,
	$loading => $loading.size > 0
);
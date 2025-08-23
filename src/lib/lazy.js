/**
 * Lazy Loading Utilities
 * Optimized component and resource loading for better performance
 */

/**
 * Lazy load Svelte components
 * @param {Function} importFn - Dynamic import function
 * @returns {Function} Lazy component loader
 */
export function lazyLoad(importFn) {
	let component = null;
	let loading = false;
	let error = null;
	
	return async () => {
		if (component) return component;
		if (loading) {
			// Wait for ongoing load to complete
			while (loading) {
				await new Promise(resolve => setTimeout(resolve, 10));
			}
			return component;
		}
		
		loading = true;
		try {
			const module = await importFn();
			component = module.default || module;
			return component;
		} catch (err) {
			error = err;
			throw err;
		} finally {
			loading = false;
		}
	};
}

/**
 * Preload a component
 * @param {Function} importFn - Dynamic import function
 */
export function preloadComponent(importFn) {
	// Start loading immediately but don't wait
	importFn().catch(console.warn);
}

/**
 * Intersection Observer for lazy loading elements
 */
export class LazyLoadObserver {
	constructor(options = {}) {
		this.options = {
			rootMargin: '50px 0px',
			threshold: 0.01,
			...options
		};
		
		this.observer = new IntersectionObserver(
			this.handleIntersection.bind(this),
			this.options
		);
		
		this.elements = new Map();
	}
	
	observe(element, callback) {
		this.elements.set(element, callback);
		this.observer.observe(element);
	}
	
	unobserve(element) {
		this.elements.delete(element);
		this.observer.unobserve(element);
	}
	
	handleIntersection(entries) {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const callback = this.elements.get(entry.target);
				if (callback) {
					callback(entry.target);
					this.unobserve(entry.target);
				}
			}
		});
	}
	
	disconnect() {
		this.observer.disconnect();
		this.elements.clear();
	}
}

/**
 * Lazy load images with fade-in effect
 * @param {HTMLImageElement} img - Image element
 * @param {string} src - Image source URL
 * @param {string} placeholder - Placeholder image (optional)
 */
export function lazyLoadImage(img, src, placeholder = null) {
	if (placeholder) {
		img.src = placeholder;
	}
	
	img.style.opacity = '0';
	img.style.transition = 'opacity 0.3s ease';
	
	const tempImg = new Image();
	tempImg.onload = () => {
		img.src = src;
		img.style.opacity = '1';
	};
	tempImg.onerror = () => {
		img.style.opacity = '1'; // Show placeholder on error
	};
	tempImg.src = src;
}

/**
 * Lazy load CSS
 * @param {string} href - CSS file URL
 * @returns {Promise} Promise that resolves when CSS is loaded
 */
export function lazyLoadCSS(href) {
	return new Promise((resolve, reject) => {
		// Check if already loaded
		const existing = document.querySelector(`link[href="${href}"]`);
		if (existing) {
			resolve();
			return;
		}
		
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;
		
		link.onload = resolve;
		link.onerror = reject;
		
		document.head.appendChild(link);
	});
}

/**
 * Lazy load JavaScript
 * @param {string} src - Script source URL
 * @param {boolean} module - Whether to load as module
 * @returns {Promise} Promise that resolves when script is loaded
 */
export function lazyLoadScript(src, module = false) {
	return new Promise((resolve, reject) => {
		// Check if already loaded
		const existing = document.querySelector(`script[src="${src}"]`);
		if (existing) {
			resolve();
			return;
		}
		
		const script = document.createElement('script');
		script.src = src;
		if (module) {
			script.type = 'module';
		}
		
		script.onload = resolve;
		script.onerror = reject;
		
		document.head.appendChild(script);
	});
}

/**
 * Prefetch resources
 * @param {string[]} urls - URLs to prefetch
 * @param {string} as - Resource type hint
 */
export function prefetchResources(urls, as = 'fetch') {
	if (!('requestIdleCallback' in window)) {
		// Fallback for browsers without requestIdleCallback
		setTimeout(() => prefetchNow(urls, as), 100);
		return;
	}
	
	requestIdleCallback(() => {
		prefetchNow(urls, as);
	});
}

function prefetchNow(urls, as) {
	urls.forEach(url => {
		const link = document.createElement('link');
		link.rel = 'prefetch';
		link.as = as;
		link.href = url;
		document.head.appendChild(link);
	});
}

/**
 * Critical resource preloader
 */
export class CriticalResourceLoader {
	constructor() {
		this.loaded = new Set();
		this.loading = new Set();
	}
	
	async load(resource) {
		const { type, url, priority = 'low' } = resource;
		
		// Avoid duplicate loads
		if (this.loaded.has(url) || this.loading.has(url)) {
			return;
		}
		
		this.loading.add(url);
		
		try {
			switch (type) {
				case 'style':
					await lazyLoadCSS(url);
					break;
				case 'script':
					await lazyLoadScript(url);
					break;
				case 'font':
					await this.preloadFont(url);
					break;
				default:
					await fetch(url);
			}
			
			this.loaded.add(url);
		} catch (error) {
			console.warn(`Failed to load resource: ${url}`, error);
		} finally {
			this.loading.delete(url);
		}
	}
	
	async preloadFont(url) {
		const font = new FontFace('PreloadedFont', `url(${url})`);
		await font.load();
		document.fonts.add(font);
	}
	
	preloadCritical(resources) {
		// Load high priority resources immediately
		const highPriority = resources.filter(r => r.priority === 'high');
		const mediumPriority = resources.filter(r => r.priority === 'medium');
		const lowPriority = resources.filter(r => r.priority === 'low');
		
		// Load high priority immediately
		highPriority.forEach(resource => this.load(resource));
		
		// Load medium priority after idle
		requestIdleCallback(() => {
			mediumPriority.forEach(resource => this.load(resource));
		});
		
		// Load low priority on user interaction or after delay
		const loadLowPriority = () => {
			lowPriority.forEach(resource => this.load(resource));
		};
		
		// Load on first interaction
		const interactions = ['click', 'keydown', 'touchstart', 'mousemove'];
		const handleInteraction = () => {
			loadLowPriority();
			interactions.forEach(event => 
				document.removeEventListener(event, handleInteraction)
			);
		};
		
		interactions.forEach(event => 
			document.addEventListener(event, handleInteraction, { once: true, passive: true })
		);
		
		// Fallback: load after 3 seconds
		setTimeout(loadLowPriority, 3000);
	}
}

/**
 * Route-based code splitting
 */
export const routes = {
	// Eagerly loaded routes (critical path)
	'/': () => import('../routes/+page.svelte'),
	'/login': () => import('../routes/auth/login/+page.svelte'),
	
	// Lazy loaded routes
	'/dashboard': lazyLoad(() => import('../routes/dashboard/+page.svelte')),
	'/smartlinks': lazyLoad(() => import('../routes/smartlinks/+page.svelte')),
	'/smartlinks/new': lazyLoad(() => import('../routes/smartlinks/new/+page.svelte')),
	'/analytics': lazyLoad(() => import('../routes/analytics/+page.svelte')),
	'/profile': lazyLoad(() => import('../routes/profile/+page.svelte')),
	'/settings': lazyLoad(() => import('../routes/settings/+page.svelte')),
	'/billing': lazyLoad(() => import('../routes/billing/+page.svelte'))
};

/**
 * Preload routes based on user navigation patterns
 */
export function preloadRoutes() {
	// Common navigation patterns
	const currentPath = window.location.pathname;
	
	if (currentPath === '/') {
		// From home, users likely go to dashboard or login
		preloadComponent(routes['/dashboard']);
		preloadComponent(routes['/login']);
	} else if (currentPath === '/dashboard') {
		// From dashboard, users create SmartLinks or view analytics
		preloadComponent(routes['/smartlinks/new']);
		preloadComponent(routes['/analytics']);
	} else if (currentPath.startsWith('/smartlinks')) {
		// From SmartLinks, users view analytics
		preloadComponent(routes['/analytics']);
	}
}

// Auto-preload based on link hover
export function enableHoverPreload() {
	let preloadTimer;
	
	document.addEventListener('mouseover', (e) => {
		if (e.target.tagName === 'A' && e.target.href) {
			const url = new URL(e.target.href);
			const path = url.pathname;
			
			if (routes[path]) {
				preloadTimer = setTimeout(() => {
					preloadComponent(routes[path]);
				}, 100); // Small delay to avoid preloading on quick hover
			}
		}
	});
	
	document.addEventListener('mouseout', (e) => {
		if (e.target.tagName === 'A') {
			clearTimeout(preloadTimer);
		}
	});
}

// Initialize performance optimizations
export function initPerformanceOptimizations() {
	// Enable hover preloading
	if (typeof window !== 'undefined') {
		enableHoverPreload();
		
		// Preload routes based on current page
		setTimeout(preloadRoutes, 1000);
		
		// Critical resource loader
		const loader = new CriticalResourceLoader();
		
		// Define critical resources
		const criticalResources = [
			{ type: 'style', url: '/app.css', priority: 'high' },
			{ type: 'font', url: '/fonts/inter-var.woff2', priority: 'high' }
		];
		
		loader.preloadCritical(criticalResources);
	}
}

export default {
	lazyLoad,
	preloadComponent,
	LazyLoadObserver,
	lazyLoadImage,
	lazyLoadCSS,
	lazyLoadScript,
	prefetchResources,
	CriticalResourceLoader,
	routes,
	initPerformanceOptimizations
};
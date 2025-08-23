import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'prompt',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
							}
						}
					},
					{
						urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|webp)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images-cache',
							expiration: {
								maxEntries: 60,
								maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
							}
						}
					}
				]
			},
			manifest: {
				name: 'SmartLink - Liens Intelligents',
				short_name: 'SmartLink',
				description: 'Service de liens intelligents pour artistes indépendants français',
				theme_color: '#1976d2',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: '/icon-72x72.png',
						sizes: '72x72',
						type: 'image/png'
					},
					{
						src: '/icon-96x96.png',
						sizes: '96x96',
						type: 'image/png'
					},
					{
						src: '/icon-128x128.png',
						sizes: '128x128',
						type: 'image/png'
					},
					{
						src: '/icon-144x144.png',
						sizes: '144x144',
						type: 'image/png'
					},
					{
						src: '/icon-152x152.png',
						sizes: '152x152',
						type: 'image/png'
					},
					{
						src: '/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/icon-384x384.png',
						sizes: '384x384',
						type: 'image/png'
					},
					{
						src: '/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			},
			devOptions: {
				enabled: true
			}
		})
	],
	build: {
		target: 'es2020',
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
			}
		},
		sourcemap: false, // Disable in production
		outDir: 'build',
		emptyOutDir: true,
		assetsInlineLimit: 4096, // Inline assets smaller than 4kb
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Firebase chunk
					if (id.includes('firebase')) {
						return 'firebase';
					}
					// Charts chunk
					if (id.includes('chart.js')) {
						return 'charts';
					}
					// Utils chunk
					if (id.includes('ua-parser-js') || id.includes('date-fns')) {
						return 'utils';
					}
					// Vendor chunk for large libraries
					if (id.includes('node_modules') && !id.includes('@sveltejs')) {
						return 'vendor';
					}
					// Svelte components in separate chunk
					if (id.includes('src/components')) {
						return 'components';
					}
				}
			}
		}
	},
	optimizeDeps: {
		include: [
			'firebase/app', 
			'firebase/auth', 
			'firebase/firestore',
			'chart.js',
			'ua-parser-js',
			'date-fns'
		],
		exclude: ['@sveltejs/kit']
	},
	define: {
		global: 'globalThis',
		__BUILD_DATE__: JSON.stringify(new Date().toISOString()),
		__APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
	},
	
	// Performance optimizations
	server: {
		fs: {
			allow: ['..'] // Allow serving files from parent directory
		}
	},
	
	// CSS optimizations
	css: {
		devSourcemap: true,
		preprocessorOptions: {
			scss: {
				additionalData: `@import 'src/styles/variables.scss';`
			}
		}
	}
});

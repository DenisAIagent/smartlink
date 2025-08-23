import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			out: 'build'
		}),
		files: {
			assets: 'static',
			hooks: {
				client: 'src/hooks.client.js',
				server: 'src/hooks.server.js'
			}
		},
		serviceWorker: {
			register: false // We'll handle PWA manually for better control
		},
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn'
		}
	},
	compilerOptions: {
		// runes: true - Disabled for Svelte 4.2 compatibility
	}
};

export default config;

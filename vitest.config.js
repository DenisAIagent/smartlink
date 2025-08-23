import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { configDefaults } from 'vitest/config';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: [...configDefaults.exclude, 'e2e/*'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['src/tests/setup.js'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'coverage/**',
				'dist/**',
				'**/node_modules/**',
				'**/test/**',
				'**/*.config.*',
				'**/*.d.ts',
				'src/app.html',
				'src/app.d.ts'
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80
				}
			}
		}
	},
	define: {
		global: 'globalThis'
	}
});
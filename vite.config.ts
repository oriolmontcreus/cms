import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	server: {
		host: true,
		port: 5173,
		strictPort: true,
		watch: {
			usePolling: true,
			ignored: [
				'**/site/src/data/pages.json',
				'**/site/src/data/globalVariables.json'
			]
		},
		fs: {
			allow: [
				'.',
				'../site/src/data'
			]
		}
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			'@lib': resolve(__dirname, './src/lib'),
			'@components': resolve(__dirname, './src/lib/components'),
			'@shared': resolve(__dirname, '../shared'),
			'$lib': resolve(__dirname, './src/lib')
		}
	},
	optimizeDeps: {
		include: ['@lib/components/form-builder/pages/*.ts', '$lib/components/form-builder/pages/*.ts']
	}
});

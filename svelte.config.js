import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Enables <style lang="scss"> inside .svelte components (Vite-handled langs).
	preprocess: vitePreprocess(),
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		// The dashboard shares one origin with the public site (archery.axlothecook.com).
		// Both are SvelteKit apps, so their default `_app` bundle dir + root static assets
		// (favicon, fonts) would collide. Give the dashboard a DISTINCT appDir so its client
		// bundle lives at /_dash (never /_app), letting nginx route /_dash unambiguously to
		// the dashboard container. Route URLs are unchanged (/prijava, /nadzorna-ploca/…).
		appDir: '_dash'
	}
};

export default config;

import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Dev-only same-origin API proxy. As a SEPARATE app the dashboard runs on its
	// own port, so without this the browser would call the backend cross-origin
	// (the cross-host cookie trap). Proxying /api to the backend keeps the session
	// cookie FIRST-PARTY on the Vite origin — works on PC (localhost:5173) AND a
	// phone (192.168.x.x:5173). This mirrors the PROD topology, where nginx serves
	// the dashboard + /api under one origin. See the auth-topology memory note.
	server: {
		host: true, // bind 0.0.0.0 so a phone on the same Wi-Fi can reach the dev server
		proxy: {
			'/api': {
				target: 'http://localhost:3100',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '')
			}
		}
	},
	// rolldown-vite (Vite 8) defaults to lightningcss for BOTH the CSS transform and
	// the minify pass. lightningcss rejects the sass-library's bleeding-edge
	// customizable-<select> selectors (e.g. `::picker(select):popover-open` — a
	// pseudo-CLASS after a pseudo-ELEMENT, which lightningcss disallows). Use the
	// postcss transformer AND force the esbuild minifier so those valid modern
	// selectors pass through untouched (esbuild doesn't strict-validate selectors;
	// `cssMinify: false` alone wasn't honored by the SSR build environment here).
	css: { transformer: 'postcss' },
	build: { cssMinify: 'esbuild' }
});

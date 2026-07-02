<script lang="ts">
	// Dashboard root layout: loads the Inter font + global styles once, then renders
	// the page. Unlike the public site there is NO shared NavBar / Footer here — the
	// admin chrome (blue rail + top bar) lives in /nadzorna-ploca/+layout.svelte, and /prijava
	// is a standalone full-screen page. So this root layout is intentionally bare.
	const favicon = '/favicon.png';

	// Inter is self-declared in styles/index.scss (ONE variable font face per subset,
	// font-display: optional) — NOT imported from @fontsource here. The per-weight
	// @fontsource CSS hardcodes `font-display: swap` and split Inter into 42
	// @font-face rules across 6 weights × subsets; in dev those got double-injected
	// (SSR + client) and churned, re-resolving fonts ~1s after load = the
	// normal→thin→normal weight flicker. One variable face + `optional` removes both
	// the swap and the churn. See index.scss.
	import '../styles/index.scss';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

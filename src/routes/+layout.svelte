<script lang="ts">
	// Dashboard root layout: loads the Inter font + global styles once, then renders
	// the page. Unlike the public site there is NO shared NavBar / Footer here — the
	// admin chrome (blue rail + top bar) lives in /admin/+layout.svelte, and /prijava
	// is a standalone full-screen page. So this root layout is intentionally bare.
	const favicon = '/favicon.png';

	import '@fontsource/inter/300.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/inter/700.css';
	import '@fontsource/inter/800.css';
	import '../styles/index.scss';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

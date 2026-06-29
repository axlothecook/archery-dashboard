<script lang="ts">
	// Root error boundary. SvelteKit renders this (inside the root layout) whenever
	// a load throws or a route is not found, INSTEAD of crashing the whole app — so
	// a single failure degrades to a friendly page, never a blank/white screen.
	// Covers 404 (unknown URL) and unexpected errors anywhere not caught by a more
	// specific boundary (e.g. /admin/+error.svelte).
	import { page } from '$app/state';

	const status = $derived(page.status);
	const isNotFound = $derived(status === 404);
</script>

<svelte:head>
	<title>{isNotFound ? 'Stranica nije pronađena' : 'Greška'} · VSK</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="err">
	<div class="err-card">
		<p class="err-code">{status}</p>
		<h1 class="err-title">
			{isNotFound ? 'Stranica nije pronađena' : 'Nešto je pošlo po zlu'}
		</h1>
		<p class="err-msg">
			{isNotFound
				? 'Tražena stranica ne postoji ili je premještena.'
				: 'Dogodila se neočekivana pogreška. Pokušajte ponovno ili se vratite na nadzornu ploču.'}
		</p>
		<div class="err-actions">
			<a class="err-btn" href="/admin/nadzorna-ploca">Natrag na nadzornu ploču</a>
		</div>
	</div>
</div>

<style>
	.err {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: 2rem;
		background: var(--color-bg, #f3f4f6);
	}
	.err-card {
		max-width: 30rem;
		width: 100%;
		text-align: center;
		background: #fff;
		border-radius: 14px;
		padding: 2.5rem 2rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}
	.err-code {
		margin: 0;
		font-size: 3rem;
		font-weight: 800;
		color: #187ff5;
		line-height: 1;
	}
	.err-title {
		margin: 0.75rem 0 0.5rem;
		font-size: 1.4rem;
		font-weight: 700;
		color: #102e66;
	}
	.err-msg {
		margin: 0 0 1.5rem;
		color: #5b6577;
		line-height: 1.5;
	}
	.err-btn {
		display: inline-block;
		padding: 0.7rem 1.4rem;
		border-radius: 10px;
		background: #102e66;
		color: #fff;
		font-weight: 600;
	}
	.err-btn:hover {
		background: #0c2350;
	}
</style>

<script lang="ts">
	// /nadzorna-ploca section error boundary. Because it lives UNDER /nadzorna-ploca/+layout.svelte,
	// SvelteKit renders it INSIDE the dashboard shell — the blue rail, top bar and
	// every OTHER section stay fully usable. So if one editor's load throws (e.g.
	// the backend hiccups loading articles), only THAT panel shows this fallback;
	// the rest of the dashboard keeps working. This is the "one element fails, the
	// others stay available" guarantee.
	import { page } from '$app/state';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? '');

	function retry() {
		// Reload just this route's data (re-runs its load); no full page reload.
		location.reload();
	}
</script>

<div class="sec-err">
	<p class="sec-err-code">{status}</p>
	<h2 class="sec-err-title">Ovaj odjeljak se nije učitao</h2>
	<p class="sec-err-msg">
		Došlo je do pogreške pri učitavanju ovog odjeljka. Ostatak nadzorne ploče i dalje radi.
		Odaberite drugu sekciju u izborniku ili pokušajte ponovno.
	</p>
	{#if message}
		<p class="sec-err-detail">{message}</p>
	{/if}
	<div class="sec-err-actions">
		<button class="sec-err-btn" onclick={retry}>Pokušaj ponovno</button>
		<a class="sec-err-link" href="/nadzorna-ploca">Natrag na pregled</a>
	</div>
</div>

<style>
	.sec-err {
		max-width: 34rem;
		background: #fff;
		border-radius: 14px;
		padding: 2rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}
	.sec-err-code {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 800;
		color: #187ff5;
	}
	.sec-err-title {
		margin: 0.4rem 0 0.5rem;
		font-size: 1.2rem;
		font-weight: 700;
		color: #102e66;
	}
	.sec-err-msg {
		margin: 0 0 0.75rem;
		color: #5b6577;
		line-height: 1.5;
	}
	.sec-err-detail {
		margin: 0 0 1.25rem;
		font-size: 0.85rem;
		color: #9aa3b2;
		font-family: ui-monospace, monospace;
		word-break: break-word;
	}
	.sec-err-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.sec-err-btn {
		padding: 0.6rem 1.2rem;
		border: none;
		border-radius: 10px;
		background: #187ff5;
		color: #fff;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}
	.sec-err-btn:hover {
		filter: brightness(0.94);
	}
	.sec-err-link {
		color: #187ff5;
		font-weight: 500;
	}
</style>

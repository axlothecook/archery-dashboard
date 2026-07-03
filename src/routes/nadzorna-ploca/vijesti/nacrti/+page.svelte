<script lang="ts">
	// Vijesti → Nacrti: draft articles (not yet public). Same table as Objavljene.
	import type { ArticleAdminRow } from '$lib/articles';
	import ArticleTable from '$lib/components/ArticleTable.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import NewsIcon from '$lib/components/icons/NewsIcon.svelte';

	let { data } = $props();
	// Local mutable copy (ArticleTable removes rows on delete); re-synced on load change.
	let articles = $state<ArticleAdminRow[]>([]);
	$effect(() => {
		articles = data.articles;
	});
</script>

<svelte:head><title>Nacrti · VSK</title></svelte:head>

<section class="art-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<NewsIcon size={28} />
			<div>
				<h2 class="mgmt-title">Nacrti</h2>
				<p class="mgmt-sub">Članci u pripremi, još nisu objavljeni. Dovršite ih i objavite kada su spremni.</p>
			</div>
		</div>
		<a class="btn-add cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/vijesti/novi">
			<AddIcon size={18} />
			Novi članak
		</a>
	</div>

	<div class="panel bg-white">
		{#if data.loadError}
			<p class="art-load-error" role="alert">Učitavanje nacrta nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
		{/if}
		<ArticleTable bind:articles emptyText="Nema nacrta." />
	</div>
</section>

<style>
	.art-section {
		max-width: 64rem;
	}
	.mgmt-head {
		margin-bottom: 1.5rem;
	}
	.mgmt-title {
		margin: 0;
		font-size: 1.6rem;
		font-weight: 700;
		color: #102e66;
	}
	.mgmt-sub {
		margin: 0.35rem 0 0;
		font-size: 0.95rem;
		color: #5b6577;
	}
	.btn-add {
		padding: 0.5rem 0.9rem;
		border: 0;
		border-radius: 8px;
		background: #102e66;
		color: #fff;
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
		text-decoration: none;
		white-space: nowrap;
	}
	.btn-add:hover {
		background: #0c2350;
	}
	.panel {
		border-radius: 14px;
		padding: 1.25rem 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}
	.art-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
</style>

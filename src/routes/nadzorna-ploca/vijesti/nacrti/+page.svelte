<script lang="ts">
	// Vijesti → Nacrti: draft articles (not yet public). Same table as Objavljene.
	import type { ArticleAdminRow } from '$lib/articles';
	import ArticleTable from '$lib/components/ArticleTable.svelte';
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
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<NewsIcon size={48} />
		<div>
			<h2 class="mgmt-title">Nacrti</h2>
			<p class="mgmt-sub">Članci u pripremi, još nisu objavljeni. Dovršite ih i objavite kada su spremni.</p>
		</div>
	</div>

	<div class="panel bg-white">
		{#if data.loadError}
			<p class="art-load-error" role="alert">Učitavanje nacrta nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
		{/if}
		<div class="art-scroll custom-scrollbar">
			<ArticleTable bind:articles emptyText="Nema nacrta." />
		</div>
	</div>
</section>

<style>
	.art-section {
		/* Full width, matching the Raspored Nacrti page. */
		width: 100%;
	}
	.art-scroll {
		overflow-x: auto;
		/* Scrollbar styling comes from the shared `.custom-scrollbar` class (library). */
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

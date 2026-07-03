<script lang="ts">
	// Vijesti → Objavljene vijesti: published articles (real backend data). Filters by
	// month + media type make a long list parseable; the list scrolls within a capped
	// height (same navy Hitno-style scrollbar) so the page itself doesn't grow forever.
	import {
		MEDIA_TYPE_LABEL,
		type ArticleAdminRow,
		type ArticleMediaType
	} from '$lib/articles';
	import ArticleTable from '$lib/components/ArticleTable.svelte';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import NewsIcon from '$lib/components/icons/NewsIcon.svelte';
	import FilterIcon from '$lib/components/icons/FilterIcon.svelte';

	let { data } = $props();
	// Local mutable copy (ArticleTable removes rows on delete); re-synced on load change.
	let articles = $state<ArticleAdminRow[]>([]);
	$effect(() => {
		articles = data.articles;
	});

	// ── Filters ────────────────────────────────────────────────────────────────
	let monthFilter = $state('all'); // 'all' | 'YYYY-MM'
	let typeFilter = $state('all'); // 'all' | ArticleMediaType

	const HR_MONTHS = [
		'siječanj', 'veljača', 'ožujak', 'travanj', 'svibanj', 'lipanj',
		'srpanj', 'kolovoz', 'rujan', 'listopad', 'studeni', 'prosinac'
	];

	// Month options built from the articles actually present (newest first), so you
	// only ever pick a month that has content. Value = YYYY-MM, label = "srpanj 2026.".
	const monthOptions = $derived.by(() => {
		const seen = new Map<string, string>();
		for (const a of articles) {
			if (!a.publishedAt) continue;
			const d = new Date(a.publishedAt);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
			if (!seen.has(key)) seen.set(key, `${HR_MONTHS[d.getMonth()]} ${d.getFullYear()}.`);
		}
		const opts = [...seen.entries()].sort((a, b) => b[0].localeCompare(a[0]));
		return [{ value: 'all', label: 'Svi mjeseci' }, ...opts.map(([value, label]) => ({ value, label }))];
	});

	const typeOptions = [
		{ value: 'all', label: 'Sve vrste' },
		...(Object.keys(MEDIA_TYPE_LABEL) as ArticleMediaType[]).map((v) => ({ value: v, label: MEDIA_TYPE_LABEL[v] }))
	];

	const filtered = $derived(
		articles.filter((a) => {
			if (typeFilter !== 'all' && a.mediaType !== typeFilter) return false;
			if (monthFilter !== 'all') {
				if (!a.publishedAt) return false;
				const d = new Date(a.publishedAt);
				const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
				if (key !== monthFilter) return false;
			}
			return true;
		})
	);
	// ArticleTable binds `articles` for its delete-removal; the filtered view is
	// read-only, so pass a copy and let deletes flow through the master list instead.
	function onDeleted(id: string) {
		articles = articles.filter((a) => a.id !== id);
	}
</script>

<svelte:head><title>Objavljene vijesti · VSK</title></svelte:head>

<section class="art-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<NewsIcon size={28} />
			<div>
				<h2 class="mgmt-title">Objavljene vijesti</h2>
				<p class="mgmt-sub">Članci vidljivi na javnoj stranici. Uredite ili uklonite objavljene vijesti.</p>
			</div>
		</div>
		<a class="btn-add cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/vijesti/novi">
			<AddIcon size={18} />
			Novi članak
		</a>
	</div>

	<div class="layout">
		<!-- Filter panel: its own div, standing to the LEFT of the articles. -->
		<aside class="panel bg-white filter-panel column-nowrap gap-1">
			<div class="filter-head display-f align-items-center justify-content-space-between">
				<h3 class="filter-heading display-f align-items-center gap-0-5">
					<FilterIcon size={18} />
					Filteri
				</h3>
				<span class="filter-count text-jet-grey">{filtered.length} od {articles.length}</span>
			</div>
			<div class="filter-item column-nowrap gap-0-3">
				<span class="filter-label">Mjesec</span>
				<DashSelect options={monthOptions} bind:value={monthFilter} ariaLabel="Filtriraj po mjesecu" />
			</div>
			<div class="filter-item column-nowrap gap-0-3">
				<span class="filter-label">Vrsta</span>
				<DashSelect options={typeOptions} bind:value={typeFilter} ariaLabel="Filtriraj po vrsti" />
			</div>
		</aside>

		<!-- Articles panel. -->
		<div class="panel bg-white articles-panel column-nowrap">
			{#if data.loadError}
				<p class="art-load-error" role="alert">Učitavanje vijesti nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
			{/if}
			<div class="art-scroll">
				<ArticleTable articles={filtered} emptyText="Nema vijesti za odabrane filtere." {onDeleted} />
			</div>
		</div>
	</div>
</section>

<style>
	.art-section {
		/* Full width: the white panel spans the whole grey content area side to side. */
		width: 100%;
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
	/* Two side-by-side panels: a fixed-width filter panel on the LEFT + the articles
	   panel filling the rest of the width. */
	.layout {
		display: grid;
		grid-template-columns: 16rem 1fr;
		gap: 1.25rem;
		align-items: start;
	}
	.filter-panel {
		position: sticky;
		top: 1rem;
	}
	.filter-heading {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: #102e66;
	}
	.articles-panel {
		min-width: 0;
	}
	.art-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.filter-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #5b6577;
	}
	.filter-count {
		font-size: 0.85rem;
	}
	/* Cap the list height so the page never grows past the screen; scroll within.
	   Navy scrollbar to match the Hitno panel. calc keeps it within the viewport
	   below the header + filter bar. */
	.art-scroll {
		max-height: calc(100vh - 22rem);
		min-height: 8rem;
		overflow-y: auto;
		/* Suppress the tiny sub-pixel horizontal overflow (rounding) so no stray
		   x-scrollbar appears; the row fits within the panel. */
		overflow-x: hidden;
	}
	.art-scroll::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	.art-scroll::-webkit-scrollbar-track {
		background: transparent;
	}
	.art-scroll::-webkit-scrollbar-thumb {
		background: #102e66;
		border-radius: 4px;
	}
	.art-scroll::-webkit-scrollbar-corner {
		background: transparent;
	}
	.art-scroll::-webkit-scrollbar-button {
		display: none;
		width: 0;
		height: 0;
	}
	/* Stack the filter panel above the articles on narrow screens. */
	@media (max-width: 820px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.filter-panel {
			position: static;
		}
	}
</style>

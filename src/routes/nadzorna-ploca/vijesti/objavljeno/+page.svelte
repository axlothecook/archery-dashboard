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
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';

	let { data } = $props();

	// Mobile: the filter panel collapses behind a "Filteri" bar (tap to expand) so the
	// article list is at the top on a phone. Ignored on desktop (filters always shown).
	let filtersOpen = $state(false);
	// Local mutable copy (ArticleTable removes rows on delete); re-synced on load change.
	let articles = $state<ArticleAdminRow[]>([]);
	$effect(() => {
		articles = data.articles;
	});

	// ── Filters ────────────────────────────────────────────────────────────────
	let monthFilter = $state('all'); // 'all' | 'YYYY-MM'
	let typeFilter = $state('all'); // 'all' | ArticleMediaType
	// Stanje: this page loads only PUBLISHED articles, which are either visible
	// (Objavljeno) or hidden (Skriveno) — drafts live on the Nacrti page.
	let statusFilter = $state('all'); // 'all' | 'visible' | 'hidden'

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

	const statusOptions = [
		{ value: 'all', label: 'Sve' },
		{ value: 'visible', label: 'Objavljeno' },
		{ value: 'hidden', label: 'Skriveno' }
	];

	const filtered = $derived(
		articles.filter((a) => {
			if (typeFilter !== 'all' && a.mediaType !== typeFilter) return false;
			if (statusFilter === 'visible' && a.hidden) return false;
			if (statusFilter === 'hidden' && !a.hidden) return false;
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
			<NewsIcon size={48} />
			<div>
				<h2 class="mgmt-title">Objavljene vijesti</h2>
				<p class="mgmt-sub">Članci vidljivi na javnoj stranici. Uredite ili uklonite objavljene vijesti.</p>
			</div>
		</div>
		<!-- Desktop: sits to the right of the title. Mobile: hidden here; a full-width copy
		     (below) takes over so it spans like the Filteri bar. -->
		<a class="btn-add btn-add--inline cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/vijesti/novi">
			<AddIcon size={18} />
			Novi članak
		</a>
	</div>

	<!-- Mobile-only: full-width "Novi članak" below the title (spans like the Filteri bar). -->
	<a class="btn-add btn-add--block cursor-pointer display-f align-items-center justify-content-center gap-0-4" href="/nadzorna-ploca/vijesti/novi">
		<AddIcon size={18} />
		Novi članak
	</a>

	<div class="layout">
		<!-- Filter panel: its own div, standing to the LEFT of the articles. -->
		<aside class="panel bg-white filter-panel column-nowrap gap-1" class:is-open={filtersOpen}>
			<!-- Head doubles as the mobile collapse toggle (tap to expand/collapse). On desktop
			     the chevron is hidden and the panel is always open (CSS). -->
			<button
				class="filter-head filter-toggle display-f align-items-center justify-content-space-between w-full cursor-pointer"
				type="button"
				aria-expanded={filtersOpen}
				onclick={() => (filtersOpen = !filtersOpen)}
			>
				<h3 class="filter-heading display-f align-items-center gap-0-5">
					<FilterIcon size={18} />
					Filteri
				</h3>
				<span class="filter-head-right display-f align-items-center gap-0-6">
					<span class="filter-count text-jet-grey">{filtered.length} od {articles.length}</span>
					<span class="filter-chevron display-f" class:open={filtersOpen} aria-hidden="true">
						<ChevronIcon direction="right" size={18} />
					</span>
				</span>
			</button>
			<div class="filter-body column-nowrap gap-1">
			<div class="filter-item column-nowrap gap-0-3">
				<span class="filter-label">Mjesec</span>
				<DashSelect options={monthOptions} bind:value={monthFilter} ariaLabel="Filtriraj po mjesecu" />
			</div>
			<div class="filter-item column-nowrap gap-0-3">
				<span class="filter-label">Vrsta</span>
				<!-- Flat single-select list (not a dropdown): all options shown; the chosen
				     one gets a filled square + white tick. Default = Sve vrste. -->
				<div class="vrsta-list column-nowrap" role="radiogroup" aria-label="Filtriraj po vrsti">
					{#each typeOptions as opt (opt.value)}
						<button
							type="button"
							class="vrsta-opt display-f align-items-center gap-0-6 cursor-pointer"
							role="radio"
							aria-checked={typeFilter === opt.value}
							onclick={() => (typeFilter = opt.value)}
						>
							<span class="vrsta-box display-f align-items-center justify-content-center" class:checked={typeFilter === opt.value} aria-hidden="true">
								{#if typeFilter === opt.value}<CheckIcon size={13} />{/if}
							</span>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
			<div class="filter-item column-nowrap gap-0-3">
				<span class="filter-label">Stanje</span>
				<div class="vrsta-list column-nowrap" role="radiogroup" aria-label="Filtriraj po stanju">
					{#each statusOptions as opt (opt.value)}
						<button
							type="button"
							class="vrsta-opt display-f align-items-center gap-0-6 cursor-pointer"
							role="radio"
							aria-checked={statusFilter === opt.value}
							onclick={() => (statusFilter = opt.value)}
						>
							<span class="vrsta-box display-f align-items-center justify-content-center" class:checked={statusFilter === opt.value} aria-hidden="true">
								{#if statusFilter === opt.value}<CheckIcon size={13} />{/if}
							</span>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
			</div>
		</aside>

		<!-- Articles panel. -->
		<div class="panel bg-white articles-panel column-nowrap">
			{#if data.loadError}
				<p class="art-load-error" role="alert">Učitavanje vijesti nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
			{/if}
			<div class="art-scroll custom-scrollbar">
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
	/* The full-width mobile copy is hidden on desktop; the inline (header-right) copy shows. */
	.btn-add--block {
		display: none;
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
		/* Fill the remaining height of the section so the articles panel + its inner
		   scroll bound to the shared frame (no page scroll). */
		flex: 1 1 auto;
		min-height: 0;
	}
	.filter-panel {
		position: sticky;
		top: 1rem;
		/* Wider breathing room between the three filter groups (overrides the
		   `gap-1` utility on the aside). */
		gap: 1.75rem;
	}
	.filter-heading {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: #102e66;
	}
	/* The head is a <button> (mobile toggle). On desktop strip the button chrome so it reads
	   as a plain heading, hide the chevron, and keep the body always visible. */
	.filter-toggle {
		padding: 0;
		border: 0;
		background: none;
		font-family: inherit;
		text-align: left;
	}
	.filter-chevron {
		display: none; /* desktop: no chevron */
		color: #5b6577;
		transition: transform 0.18s ease;
	}
	.filter-chevron.open {
		transform: rotate(90deg);
	}
	.articles-panel {
		min-width: 0;
		/* Fill the grid row height + be a flex column so .art-scroll bounds to it. */
		align-self: stretch;
		min-height: 0;
	}
	.art-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.filter-label {
		font-size: 0.95rem;
		font-weight: 600;
		color: #5b6577;
	}
	/* Vrsta: flat single-select list (radio-style). */
	.vrsta-list {
		gap: 0.15rem;
	}
	.vrsta-opt {
		gap: 0.55rem;
		padding: 0.35rem 0.3rem;
		border: 0;
		background: none;
		text-align: left;
		font-size: 0.9rem;
		font-family: inherit;
		color: #102e66;
		border-radius: 6px;
	}
	.vrsta-opt:hover {
		background: #f1f4fa;
	}
	/* The square: empty by default, filled with the Filteri navy + a white tick when
	   selected. */
	.vrsta-box {
		width: 16px;
		height: 16px;
		flex: 0 0 auto;
		border: 1.5px solid #b9c3d3;
		border-radius: 4px;
		background: #fff;
		color: #fff; /* the tick's currentColor */
	}
	.vrsta-box.checked {
		border-color: #102e66;
		background: #102e66; /* same as the Filteri heading text colour */
	}
	.filter-count {
		font-size: 0.85rem;
	}
	/* The list fills the remaining height of the shared content frame and scrolls inside
	   (the page itself never scrolls — see .admin-content). No per-page viewport calc:
	   flex + min-height:0 lets it bound to whatever height the shared frame gives it. */
	.art-scroll {
		flex: 1 1 auto;
		min-height: 8rem;
		overflow-y: auto;
		/* Columns are kept to the RIGHT (wide title + wide inter-column gaps), which can
		   exceed the panel width — allow horizontal scroll so the actions stay reachable
		   rather than clipping them. */
		overflow-x: auto;
		/* Push the scroll area out to the panel's right edge (cancel the panel's 1.5rem right
		   padding) so the SCROLLBAR sits flush at the white div's right edge; the padding-right
		   then keeps a gap between the table content and the scrollbar. */
		margin-right: -1.5rem;
		padding-right: 1rem;
		/* Scrollbar styling comes from the shared `.custom-scrollbar` class (library). */
	}
	/* Phone/tablet: stack the filter panel above the articles, and COLLAPSE it behind the
	   "Filteri" bar (tap to expand) so the article list starts near the top. */
	@media (max-width: 820px) {
		/* Fit the whole page to the viewport so the PAGE doesn't scroll — only the article
		   list scrolls inside its panel. The section fills the space under the top bar
		   (100dvh − top bar − content padding); header + Filteri bar are fixed height and
		   the .layout/.articles-panel/.art-scroll flex chain gives the rest to the list. */
		.art-section {
			display: flex;
			flex-direction: column;
			/* 100dvh − top bar (≈70px) − content padding (20px top + 20px bottom). Slight extra
			   subtracted so a rounding hair never spills into a page scrollbar. */
			height: calc(100dvh - 70px - 44px);
			min-height: 0;
		}
		.mgmt-head {
			flex: 0 0 auto;
			margin-bottom: 1.5rem;
		}
		/* "Novi članak": the header-right inline copy is hidden; the full-width block copy
		   (below the title) takes over so it spans like the Filteri bar. */
		.btn-add--inline {
			display: none;
		}
		.btn-add--block {
			display: flex;
			flex: 0 0 auto;
			width: 100%;
			padding: 0.7rem 1rem;
			font-size: 0.95rem;
			margin-bottom: 0.75rem;
		}
		/* Stack as a flex COLUMN so the filter bar + article panel sit with a small gap and
		   the panel flex-grows to fill the remaining height (grid left an oversized gap). */
		.layout {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			flex: 1 1 auto;
			min-height: 0;
		}
		.filter-panel {
			position: static;
			gap: 0; /* the head + body manage their own spacing when collapsible */
			flex: 0 0 auto;
			width: 100%; /* full-width bar (flex-column parent would otherwise shrink it) */
		}
		.articles-panel {
			flex: 1 1 auto;
			min-height: 0;
		}
		/* Chevron appears; head becomes a tappable bar. */
		.filter-chevron {
			display: inline-flex;
		}
		/* Collapsed by default: hide the filter body until the panel is open. */
		.filter-body {
			display: none;
			margin-top: 1.25rem;
		}
		.filter-panel.is-open .filter-body {
			display: flex;
		}
		/* Fills the panel (which fills the bounded section) and scrolls INSIDE — rows reach
		   the panel's bottom padding, the page itself never scrolls. */
		.art-scroll {
			flex: 1 1 auto;
			min-height: 0;
			max-height: none;
		}
	}
</style>

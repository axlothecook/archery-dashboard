<script lang="ts">
	// Raspored → Svi događaji: published events (real backend data). Mirrors the
	// Objavljene vijesti page exactly — a left filter panel (Mjesec dropdown +
	// flat Disciplina/Stanje radio lists) beside a capped-scroll events panel.
	// Drafts live on the Nacrti subpage.
	import {
		DISCIPLINE_LABEL,
		type EventAdminRow,
		type Discipline
	} from '$lib/events';
	import EventTable from '$lib/components/EventTable.svelte';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import FilterIcon from '$lib/components/icons/FilterIcon.svelte';
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';

	let { data } = $props();

	// Mobile: filters collapse behind a tappable "Filteri" bar (same as Objavljene vijesti).
	let filtersOpen = $state(false);
	let events = $state<EventAdminRow[]>([]);
	$effect(() => {
		events = data.events;
	});

	// ── Filters ────────────────────────────────────────────────────────────────
	let monthFilter = $state('all'); // 'all' | 'YYYY-MM'
	let disciplineFilter = $state('all'); // 'all' | Discipline
	// Stanje: this page loads only PUBLISHED events, which are visible (Objavljeno),
	// hidden (Skriveno) or cancelled (Otkazano) — drafts live on the Nacrti page.
	let statusFilter = $state('all'); // 'all' | 'visible' | 'hidden' | 'cancelled'

	const HR_MONTHS = [
		'siječanj', 'veljača', 'ožujak', 'travanj', 'svibanj', 'lipanj',
		'srpanj', 'kolovoz', 'rujan', 'listopad', 'studeni', 'prosinac'
	];

	const monthOptions = $derived.by(() => {
		const seen = new Map<string, string>();
		for (const e of events) {
			const d = new Date(e.dateFrom);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
			if (!seen.has(key)) seen.set(key, `${HR_MONTHS[d.getMonth()]} ${d.getFullYear()}.`);
		}
		const opts = [...seen.entries()].sort((a, b) => b[0].localeCompare(a[0]));
		return [{ value: 'all', label: 'Svi mjeseci' }, ...opts.map(([value, label]) => ({ value, label }))];
	});

	const disciplineOptions = [
		{ value: 'all', label: 'Sve discipline' },
		...(Object.keys(DISCIPLINE_LABEL) as Discipline[]).map((v) => ({ value: v, label: DISCIPLINE_LABEL[v] }))
	];

	const statusOptions = [
		{ value: 'all', label: 'Sve' },
		{ value: 'visible', label: 'Objavljeno' },
		{ value: 'hidden', label: 'Skriveno' },
		{ value: 'cancelled', label: 'Otkazano' }
	];

	const filtered = $derived(
		events.filter((e) => {
			if (disciplineFilter !== 'all' && e.discipline !== disciplineFilter) return false;
			if (statusFilter === 'visible' && (e.hidden || e.isCancelled)) return false;
			if (statusFilter === 'hidden' && !e.hidden) return false;
			if (statusFilter === 'cancelled' && !e.isCancelled) return false;
			if (monthFilter !== 'all') {
				const d = new Date(e.dateFrom);
				const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
				if (key !== monthFilter) return false;
			}
			return true;
		})
	);

	function onDeleted(id: string) {
		events = events.filter((e) => e.id !== id);
	}
</script>

<svelte:head><title>Svi događaji · VSK</title></svelte:head>

<section class="ev-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<CalendarIcon size={48} />
			<div>
				<h2 class="mgmt-title">Svi događaji</h2>
				<p class="mgmt-sub">Natjecanja i događaji kluba. Uredite ili uklonite događaje.</p>
			</div>
		</div>
		<a class="btn-add btn-add--inline cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/raspored/novi">
			<AddIcon size={18} />
			Novi događaj
		</a>
	</div>

	<div class="layout">
		<!-- Mobile-only: full-width "Novi događaj" at the TOP of the white card (CSS). -->
		<a class="btn-add btn-add--block cursor-pointer display-f align-items-center justify-content-center gap-0-4" href="/nadzorna-ploca/raspored/novi">
			<AddIcon size={18} />
			Novi događaj
		</a>
		<!-- Filter panel: its own div, standing to the LEFT of the events. -->
		<aside class="panel bg-white filter-panel column-nowrap gap-1" class:is-open={filtersOpen}>
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
					<span class="filter-count text-jet-grey">{filtered.length} od {events.length}</span>
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
				<span class="filter-label">Disciplina</span>
				<!-- Flat single-select list (not a dropdown): all options shown; the chosen
				     one gets a filled square + white tick. Default = Sve discipline. -->
				<div class="vrsta-list column-nowrap" role="radiogroup" aria-label="Filtriraj po disciplini">
					{#each disciplineOptions as opt (opt.value)}
						<button
							type="button"
							class="vrsta-opt display-f align-items-center gap-0-6 cursor-pointer"
							role="radio"
							aria-checked={disciplineFilter === opt.value}
							onclick={() => (disciplineFilter = opt.value)}
						>
							<span class="vrsta-box display-f align-items-center justify-content-center" class:checked={disciplineFilter === opt.value} aria-hidden="true">
								{#if disciplineFilter === opt.value}<CheckIcon size={13} />{/if}
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

		<!-- Events panel. -->
		<div class="panel bg-white events-panel column-nowrap">
			{#if data.loadError}
				<p class="ev-load-error" role="alert">Učitavanje događaja nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
			{/if}
			<div class="ev-scroll custom-scrollbar">
				<EventTable events={filtered} emptyText="Nema događaja za odabrane filtere." {onDeleted} />
			</div>
		</div>
	</div>
</section>

<style>
	.ev-section {
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
	/* Two side-by-side panels: a fixed-width filter panel on the LEFT + the events
	   panel filling the rest of the width. */
	.layout {
		display: grid;
		grid-template-columns: 16rem 1fr;
		gap: 1.25rem;
		align-items: start;
		flex: 1 1 auto;
		min-height: 0;
	}
	.filter-panel {
		position: sticky;
		top: 1rem;
		/* Wider breathing room between the filter groups (overrides the `gap-1`
		   utility on the aside). */
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
	.events-panel {
		min-width: 0;
		align-self: stretch;
		min-height: 0;
	}
	.ev-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.filter-label {
		font-size: 0.95rem;
		font-weight: 600;
		color: #5b6577;
	}
	/* Disciplina/Stanje: flat single-select list (radio-style). Shared class names
	   with the Vijesti page. */
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
	.ev-scroll {
		flex: 1 1 auto;
		min-height: 8rem;
		overflow-y: auto;
		overflow-x: auto;
		/* Reserve the vertical-scrollbar gutter even when few (filtered) rows don't scroll,
		   so the table width — and with it the column positions — never shifts with row count. */
		scrollbar-gutter: stable;
		/* Scrollbar flush to the panel's right edge (cancel the panel's 1.5rem right padding);
		   padding-right keeps a gap between the table content and the scrollbar. */
		margin-right: -1.5rem;
		padding-right: 1rem;
		/* Scrollbar styling comes from the shared `.custom-scrollbar` class (library). */
	}

	/* Phone/tablet: fit the page to the viewport (only the event list scrolls, inside its
	   panel); collapse the filters behind the "Filteri" bar; full-width "Novi događaj". */
	@media (max-width: 820px) {
		.ev-section {
			display: flex;
			flex-direction: column;
			/* 100dvh − top bar (≈70px) − content padding (20px top + 20px bottom). */
			height: calc(100dvh - 70px - 44px);
			min-height: 0;
		}
		.mgmt-head {
			flex: 0 0 auto;
			margin-bottom: 1.5rem;
		}
		.btn-add--inline {
			display: none;
		}
		/* The whole .layout is ONE white card (edge-to-edge): navy "Novi događaj" at the top,
		   then Filteri bar, then table — no gaps. */
		.layout {
			display: flex;
			flex-direction: column;
			gap: 0;
			flex: 1 1 auto;
			min-height: 0;
			background: #fff;
			margin-left: -1rem;
			margin-right: -1rem;
			padding: 1rem;
			border-radius: 0;
		}
		.btn-add--block {
			display: flex;
			flex: 0 0 auto;
			width: 100%;
			padding: 0.7rem 1rem;
			font-size: 0.95rem;
			margin-bottom: 1.6rem;
		}
		/* Bordered box around the Filteri panel (collapsed AND open) so it's clearly distinct. */
		.filter-panel {
			position: static;
			gap: 0;
			flex: 0 0 auto;
			align-self: stretch;
			background: none;
			box-shadow: none;
			border: 1px solid #d7dee8;
			border-radius: 10px;
			padding: 0.85rem 1rem;
			margin-bottom: 1.6rem;
		}
		.events-panel {
			flex: 1 1 auto;
			min-height: 0;
			background: none;
			box-shadow: none;
			padding: 0;
			border-radius: 0;
		}
		.filter-chevron {
			display: inline-flex;
		}
		.filter-body {
			display: none;
			margin-top: 1.25rem;
		}
		.filter-panel.is-open .filter-body {
			display: flex;
		}
		.ev-scroll {
			flex: 1 1 auto;
			min-height: 0;
			max-height: none;
			margin-right: -1rem;
			padding-right: 0.75rem;
		}
	}
</style>

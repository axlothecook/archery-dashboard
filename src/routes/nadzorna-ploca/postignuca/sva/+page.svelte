<script lang="ts">
	// Postignuća → Sva postignuća: achievement list (real backend data). A left filter
	// panel (Godina dropdown + flat Vrsta/Razina radio lists) beside a capped-scroll
	// achievements panel — mirrors the Svi događaji / Objavljene vijesti pages.
	import {
		TYPE_LABEL,
		LEVEL_LABEL,
		type AchievementType,
		type AchievementLevel,
		type AchievementAdminRow
	} from '$lib/achievements';
	import AchievementTable from '$lib/components/AchievementTable.svelte';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import TrophyIcon from '$lib/components/icons/TrophyIcon.svelte';
	import FilterIcon from '$lib/components/icons/FilterIcon.svelte';
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';

	let { data } = $props();
	let achievements = $state<AchievementAdminRow[]>([]);
	$effect(() => {
		achievements = data.achievements;
	});

	// ── Filters ────────────────────────────────────────────────────────────────
	let yearFilter = $state('all'); // 'all' | 'YYYY'
	let typeFilter = $state('all'); // 'all' | AchievementType
	let levelFilter = $state('all'); // 'all' | AchievementLevel

	// Year options built from the achievements actually present (newest first).
	const yearOptions = $derived.by(() => {
		const years = [...new Set(achievements.map((a) => a.year))].sort((a, b) => b - a);
		return [{ value: 'all', label: 'Sve godine' }, ...years.map((y) => ({ value: String(y), label: `${y}.` }))];
	});

	const typeOptions = [
		{ value: 'all', label: 'Sve vrste' },
		...(Object.keys(TYPE_LABEL) as AchievementType[]).map((v) => ({ value: v, label: TYPE_LABEL[v] }))
	];

	const levelOptions = [
		{ value: 'all', label: 'Sve razine' },
		...(Object.keys(LEVEL_LABEL) as AchievementLevel[]).map((v) => ({ value: v, label: LEVEL_LABEL[v] }))
	];

	const filtered = $derived(
		achievements.filter((a) => {
			if (typeFilter !== 'all' && a.type !== typeFilter) return false;
			if (levelFilter !== 'all' && a.level !== levelFilter) return false;
			if (yearFilter !== 'all' && String(a.year) !== yearFilter) return false;
			return true;
		})
	);

	function onDeleted(id: string) {
		achievements = achievements.filter((a) => a.id !== id);
	}
</script>

<svelte:head><title>Sva postignuća · VSK</title></svelte:head>

<section class="ac-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<TrophyIcon size={40} />
			<div>
				<h2 class="mgmt-title">Sva postignuća</h2>
				<p class="mgmt-sub">Naslovi, rekordi i medalje kluba. Uredite ili uklonite postignuća.</p>
			</div>
		</div>
		<a class="btn-add cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/postignuca/novo">
			<AddIcon size={18} />
			Novo postignuće
		</a>
	</div>

	<div class="layout">
		<!-- Filter panel: its own div, standing to the LEFT of the achievements. -->
		<aside class="panel bg-white filter-panel column-nowrap gap-1">
			<div class="filter-head display-f align-items-center justify-content-space-between">
				<h3 class="filter-heading display-f align-items-center gap-0-5">
					<FilterIcon size={18} />
					Filteri
				</h3>
				<span class="filter-count text-jet-grey">{filtered.length} od {achievements.length}</span>
			</div>
			<div class="filter-item column-nowrap gap-0-3">
				<span class="filter-label">Godina</span>
				<DashSelect options={yearOptions} bind:value={yearFilter} ariaLabel="Filtriraj po godini" />
			</div>
			<div class="filter-item column-nowrap gap-0-3">
				<span class="filter-label">Vrsta</span>
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
				<span class="filter-label">Razina</span>
				<div class="vrsta-list column-nowrap" role="radiogroup" aria-label="Filtriraj po razini">
					{#each levelOptions as opt (opt.value)}
						<button
							type="button"
							class="vrsta-opt display-f align-items-center gap-0-6 cursor-pointer"
							role="radio"
							aria-checked={levelFilter === opt.value}
							onclick={() => (levelFilter = opt.value)}
						>
							<span class="vrsta-box display-f align-items-center justify-content-center" class:checked={levelFilter === opt.value} aria-hidden="true">
								{#if levelFilter === opt.value}<CheckIcon size={13} />{/if}
							</span>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
		</aside>

		<!-- Achievements panel. -->
		<div class="panel bg-white ac-panel column-nowrap">
			{#if data.loadError}
				<p class="ac-load-error" role="alert">Učitavanje postignuća nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
			{/if}
			<div class="ac-scroll custom-scrollbar">
				<AchievementTable achievements={filtered} emptyText="Nema postignuća za odabrane filtere." {onDeleted} />
			</div>
		</div>
	</div>
</section>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	// Library palette colours (exact matches).
	$navy: map.get(lib.$colors, 'deep-sapphire');

	.ac-section {
		/* Fill the shared content frame as a flex column so the table panel bounds to it. */
		width: 100%;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
	}
	.mgmt-head {
		margin-bottom: 1.5rem;
	}
	.mgmt-title {
		margin: 0;
		font-size: 1.6rem;
		font-weight: 700;
		color: $navy;
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
		background: $navy;
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
	/* Two side-by-side panels: a fixed-width filter panel on the LEFT + the achievements
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
		/* Wider breathing room between the filter groups (overrides the `gap-1` utility). */
		gap: 1.75rem;
	}
	.filter-heading {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: $navy;
	}
	/* Achievements panel: fills the grid row height + a flex column so .ac-scroll bounds
	   to it and scrolls inside (the page never grows past the viewport). */
	.ac-panel {
		min-width: 0;
		align-self: stretch;
		min-height: 0;
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
	}
	.ac-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.ac-scroll {
		flex: 1 1 auto;
		min-height: 8rem;
		overflow: auto;
		/* Scrollbar styling comes from the shared `.custom-scrollbar` class (library). */
	}
	.filter-label {
		font-size: 0.95rem;
		font-weight: 600;
		color: #5b6577;
	}
	/* Vrsta/Razina: flat single-select list (radio-style). Shared class names with the
	   Vijesti / Raspored filter pages. */
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
		color: $navy;
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
		border-color: $navy;
		background: $navy; /* same as the Filteri heading text colour */
	}
	.filter-count {
		font-size: 0.85rem;
	}
	/* Stack the filter panel above the achievements on narrow screens. */
	@media (max-width: 820px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.filter-panel {
			position: static;
		}
	}
</style>

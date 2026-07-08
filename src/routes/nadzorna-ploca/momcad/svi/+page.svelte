<script lang="ts">
	// Momčad → Svi streličari: archer roster (real backend data). A left filter panel
	// (role / bow / status flat radio lists) beside a capped-scroll archers panel —
	// mirrors the Sva postignuća / Svi događaji pages. Drafts are excluded here (they
	// live under Nacrti); this shows published + hidden archers.
	import {
		ROLE_LABEL,
		BOW_LABEL,
		type Role,
		type Bow,
		type ArcherAdminRow
	} from '$lib/archers';
	import ArcherTable from '$lib/components/ArcherTable.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import FilterIcon from '$lib/components/icons/FilterIcon.svelte';
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';

	let { data } = $props();

	// Mobile: filters collapse behind a tappable "Filteri" bar (same as Svi događaji).
	let filtersOpen = $state(false);
	// Published + hidden (everything that isn't a draft) belongs on this page.
	let archers = $state<ArcherAdminRow[]>([]);
	$effect(() => {
		archers = data.archers.filter((a) => a.status !== 'draft');
	});

	// ── Filters ────────────────────────────────────────────────────────────────
	let roleFilter = $state('all'); // 'all' | Role
	let bowFilter = $state('all'); // 'all' | Bow
	let visFilter = $state('all'); // 'all' | 'visible' | 'hidden'

	const roleOptions = [
		{ value: 'all', label: 'Sve uloge' },
		...(Object.keys(ROLE_LABEL) as Role[]).map((v) => ({ value: v, label: ROLE_LABEL[v] }))
	];
	const bowOptions = [
		{ value: 'all', label: 'Svi lukovi' },
		...(Object.keys(BOW_LABEL) as Bow[]).map((v) => ({ value: v, label: BOW_LABEL[v] }))
	];
	const visOptions = [
		{ value: 'all', label: 'Sve' },
		{ value: 'visible', label: 'Objavljeno' },
		{ value: 'hidden', label: 'Skriveno' }
	];

	const filtered = $derived(
		archers.filter((a) => {
			if (roleFilter !== 'all' && !a.roles.includes(roleFilter as Role)) return false;
			if (bowFilter !== 'all' && !a.bowType.includes(bowFilter as Bow)) return false;
			if (visFilter === 'visible' && a.hidden) return false;
			if (visFilter === 'hidden' && !a.hidden) return false;
			return true;
		})
	);

	function onDeleted(id: string) {
		archers = archers.filter((a) => a.id !== id);
	}
</script>

<svelte:head><title>Svi streličari · VSK</title></svelte:head>

<section class="ar-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<PersonIcon size={48} />
			<div>
				<h2 class="mgmt-title">Svi streličari</h2>
				<p class="mgmt-sub">Momčad kluba. Pregledajte, uredite ili uklonite streličare i trenere.</p>
			</div>
		</div>
		<a class="btn-add btn-add--inline cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/momcad/novi">
			<AddIcon size={18} />
			Novi streličar
		</a>
	</div>

	<div class="layout">
		<!-- Mobile-only: full-width "Novi streličar" at the TOP of the white card (CSS). -->
		<a class="btn-add btn-add--block cursor-pointer display-f align-items-center justify-content-center gap-0-4" href="/nadzorna-ploca/momcad/novi">
			<AddIcon size={18} />
			Novi streličar
		</a>
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
					<span class="filter-count text-jet-grey">{filtered.length} od {archers.length}</span>
					<span class="filter-chevron display-f" class:open={filtersOpen} aria-hidden="true">
						<ChevronIcon direction="right" size={18} />
					</span>
				</span>
			</button>
			<div class="filter-body column-nowrap gap-1">
			<div class="filter-item column-nowrap gap-0-3">
				<span class="filter-label">Uloga</span>
				<div class="opt-list column-nowrap" role="radiogroup" aria-label="Filtriraj po ulozi">
					{#each roleOptions as opt (opt.value)}
						<button
							type="button"
							class="opt display-f align-items-center gap-0-6 cursor-pointer"
							role="radio"
							aria-checked={roleFilter === opt.value}
							onclick={() => (roleFilter = opt.value)}
						>
							<span class="opt-box display-f align-items-center justify-content-center" class:checked={roleFilter === opt.value} aria-hidden="true">
								{#if roleFilter === opt.value}<CheckIcon size={13} />{/if}
							</span>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
			<div class="filter-item column-nowrap gap-0-3">
				<span class="filter-label">Luk</span>
				<div class="opt-list column-nowrap" role="radiogroup" aria-label="Filtriraj po luku">
					{#each bowOptions as opt (opt.value)}
						<button
							type="button"
							class="opt display-f align-items-center gap-0-6 cursor-pointer"
							role="radio"
							aria-checked={bowFilter === opt.value}
							onclick={() => (bowFilter = opt.value)}
						>
							<span class="opt-box display-f align-items-center justify-content-center" class:checked={bowFilter === opt.value} aria-hidden="true">
								{#if bowFilter === opt.value}<CheckIcon size={13} />{/if}
							</span>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
			<div class="filter-item column-nowrap gap-0-3">
				<span class="filter-label">Vidljivost</span>
				<div class="opt-list column-nowrap" role="radiogroup" aria-label="Filtriraj po vidljivosti">
					{#each visOptions as opt (opt.value)}
						<button
							type="button"
							class="opt display-f align-items-center gap-0-6 cursor-pointer"
							role="radio"
							aria-checked={visFilter === opt.value}
							onclick={() => (visFilter = opt.value)}
						>
							<span class="opt-box display-f align-items-center justify-content-center" class:checked={visFilter === opt.value} aria-hidden="true">
								{#if visFilter === opt.value}<CheckIcon size={13} />{/if}
							</span>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
			</div>
		</aside>

		<div class="panel bg-white ar-panel column-nowrap">
			{#if data.loadError}
				<p class="ar-load-error" role="alert">Učitavanje streličara nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
			{/if}
			<div class="ar-scroll custom-scrollbar">
				<ArcherTable archers={filtered} emptyText="Nema streličara za odabrane filtere." {onDeleted} />
			</div>
		</div>
	</div>
</section>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');

	.ar-section {
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
	/* The full-width mobile copy is hidden on desktop; the inline (header-right) copy shows. */
	.btn-add--block {
		display: none;
	}
	.panel {
		border-radius: 14px;
		padding: 1.25rem 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}
	/* Filter head is a <button> (mobile toggle). Desktop: plain heading look, no chevron. */
	.filter-toggle {
		padding: 0;
		border: 0;
		background: none;
		font-family: inherit;
		text-align: left;
	}
	.filter-chevron {
		display: none;
		color: #5b6577;
		transition: transform 0.18s ease;
	}
	.filter-chevron.open {
		transform: rotate(90deg);
	}
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
		gap: 1.75rem;
	}
	.filter-heading {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: $navy;
	}
	.ar-panel {
		min-width: 0;
		align-self: stretch;
		min-height: 0;
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
	}
	.ar-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.ar-scroll {
		flex: 1 1 auto;
		min-height: 8rem;
		overflow: auto;
		/* Scrollbar flush to the panel's right edge with a content gap (matches Svi događaji). */
		margin-right: -1.5rem;
		padding-right: 1rem;
	}
	.filter-label {
		font-size: 0.95rem;
		font-weight: 600;
		color: #5b6577;
	}
	.opt-list {
		gap: 0.15rem;
	}
	.opt {
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
	.opt:hover {
		background: #f1f4fa;
	}
	.opt-box {
		width: 16px;
		height: 16px;
		flex: 0 0 auto;
		border: 1.5px solid #b9c3d3;
		border-radius: 4px;
		background: #fff;
		color: #fff;
	}
	.opt-box.checked {
		border-color: $navy;
		background: $navy;
	}
	.filter-count {
		font-size: 0.85rem;
	}
	/* Phone/tablet: fit the page to the viewport (only the list scrolls, inside its panel);
	   collapse filters behind the "Filteri" bar; full-width "Novi streličar"; edge-to-edge
	   white panels (touch the grey area's sides, like the novi/event forms). */
	@media (max-width: 820px) {
		.ar-section {
			display: flex;
			flex-direction: column;
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
		/* The whole .layout is ONE white card (edge-to-edge): navy "Novi streličar" at the top,
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
		.ar-panel {
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
		.ar-scroll {
			flex: 1 1 auto;
			min-height: 0;
			max-height: none;
			margin-right: -1rem;
			padding-right: 0.75rem;
		}
	}
</style>

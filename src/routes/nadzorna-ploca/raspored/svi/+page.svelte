<script lang="ts">
	// Raspored → Svi događaji: all events (real backend data). Filters by month,
	// discipline and status; capped scroll (navy Hitno-style scrollbar). Mirrors the
	// Objavljene vijesti page.
	import {
		DISCIPLINE_LABEL,
		type EventAdminRow,
		type Discipline,
		type EventStatus
	} from '$lib/events';
	import EventTable from '$lib/components/EventTable.svelte';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';

	let { data } = $props();
	let events = $state<EventAdminRow[]>([]);
	$effect(() => {
		events = data.events;
	});

	let monthFilter = $state('all');
	let disciplineFilter = $state('all');
	let statusFilter = $state('all');

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
		{ value: 'all', label: 'Sva stanja' },
		{ value: 'published', label: 'Objavljeno' },
		{ value: 'draft', label: 'Nacrt' }
	];

	const filtered = $derived(
		events.filter((e) => {
			if (disciplineFilter !== 'all' && e.discipline !== disciplineFilter) return false;
			if (statusFilter !== 'all' && e.status !== (statusFilter as EventStatus)) return false;
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
			<CalendarIcon size={28} />
			<div>
				<h2 class="mgmt-title">Svi događaji</h2>
				<p class="mgmt-sub">Natjecanja i događaji kluba. Uredite ili uklonite događaje.</p>
			</div>
		</div>
		<a class="btn-add cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/raspored/novi">
			<AddIcon size={18} />
			Novi događaj
		</a>
	</div>

	<div class="panel bg-white column-nowrap">
		{#if data.loadError}
			<p class="ev-load-error" role="alert">Učitavanje događaja nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
		{/if}

		<div class="filter-bar display-f align-items-center gap-1">
			<div class="filter-item">
				<span class="filter-label">Mjesec</span>
				<DashSelect options={monthOptions} bind:value={monthFilter} ariaLabel="Filtriraj po mjesecu" />
			</div>
			<div class="filter-item">
				<span class="filter-label">Disciplina</span>
				<DashSelect options={disciplineOptions} bind:value={disciplineFilter} ariaLabel="Filtriraj po disciplini" />
			</div>
			<div class="filter-item">
				<span class="filter-label">Stanje</span>
				<DashSelect options={statusOptions} bind:value={statusFilter} ariaLabel="Filtriraj po stanju" />
			</div>
			<span class="filter-count text-jet-grey">{filtered.length} od {events.length}</span>
		</div>

		<div class="ev-scroll custom-scrollbar">
			<EventTable events={filtered} emptyText="Nema događaja za odabrane filtere." {onDeleted} />
		</div>
	</div>
</section>

<style>
	.ev-section {
		max-width: 68rem;
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
	.ev-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.filter-bar {
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}
	.filter-item {
		min-width: 11rem;
	}
	.filter-label {
		display: block;
		margin-bottom: 0.25rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #5b6577;
	}
	.filter-count {
		margin-left: auto;
		align-self: flex-end;
		padding-bottom: 0.5rem;
		font-size: 0.85rem;
	}
	.ev-scroll {
		max-height: calc(100vh - 24rem);
		min-height: 8rem;
		overflow-y: auto;
		/* Scrollbar styling comes from the shared `.custom-scrollbar` class. */
	}
</style>

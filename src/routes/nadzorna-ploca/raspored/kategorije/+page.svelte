<script lang="ts">
	// Raspored → Kategorije razina: manage the calendar-legend categories (event
	// levels). Each = a name + colour + order; shows how many events use it. Add /
	// edit / delete, each confirming. Real data via /admin/event-levels.
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		createEventLevel,
		updateEventLevel,
		deleteEventLevel,
		type EventLevelAdminRow
	} from '$lib/events';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';
	import TrophyIcon from '$lib/components/icons/TrophyIcon.svelte';

	let { data } = $props();
	let levels = $state<EventLevelAdminRow[]>([]);
	$effect(() => {
		levels = [...data.levels].sort((a, b) => a.order - b.order);
	});

	let confirmDlg = $state<ConfirmDialog>();
	let error = $state('');

	// ── Add / edit modal ─────────────────────────────────────────────────────
	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let fName = $state('');
	let fColor = $state('#187ff5');
	let fOrder = $state(0);
	const anim = { duration: 150, start: 0.97, opacity: 0, easing: cubicOut };

	function openAdd() {
		editingId = null;
		fName = '';
		fColor = '#187ff5';
		fOrder = levels.length; // next slot
		modalOpen = true;
	}
	function openEdit(l: EventLevelAdminRow) {
		editingId = l.id;
		fName = l.name;
		fColor = l.color;
		fOrder = l.order;
		modalOpen = true;
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!fName.trim()) return;
		error = '';
		try {
			if (editingId) {
				await updateEventLevel(editingId, { name: fName.trim(), color: fColor, order: fOrder });
			} else {
				await createEventLevel({ name: fName.trim(), color: fColor, order: fOrder });
			}
			modalOpen = false;
			await refresh();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Spremanje nije uspjelo.';
		}
	}

	async function del(l: EventLevelAdminRow) {
		const used = l.eventCount > 0 ? ` Trenutačno je koristi ${l.eventCount} događaja (ostat će bez razine).` : '';
		const ok = await confirmDlg?.ask(`Izbrisati kategoriju „${l.name}”?${used}`, 'Obriši');
		if (!ok) return;
		try {
			await deleteEventLevel(l.id);
			await refresh();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Brisanje nije uspjelo.';
		}
	}

	// Re-fetch the list after a mutation (invalidate the load).
	async function refresh() {
		const { invalidateAll } = await import('$app/navigation');
		await invalidateAll();
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') modalOpen = false;
	}
</script>

<svelte:window onkeydown={onKey} />
<svelte:head><title>Kategorije razina · VSK</title></svelte:head>

<section class="lvl-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<TrophyIcon size={28} />
			<div>
				<h2 class="mgmt-title">Kategorije razina</h2>
				<p class="mgmt-sub">Kategorije natjecanja (legenda kalendara). Svaka ima naziv, boju i redoslijed.</p>
			</div>
		</div>
		<button class="btn-add cursor-pointer display-f align-items-center gap-0-4" type="button" onclick={openAdd}>
			<AddIcon size={18} />
			Nova kategorija
		</button>
	</div>

	<div class="panel bg-white column-nowrap gap-0-3">
		{#if data.loadError}
			<p class="lvl-load-error" role="alert">Učitavanje kategorija nije uspjelo. Osvježite stranicu.</p>
		{/if}
		{#if error}
			<p class="lvl-load-error" role="alert">{error}</p>
		{/if}

		{#if levels.length === 0}
			<p class="lvl-empty">Još nema kategorija.</p>
		{:else}
			{#each levels as l (l.id)}
				<div class="lvl-row display-f align-items-center gap-1">
					<span class="lvl-dot" style="background:{l.color}"></span>
					<div class="lvl-info column-nowrap">
						<span class="lvl-name fw-600">{l.name}</span>
						<span class="lvl-meta">Redoslijed {l.order} · {l.eventCount} događaja</span>
					</div>
					<div class="lvl-actions display-f align-items-center gap-0-3">
						<button class="lvl-act cursor-pointer display-f" type="button" aria-label="Uredi" title="Uredi" onclick={() => openEdit(l)}>
							<EditIcon size={18} />
						</button>
						<button class="lvl-act lvl-act--del cursor-pointer display-f" type="button" aria-label="Izbriši" title="Izbriši" onclick={() => del(l)}>
							<TrashIcon size={18} />
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</section>

{#if modalOpen}
	<div class="modal-backdrop position-fixed" role="presentation" onclick={() => (modalOpen = false)}></div>
	<div class="modal position-fixed br-lg" role="dialog" aria-modal="true" aria-label="Kategorija" transition:scale={anim}>
		<header class="modal-head display-f align-items-center justify-content-space-between">
			<h3 class="modal-title">{editingId ? 'Uredi kategoriju' : 'Nova kategorija'}</h3>
			<button class="modal-close cursor-pointer br-full display-f align-items-center justify-content-center" type="button" aria-label="Zatvori" onclick={() => (modalOpen = false)}>
				<CloseIcon size={22} />
			</button>
		</header>
		<form class="modal-form column-nowrap gap-1" onsubmit={submit}>
			<label class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Naziv</span>
				<input class="field-input w-full br-xs" type="text" bind:value={fName} required />
			</label>
			<div class="two-col">
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Boja</span>
					<span class="color-row display-f align-items-center gap-0-5">
						<input class="color-swatch" type="color" bind:value={fColor} aria-label="Boja" />
						<input class="field-input color-hex br-xs" type="text" bind:value={fColor} />
					</span>
				</label>
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Redoslijed</span>
					<input class="field-input w-full br-xs" type="number" bind:value={fOrder} min="0" />
				</label>
			</div>
			<div class="modal-actions display-f justify-content-flex-end gap-0-5">
				<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" onclick={() => (modalOpen = false)}>Odustani</button>
				<button class="btn btn--primary cursor-pointer br-xs fw-600" type="submit">{editingId ? 'Spremi' : 'Dodaj'}</button>
			</div>
		</form>
	</div>
{/if}

<ConfirmDialog bind:this={confirmDlg} />

<style>
	.lvl-section {
		max-width: 48rem;
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
	.lvl-load-error {
		margin: 0 0 0.5rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.lvl-empty {
		margin: 0;
		padding: 1.5rem 0;
		text-align: center;
		color: #9aa3b2;
	}
	.lvl-row {
		padding: 0.6rem 0;
	}
	.lvl-row + .lvl-row {
		border-top: 1px solid #f3f5f8;
	}
	.lvl-dot {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		flex: 0 0 auto;
	}
	.lvl-info {
		flex: 1 1 auto;
		line-height: 1.3;
		min-width: 0;
	}
	.lvl-name {
		font-size: 1rem;
		color: #102e66;
	}
	.lvl-meta {
		font-size: 0.83rem;
		color: #9aa3b2;
	}
	.lvl-act {
		align-items: center;
		border: 0;
		background: none;
		padding: 0.3rem;
		color: #5b6577;
		transition: color 0.15s ease;
	}
	.lvl-act:hover {
		color: #187ff5;
	}
	.lvl-act--del:hover {
		color: #d32752;
	}

	/* ── Modal ── */
	.modal-backdrop {
		inset: 0;
		background: rgba(16, 46, 102, 0.28);
		z-index: 80;
	}
	.modal {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 28rem;
		max-width: calc(100vw - 2rem);
		padding: 1.5rem;
		background: #fff;
		box-shadow: 0 12px 40px rgba(16, 46, 102, 0.25);
		z-index: 81;
	}
	.modal-head {
		margin-bottom: 1.1rem;
	}
	.modal-title {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
		color: #102e66;
	}
	.modal-close {
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		background: none;
		color: #5b6577;
	}
	.modal-close:hover {
		background: #eef1f3;
	}
	.two-col {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}
	.field-label {
		font-size: 0.85rem;
		color: #5b6577;
	}
	.field-input {
		box-sizing: border-box;
		padding: 0.6rem 0.8rem;
		border: 1px solid #d7dee8;
		font-size: 0.95rem;
		font-family: inherit;
		color: #102e66;
		background: #fff;
	}
	.field-input:focus {
		outline: none;
		border-color: #187ff5;
	}
	.color-swatch {
		width: 2.6rem;
		height: 2.6rem;
		padding: 0;
		border: 1px solid #d7dee8;
		border-radius: 8px;
		background: none;
		cursor: pointer;
		flex: 0 0 auto;
	}
	.color-hex {
		flex: 1 1 auto;
		text-transform: lowercase;
	}
	.modal-actions {
		margin-top: 0.5rem;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		font-size: 0.9rem;
		font-family: inherit;
		border: 1px solid transparent;
	}
	.btn--primary {
		background: #102e66;
		color: #fff;
	}
	.btn--primary:hover {
		background: #0c2350;
	}
	.btn--ghost {
		background: #fff;
		color: #102e66;
		border-color: #d7dee8;
	}
	.btn--ghost:hover {
		background: #eef1f3;
	}
</style>

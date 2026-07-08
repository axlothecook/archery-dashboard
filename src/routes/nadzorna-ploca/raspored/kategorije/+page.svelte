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
	import ErrorPopup from '$lib/components/ErrorPopup.svelte';
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
	// Standardized top-centre form-validation errors (mandatory Naziv).
	let formErrors = $state<string[]>([]);

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
		formErrors = [];
		modalOpen = true;
	}
	function openEdit(l: EventLevelAdminRow) {
		editingId = l.id;
		fName = l.name;
		fColor = l.color;
		fOrder = l.order;
		formErrors = [];
		modalOpen = true;
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		// Naziv is mandatory — surface it in the shared top-centre ErrorPopup (visible on all
		// screens) rather than silently blocking submit.
		if (!fName.trim()) {
			formErrors = ['Naziv je obavezan.'];
			return;
		}
		formErrors = [];
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
<svelte:head><title>Razina · VSK</title></svelte:head>

<section class="lvl-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between gap-2">
		<div class="display-f align-items-center gap-0-7">
			<TrophyIcon size={48} />
			<div>
				<h2 class="mgmt-title">Razina</h2>
				<p class="mgmt-sub">Kategorije natjecanja (legenda kalendara). Svaka ima naziv, boju i redoslijed.</p>
			</div>
		</div>
		<button class="btn-add btn-add--inline cursor-pointer display-f align-items-center gap-0-4" type="button" onclick={openAdd}>
			<AddIcon size={18} />
			Nova kategorija
		</button>
	</div>

	<!-- Mobile-only: full-width "Nova kategorija" below the title. -->
	<button class="btn-add btn-add--block cursor-pointer display-f align-items-center justify-content-center gap-0-4" type="button" onclick={openAdd}>
		<AddIcon size={18} />
		Nova kategorija
	</button>

	<div class="panel bg-white column-nowrap">
		{#if data.loadError}
			<p class="lvl-load-error" role="alert">Učitavanje kategorija nije uspjelo. Osvježite stranicu.</p>
		{/if}
		{#if error}
			<p class="lvl-load-error" role="alert">{error}</p>
		{/if}

		<div class="lvl-scroll custom-scrollbar column-nowrap gap-0-3">
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
						<div class="lvl-actions display-f align-items-center gap-1">
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
				<span class="field-label fw-600">Naziv <span class="req">*</span></span>
				<input class="field-input w-full br-xs" type="text" bind:value={fName} />
			</label>
			<!-- Redoslijed above Boja, each full-width (the side-by-side layout clipped the
			     Redoslijed select off the modal's right edge). -->
			<label class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Redoslijed</span>
				<input class="field-input w-full br-xs" type="number" bind:value={fOrder} min="0" />
			</label>
			<label class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Boja</span>
				<span class="color-row display-f align-items-center gap-0-5">
					<input class="color-swatch w-2-5 h-2-5 br-sm border-width-1 border-heather flex-grow-0 cursor-pointer" type="color" bind:value={fColor} aria-label="Boja" />
					<input class="field-input color-hex br-xs w-full" type="text" bind:value={fColor} />
				</span>
			</label>
			<div class="modal-actions display-f justify-content-flex-end gap-0-5">
				<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" onclick={() => (modalOpen = false)}>Odustani</button>
				<button class="btn btn--primary cursor-pointer br-xs fw-600" type="submit">{editingId ? 'Spremi' : 'Dodaj'}</button>
			</div>
		</form>
	</div>
{/if}

<ConfirmDialog bind:this={confirmDlg} />

<!-- Shared top-centre, non-auto-dismiss error stack (mandatory-field validation). -->
<ErrorPopup bind:messages={formErrors} />

<style>
	.lvl-section {
		/* Fill the shared content frame as a flex column (mirrors Svi sponzori) so the
		   panel bounds to it and scrolls INSIDE — the white div is the same size. */
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
		flex-shrink: 0;
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
		/* Fill the section height + be a flex column so the scroll area bounds to it
		   (mirrors the Svi sponzori white div). */
		flex: 1 1 auto;
		min-height: 0;
	}
	.lvl-scroll {
		/* Fill the panel + scroll the rows INSIDE it so a long list never runs off the
		   bottom of the viewport (mirrors Svi sponzori's .sp-scroll). */
		flex: 1 1 auto;
		min-height: 0;
		overflow: auto;
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
	.field-label {
		font-size: 0.85rem;
		color: #5b6577;
	}
	.req {
		color: #d32752;
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
	/* Frame sizing/border/radius are utility classes on the element (w-2-5 h-2-5 br-sm
	   border-width-1 border-heather). Only the native-swatch chrome reset stays here:
	   the inner colour area of <input type="color"> is drawn by the browser with its
	   own padding + rounded/elliptic border, which no utility class can reach (same
	   category as ::-webkit-scrollbar). Stripping it leaves a clean colour box. */
	.color-swatch {
		padding: 0;
		background: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		overflow: hidden;
	}
	.color-swatch::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	.color-swatch::-webkit-color-swatch {
		border: 0;
		border-radius: 0;
	}
	.color-swatch::-moz-color-swatch {
		border: 0;
		border-radius: 0;
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
	/* Phone: "Nova kategorija" becomes a full-width button below the title; white panel goes
	   edge-to-edge (cancel the content area's 1rem side padding). */
	@media (max-width: 820px) {
		.btn-add--inline {
			display: none;
		}
		.btn-add--block {
			display: flex;
			width: 100%;
			padding: 0.7rem 1rem;
			font-size: 0.95rem;
			margin-bottom: 1rem;
		}
		.panel {
			margin-left: -1rem;
			margin-right: -1rem;
			border-radius: 0;
		}
	}
</style>

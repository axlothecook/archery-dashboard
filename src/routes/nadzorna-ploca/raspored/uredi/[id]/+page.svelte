<script lang="ts">
	// Raspored → Uredi događaj: same layout as the Novi događaj create form, prefilled
	// with the existing event (loaded via GET /admin/events/:id) and saved via PATCH. A
	// hide/unhide eye toggle in the header flips the event's `hidden` state (icon reflects
	// the CURRENT state). Mirrors Uredi članak.
	import { goto, beforeNavigate } from '$app/navigation';
	import {
		updateEvent,
		DISCIPLINE_LABEL,
		type Discipline,
		type CreateEventInput
	} from '$lib/events';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import ArcherPicker from '$lib/components/ArcherPicker.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ErrorPopup from '$lib/components/ErrorPopup.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import EyeOffIcon from '$lib/components/icons/EyeOffIcon.svelte';

	let { data } = $props();
	// One-time seed of the form from the loaded event. A different event id means a
	// navigation → remount, so capturing the initial value here is intentional.
	// svelte-ignore state_referenced_locally
	const e = data.event;

	// ISO → yyyy-mm-dd for the native date input (UTC so it matches the stored day).
	function toDateInput(iso: string | null): string {
		return iso ? iso.slice(0, 10) : '';
	}

	// ── Form state (seeded from the loaded event) ──────────────────────────────
	let name = $state(e.name);
	let discipline = $state<Discipline>(e.discipline);
	let dateFrom = $state(toDateInput(e.dateFrom));
	let dateTo = $state(toDateInput(e.dateTo));
	let location = $state(e.location ?? '');
	let organizer = $state(e.organizer ?? '');
	let format = $state(e.format ?? '');
	let levelId = $state<string>(e.levelId ?? '');
	let attendingArcherIds = $state<string[]>([...e.attendingArcherIds]);
	let hasUnlistedClubAttendee = $state(e.hasUnlistedClubAttendee);
	let imageUrl = $state(e.imageUrl ?? '');
	let imageAlt = $state(e.imageAlt ?? '');
	let sourceUrl = $state(e.sourceUrl ?? '');
	let isCancelled = $state(e.isCancelled);
	let hidden = $state(e.hidden);
	const currentStatus = e.status; // 'draft' | 'published' — kept unless publish is pressed

	let saving = $state(false);
	let errors = $state<string[]>([]);

	const disciplineOptions = (Object.keys(DISCIPLINE_LABEL) as Discipline[]).map((v) => ({
		value: v,
		label: DISCIPLINE_LABEL[v]
	}));
	const levelOptions = $derived(data.levels.map((l) => ({ value: l.id, label: l.name })));

	// ── Unsaved-changes guard ────────────────────────────────────────────────────
	// Snapshot the loaded event; `dirty` is true whenever the form differs. Warns before
	// leaving (Odustani, a sidebar nav, or closing the tab). `saved` is set right before
	// our own save/publish redirect so the guard doesn't fire on it. Mirrors Uredi članak.
	const initialSnapshot = JSON.stringify({
		name: e.name, discipline: e.discipline, dateFrom: toDateInput(e.dateFrom),
		dateTo: toDateInput(e.dateTo), location: e.location ?? '', organizer: e.organizer ?? '',
		format: e.format ?? '', levelId: e.levelId ?? '', attendingArcherIds: e.attendingArcherIds,
		hasUnlistedClubAttendee: e.hasUnlistedClubAttendee, imageUrl: e.imageUrl ?? '',
		imageAlt: e.imageAlt ?? '', sourceUrl: e.sourceUrl ?? '', isCancelled: e.isCancelled,
		hidden: e.hidden
	});
	let saved = $state(false);
	const dirty = $derived(
		!saved &&
			JSON.stringify({
				name, discipline, dateFrom, dateTo, location, organizer, format, levelId,
				attendingArcherIds, hasUnlistedClubAttendee, imageUrl, imageAlt, sourceUrl,
				isCancelled, hidden
			}) !== initialSnapshot
	);
	let leaveDlg = $state<ConfirmDialog>();
	let confirmedLeaveTo = $state<string | null>(null);
	beforeNavigate((nav) => {
		if (!dirty) return;
		if (nav.willUnload) return;
		const to = nav.to?.url.pathname ?? null;
		if (to && to === confirmedLeaveTo) {
			confirmedLeaveTo = null;
			return;
		}
		nav.cancel();
		void (async () => {
			if (await leaveDlg?.ask('Napustiti bez spremanja promjena?', 'Napusti')) {
				confirmedLeaveTo = to;
				if (to) await goto(to);
			}
		})();
	});
	function onBeforeUnload(ev: BeforeUnloadEvent) {
		if (dirty) {
			ev.preventDefault();
			ev.returnValue = '';
		}
	}

	// yyyy-mm-dd (date input) → ISO at midnight UTC, or null.
	function toIso(d: string): string | null {
		return d ? new Date(d + 'T00:00:00.000Z').toISOString() : null;
	}

	function buildPatch(status: 'draft' | 'published'): Partial<CreateEventInput> {
		const t = (s: string) => s.trim();
		return {
			discipline,
			format: t(format) || null,
			dateFrom: toIso(dateFrom)!, // validated present below
			dateTo: toIso(dateTo),
			imageUrl: t(imageUrl) || null,
			imageAlt: t(imageAlt) || null,
			sourceUrl: t(sourceUrl) || null,
			isCancelled,
			status,
			hidden,
			location: t(location) || null,
			organizer: t(organizer) || null,
			levelId: levelId || null,
			attendingArcherIds,
			hasUnlistedClubAttendee,
			name: t(name)
		};
	}

	// Mandatory: Naziv, dates, Lokacija, Razina, Sudionici, Slika + alt. Optional: Format,
	// Organizator, Poveznica (some real events genuinely have no organizer/format). Sudionici
	// is satisfied by either at least one archer or the "other club members" flag. Collect
	// EVERY error so they all show at once (dismissible popups).
	function validate(): string[] {
		const errs: string[] = [];
		if (!name.trim()) errs.push('Naziv događaja je obavezan.');
		if (!dateFrom) errs.push('Datum početka je obavezan.');
		if (!dateTo) errs.push('Datum završetka je obavezan.');
		else if (dateFrom && dateTo < dateFrom) errs.push('Datum završetka ne može biti prije početka.');
		if (!location.trim()) errs.push('Lokacija je obavezna.');
		if (!levelId) errs.push('Razina je obavezna.');
		if (attendingArcherIds.length === 0 && !hasUnlistedClubAttendee) {
			errs.push('Sudionici su obavezni (odaberite streličare ili označite druge članove kluba).');
		}
		if (!imageUrl.trim()) errs.push('Slika je obavezna.');
		if (!imageAlt.trim()) errs.push('Opis slike (alt) je obavezan.');
		return errs;
	}

	// Save keeping the current status (draft stays draft, published stays published).
	async function save() {
		await submit(currentStatus);
	}
	// Publish a draft (or re-affirm published).
	async function publish() {
		await submit('published');
	}
	async function submit(status: 'draft' | 'published') {
		if (saving) return;
		const errs = validate();
		if (errs.length > 0) {
			errors = errs;
			return;
		}
		errors = [];
		saving = true;
		try {
			await updateEvent(e.id, buildPatch(status));
			saved = true; // our own redirect — don't trigger the unsaved-changes guard
			await goto(status === 'published' ? '/nadzorna-ploca/raspored/svi' : '/nadzorna-ploca/raspored/nacrti');
		} catch (err) {
			errors = [err instanceof Error ? err.message : 'Spremanje nije uspjelo.'];
			saving = false;
		}
	}

	// Odustani (Cancel): go back to the list. If there are unsaved edits, the
	// beforeNavigate guard shows the abandon-changes dialog first.
	async function cancel() {
		await goto(currentStatus === 'draft' ? '/nadzorna-ploca/raspored/nacrti' : '/nadzorna-ploca/raspored/svi');
	}
</script>

<svelte:window onbeforeunload={onBeforeUnload} />

<svelte:head><title>Uredi događaj · VSK</title></svelte:head>

<section class="ev-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between gap-0-7">
		<div class="display-f align-items-center gap-0-7">
			<CalendarIcon size={48} />
			<div>
				<h2 class="mgmt-title">Uredi događaj</h2>
				<p class="mgmt-sub">Uredite postojeći događaj i spremite promjene.</p>
			</div>
		</div>
		<!-- Hide/unhide toggle: in the HEADER row (right side), OUTSIDE the white panel, so it
		     doesn't push the form content down. Icon reflects the CURRENT state; click flips
		     `hidden`. On phone the header stacks, so it wraps beneath the title. -->
		<button
			class="vis-toggle cursor-pointer display-f align-items-center gap-0-5"
			class:is-hidden={hidden}
			type="button"
			aria-pressed={hidden}
			title={hidden ? 'Trenutačno skriveno — klik za prikaz' : 'Trenutačno vidljivo — klik za skrivanje'}
			onclick={() => (hidden = !hidden)}
		>
			{#if hidden}
				<EyeOffIcon size={20} /> Skriveno
			{:else}
				<EyeIcon size={20} /> Vidljivo
			{/if}
		</button>
	</div>

	<form class="panel bg-white" onsubmit={(ev) => ev.preventDefault()}>
		<div class="form-grid">
			<!-- LEFT: the core details. -->
			<div class="col column-nowrap gap-1-5">
				<label class="field column-nowrap gap-title">
					<span class="field-title">Naziv događaja <span class="req">*</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={name} required />
				</label>
				<div class="field column-nowrap gap-title">
					<span class="field-title">Disciplina <span class="req">*</span></span>
					<DashSelect options={disciplineOptions} bind:value={discipline} ariaLabel="Disciplina" />
				</div>
				<div class="two-col">
					<label class="field column-nowrap gap-title">
						<span class="field-title">Datum početka <span class="req">*</span></span>
						<input class="field-input w-full br-xs" type="date" bind:value={dateFrom} required />
					</label>
					<label class="field column-nowrap gap-title">
						<span class="field-title">Datum završetka <span class="req">*</span></span>
						<input class="field-input w-full br-xs" type="date" bind:value={dateTo} required />
					</label>
				</div>
				<label class="field column-nowrap gap-title">
					<span class="field-title">Lokacija <span class="req">*</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={location} />
				</label>
				<label class="field column-nowrap gap-title">
					<span class="field-title">Organizator</span>
					<input class="field-input w-full br-xs" type="text" bind:value={organizer} />
				</label>
				<label class="field column-nowrap gap-title">
					<span class="field-title">Format <span class="field-hint">(npr. WA 720)</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={format} />
				</label>

				<fieldset class="group">
					<legend class="group-legend">Poster fotografija <span class="req">*</span></legend>
					<ImageUpload label="Slika" bind:url={imageUrl} />
					<label class="field column-nowrap gap-title mt-0-6">
						<span class="field-title">Opis slike (alt)</span>
						<input class="field-input w-full br-xs" type="text" bind:value={imageAlt} />
					</label>
				</fieldset>
			</div>

			<!-- RIGHT: level, attendees, flags. -->
			<div class="col column-nowrap gap-1-5">
				<div class="field column-nowrap gap-title">
					<span class="field-title">Razina <span class="req">*</span></span>
					{#if data.levelLoadError}
						<div class="soft-warn">Učitavanje kategorija nije uspjelo.</div>
					{:else}
						<DashSelect options={levelOptions} bind:value={levelId} ariaLabel="Razina" />
					{/if}
				</div>

				<div class="field column-nowrap gap-title">
					<span class="field-title">Sudionici (streličari) <span class="req">*</span></span>
					<ArcherPicker
						options={data.archerOptions}
						loadError={data.archerLoadError}
						errorDetail={data.archerErrorDetail}
						bind:selected={attendingArcherIds}
					/>
				</div>
				<label class="check-row check-row--attach display-f align-items-center gap-0-5">
					<input type="checkbox" bind:checked={hasUnlistedClubAttendee} />
					<span>Sudjelovali i drugi članovi kluba <span class="field-hint">(nisu na popisu)</span></span>
				</label>

				<label class="field column-nowrap gap-title">
					<span class="field-title">Poveznica na izvor</span>
					<input class="field-input w-full br-xs" type="url" bind:value={sourceUrl} />
				</label>

				<label class="check-row display-f align-items-center gap-0-5">
					<input type="checkbox" bind:checked={isCancelled} />
					<span>Otkazano</span>
				</label>
				<label class="check-row display-f align-items-center gap-0-5">
					<input type="checkbox" bind:checked={hidden} />
					<span>Sakrij s javne stranice <span class="field-hint">(objavljeno, ali skriveno)</span></span>
				</label>
			</div>
		</div>

		<div class="form-actions display-f justify-content-flex-end gap-0-5">
			<button class="btn btn--cancel cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={cancel}>
				Odustani
			</button>
			<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={save}>
				{currentStatus === 'draft' ? 'Spremi nacrt' : 'Spremi promjene'}
			</button>
			{#if currentStatus === 'draft'}
				<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={publish}>
					{saving ? 'Spremanje…' : 'Objavi'}
				</button>
			{/if}
		</div>
	</form>
</section>

<!-- Validation warnings: top-centre dismissible stack (matches the article forms). -->
<ErrorPopup bind:messages={errors} />

<!-- Abandon-changes popup (animated) — shown by the beforeNavigate guard + Odustani. -->
<ConfirmDialog bind:this={leaveDlg} confirmLabel="Napusti" cancelLabel="Ostani" />

<style>
	.ev-section {
		/* Full-width white div, matching the Novi članak form for consistency. */
		width: 100%;
	}
	.mgmt-head {
		margin-bottom: 1.25rem;
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
	/* Hide/unhide toggle: green when visible, grey when hidden — matches the state. Lives in
	   the header row (right side), so it must not stretch. */
	.vis-toggle {
		flex: 0 0 auto;
		padding: 0.5rem 0.9rem;
		border: 1px solid #cfe8d8;
		border-radius: 8px;
		background: #eafaf0;
		color: #10683a;
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
		white-space: nowrap; /* "Skriveno"/"Vidljivo" stay on ONE line (was clipping) */
	}
	.vis-toggle.is-hidden {
		border-color: #d7dee8;
		background: #f1f3f7;
		color: #5b6577;
	}
	.panel {
		border-radius: 14px;
		padding: 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		/* Fill the frame + scroll the form inside so the sticky action bar stays in view on
		   any screen size. Flex column so the bar is the last, sticky child. */
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		align-items: start;
	}
	.col {
		min-width: 0;
	}
	.two-col {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}
	.mt-0-6 {
		margin-top: 0.6rem;
	}
	/* Section-field titles: match the Novi događaj form (.field-title) — bigger, bold,
	   deep-sapphire (same as the Poster fotografija legend). */
	.field-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: #102e66;
	}
	/* Gap between a field title and its input (matches Novi događaj). */
	.gap-title {
		gap: 0.3rem;
	}
	/* Required-field marker: a red star after the label. */
	.req {
		color: #d32752;
		font-weight: 700;
	}
	.field-hint {
		font-weight: 400;
		color: #9aa3b2;
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
	.soft-warn {
		padding: 0.6rem 0.8rem;
		border: 1px solid #f2c4cf;
		border-radius: 8px;
		background: #fdeef1;
		color: #a4133c;
		font-size: 0.9rem;
	}
	.group {
		margin: 0;
		padding: 1rem 1.1rem;
		border: 1px solid #eef1f3;
		border-radius: 10px;
	}
	.group-legend {
		padding: 0 0.4rem;
		font-size: 0.9rem;
		font-weight: 700;
		color: #102e66;
	}
	.check-row {
		font-size: 0.9rem;
		color: #102e66;
		white-space: nowrap; /* keep each checkbox label on one row */
	}
	/* Themed checkbox: unchecked = empty outlined box (not a black square), checked = navy
	   fill + white tick. Matches the article form + Vrsta filter boxes. */
	.check-row input[type='checkbox'] {
		appearance: none;
		-webkit-appearance: none;
		width: 1.1rem;
		height: 1.1rem;
		flex: 0 0 auto;
		margin: 0;
		border: 1.5px solid #b9c3d3;
		border-radius: 4px;
		background: #fff;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.check-row input[type='checkbox']:checked {
		border-color: #102e66;
		background: #102e66;
	}
	.check-row input[type='checkbox']:checked::after {
		content: '';
		width: 0.28rem;
		height: 0.55rem;
		border: solid #fff;
		border-width: 0 2px 2px 0;
		transform: translateY(-1px) rotate(45deg);
	}
	/* The "other club members" checkbox belongs to the Sudionici field above it, so pull
	   it up close (counteract most of the column's 1.5rem gap). */
	.check-row--attach {
		margin-top: -1rem;
	}
	.form-actions {
		/* Sticky action bar flush to the panel's bottom edge (off-white bg), always in view
		   while the form scrolls under it on any screen size. */
		margin-top: auto;
		position: sticky;
		bottom: -1.5rem;
		margin-left: -1.5rem;
		margin-right: -1.5rem;
		margin-bottom: -1.5rem;
		padding: 1rem 1.5rem;
		background: #eef1f3;
		border-top: 1px solid #dfe4ea;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		font-size: 0.9rem;
		font-family: inherit;
		border: 1px solid transparent;
		text-align: center;
		white-space: nowrap;
	}
	/* All action buttons the SAME width on desktop (fixed basis). Mobile → equal flex share. */
	.form-actions .btn {
		flex: 0 0 10rem;
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.btn--primary {
		background: #102e66;
		color: #fff;
	}
	.btn--primary:hover:not(:disabled) {
		background: #0c2350;
	}
	.btn--ghost {
		background: #fff;
		color: #102e66;
		border-color: #d7dee8;
	}
	.btn--ghost:hover:not(:disabled) {
		background: #eef1f3;
	}
	/* Odustani (cancel/discard): red outline so it reads as "leave without saving". */
	.btn--cancel {
		background: #fff;
		color: #d32752;
		border-color: #d32752;
	}
	.btn--cancel:hover:not(:disabled) {
		background: #fdeef2;
	}
	@media (max-width: 900px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		/* Vidljivo/Skriveno toggle (inside the panel) spans FULL width on phone. */
		.vis-toggle {
			width: 100%;
			justify-content: center;
			padding: 0.7rem 1rem;
			font-size: 0.95rem;
		}
		/* Pin the action bar to the bottom of the SCREEN (page scrolls on mobile). Panel gets
		   bottom padding so the last fields/checkboxes clear it. */
		.form-actions {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			margin: 0;
			z-index: 40;
			padding: 0.9rem 1rem calc(0.9rem + env(safe-area-inset-bottom));
			box-shadow: 0 -4px 16px rgba(16, 46, 102, 0.12);
			gap: 0.4rem;
			align-items: stretch;
		}
		/* Buttons share the row evenly, one line, FIXED height so they're all identical. */
		.form-actions .btn {
			flex: 1 1 0;
			min-width: 0;
			height: 2.75rem;
			padding: 0 0.4rem;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 0.8rem;
			white-space: nowrap;
			line-height: 1;
		}
		/* White panel edge-to-edge (cancel the content area's 1rem side padding) + tighter
		   inner padding; bottom padding clears the fixed bar. */
		.panel {
			margin-left: -1rem;
			margin-right: -1rem;
			border-radius: 0;
			padding-left: 1rem;
			padding-right: 1rem;
			padding-bottom: 5rem;
		}
	}
</style>

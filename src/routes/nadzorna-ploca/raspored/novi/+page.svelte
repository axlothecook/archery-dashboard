<script lang="ts">
	// Raspored → Novi događaj: the full create-event form. Covers every backend
	// createBody field: name, discipline, dateFrom/To, location, organizer, format,
	// level (single-select), attending archers (multi-select) + unlisted-club flag,
	// image, source URL, cancelled, hidden, draft/publish. Two-column so it fits
	// without page scroll. POSTs to POST /admin/events.
	import { untrack } from 'svelte';
	import { goto, beforeNavigate } from '$app/navigation';
	import {
		createEvent,
		DISCIPLINE_LABEL,
		type Discipline,
		type CreateEventInput
	} from '$lib/events';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import ArcherPicker from '$lib/components/ArcherPicker.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ErrorPopup from '$lib/components/ErrorPopup.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';

	let { data } = $props();

	// ── Form state ───────────────────────────────────────────────────────────
	let name = $state('');
	let discipline = $state<Discipline>('outdoor');
	let dateFrom = $state(''); // yyyy-mm-dd (native date input)
	let dateTo = $state('');
	let location = $state('');
	let organizer = $state('');
	let format = $state('');
	// Razina must be chosen (no "Bez razine"); default to the first level so the form
	// starts with a valid selection, like Vrsta medija starting on "Događaj". untrack so
	// this one-time snapshot of the loaded levels doesn't read as reactive state.
	const firstLevelId = untrack(() => data.levels[0]?.id ?? '');
	let levelId = $state<string>(firstLevelId); // required — starts on the first level
	let attendingArcherIds = $state<string[]>([]);
	let hasUnlistedClubAttendee = $state(false);
	let imageUrl = $state('');
	let imageAlt = $state('');
	let sourceUrl = $state('');
	let isCancelled = $state(false);
	let hidden = $state(false);

	let saving = $state(false);
	let errors = $state<string[]>([]);

	const disciplineOptions = (Object.keys(DISCIPLINE_LABEL) as Discipline[]).map((v) => ({
		value: v,
		label: DISCIPLINE_LABEL[v]
	}));
	// Level select: one option per level (no "no level" — a razina is required).
	const levelOptions = $derived(data.levels.map((l) => ({ value: l.id, label: l.name })));

	// ── Unsaved-changes guard ────────────────────────────────────────────────────
	// On the CREATE form, "dirty" means the user changed anything from the initial
	// state (levelId starts on the first level, so compare against that). Warns before
	// leaving (Odustani, a sidebar nav, or closing the tab). `saved` is set before our
	// own post-create redirect so the guard doesn't fire on it.
	let saved = $state(false);
	const dirty = $derived(
		!saved &&
			(name !== '' || dateFrom !== '' || dateTo !== '' || location !== '' ||
				organizer !== '' || format !== '' || levelId !== firstLevelId ||
				attendingArcherIds.length > 0 || hasUnlistedClubAttendee ||
				imageUrl !== '' || imageAlt !== '' || sourceUrl !== '' ||
				discipline !== 'outdoor' || isCancelled || hidden)
	);
	let leaveDlg = $state<ConfirmDialog>();
	let confirmedLeaveTo = $state<string | null>(null);
	beforeNavigate((nav) => {
		if (!dirty) return;
		// Tab close / leaving the app is handled by the native beforeunload prompt below;
		// don't also show our modal (would double-prompt after cancelling the native one).
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
	function onBeforeUnload(e: BeforeUnloadEvent) {
		if (dirty) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	// yyyy-mm-dd (date input) → ISO at midnight UTC, or null.
	function toIso(d: string): string | null {
		return d ? new Date(d + 'T00:00:00.000Z').toISOString() : null;
	}

	function buildInput(status: 'draft' | 'published'): CreateEventInput {
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
	// is satisfied by either at least one archer or the "other club members" flag. For a
	// one-day event, enter the same date in both fields (the list then shows it once).
	// Collect EVERY error so they all show at once (dismissible popups).
	function validate(): string[] {
		const errs: string[] = [];
		if (!name.trim()) errs.push('Naziv događaja je obavezan.');
		if (!dateFrom) errs.push('Datum početka je obavezan.');
		if (!dateTo) errs.push('Datum završetka je obavezan.');
		else if (dateFrom && dateTo < dateFrom) errs.push('Datum završetka ne može biti prije početka.');
		if (!location.trim()) errs.push('Lokacija je obavezna.');
		if (!levelId) errs.push('Razina (kategorija) je obavezna.');
		if (attendingArcherIds.length === 0 && !hasUnlistedClubAttendee) {
			errs.push('Sudionici su obavezni (odaberite streličare ili označite druge članove kluba).');
		}
		if (!imageUrl.trim()) errs.push('Slika je obavezna.');
		if (!imageAlt.trim()) errs.push('Opis slike (alt) je obavezan.');
		return errs;
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
			await createEvent(buildInput(status));
			saved = true; // our own redirect — don't trigger the unsaved-changes guard
			await goto(status === 'published' ? '/nadzorna-ploca/raspored/svi' : '/nadzorna-ploca/raspored/nacrti');
		} catch (e) {
			errors = [e instanceof Error ? e.message : 'Spremanje nije uspjelo.'];
			saving = false;
		}
	}

	// Odustani (Cancel): go back to the events list. If there are unsaved edits, the
	// beforeNavigate guard shows the abandon-changes dialog first.
	async function cancel() {
		await goto('/nadzorna-ploca/raspored/svi');
	}
</script>

<svelte:window onbeforeunload={onBeforeUnload} />

<svelte:head><title>Novi događaj · VSK</title></svelte:head>

<section class="ev-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<CalendarIcon size={40} />
		<div>
			<h2 class="mgmt-title">Novi događaj</h2>
			<p class="mgmt-sub">Dodajte natjecanje ili događaj i spremite kao nacrt ili odmah objavite.</p>
		</div>
	</div>

	<form class="panel bg-white" onsubmit={(e) => e.preventDefault()}>
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
					<span class="field-title">Organizator <span class="field-hint">(nije obavezno)</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={organizer} />
				</label>
				<label class="field column-nowrap gap-title">
					<span class="field-title">Format <span class="field-hint">(nije obavezno, npr. WA 720)</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={format} />
				</label>

				<fieldset class="group">
					<legend class="group-legend">Poster fotografija <span class="req">*</span></legend>
					<label class="field column-nowrap gap-title">
						<span class="field-title">URL slike</span>
						<input class="field-input w-full br-xs" type="url" bind:value={imageUrl} />
					</label>
					<label class="field column-nowrap gap-title mt-0-6">
						<span class="field-title">Opis slike (alt)</span>
						<input class="field-input w-full br-xs" type="text" bind:value={imageAlt} />
					</label>
				</fieldset>
			</div>

			<!-- RIGHT: level, attendees, flags. -->
			<div class="col column-nowrap gap-1-5">
				<div class="field column-nowrap gap-title">
					<span class="field-title">Razina (kategorija) <span class="req">*</span></span>
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
					<span class="field-title">Poveznica na izvor <span class="field-hint">(nije obavezno)</span></span>
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
			<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={() => submit('draft')}>
				Spremi kao nacrt
			</button>
			<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={() => submit('published')}>
				{saving ? 'Spremanje…' : 'Objavi'}
			</button>
		</div>
	</form>
</section>

<!-- Validation warnings: top-centre dismissible stack (matches the article forms). -->
<ErrorPopup bind:messages={errors} />

<!-- Abandon-changes popup (animated) — shown by the beforeNavigate guard + Odustani. -->
<ConfirmDialog bind:this={leaveDlg} confirmLabel="Napusti" cancelLabel="Ostani" />

<style>
	.ev-section {
		max-width: 72rem;
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
	.panel {
		border-radius: 14px;
		padding: 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
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
	/* Section-field titles: match the Novi članak form (.field-title) — bigger, bold,
	   deep-sapphire (same as the Slika legend). */
	.field-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: #102e66;
	}
	/* Gap between a field title and its input (matches Novi članak). */
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
		font-size: 0.95rem;
		color: #102e66;
	}
	/* The "other club members" checkbox belongs to the Sudionici field above it, so pull
	   it up close (counteract most of the column's 1.5rem gap) rather than sitting a full
	   field-gap away. */
	.check-row--attach {
		margin-top: -1rem;
	}
	.form-actions {
		/* Wide gap so the action buttons sit clearly apart from the form fields. */
		margin-top: 4.5rem;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		font-size: 0.9rem;
		font-family: inherit;
		border: 1px solid transparent;
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
	/* Odustani (cancel/discard): red outline so it reads as "leave without saving".
	   Sits in the same right-aligned action row as Spremi/Objavi (matches Novi članak). */
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
	}
</style>

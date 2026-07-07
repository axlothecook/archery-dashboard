<script lang="ts">
	// Raspored → Novi događaj: the full create-event form. Covers every backend
	// createBody field: name, discipline, dateFrom/To, location, organizer, format,
	// level (single-select), attending archers (multi-select) + unlisted-club flag,
	// image, source URL, cancelled, hidden, draft/publish. Two-column so it fits
	// without page scroll. POSTs to POST /admin/events.
	import { goto } from '$app/navigation';
	import {
		createEvent,
		DISCIPLINE_LABEL,
		type Discipline,
		type CreateEventInput
	} from '$lib/events';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import ArcherPicker from '$lib/components/ArcherPicker.svelte';
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
	let levelId = $state<string>(''); // '' = no level
	let attendingArcherIds = $state<string[]>([]);
	let hasUnlistedClubAttendee = $state(false);
	let imageUrl = $state('');
	let imageAlt = $state('');
	let sourceUrl = $state('');
	let isCancelled = $state(false);
	let hidden = $state(false);

	let saving = $state(false);
	let error = $state('');

	const disciplineOptions = (Object.keys(DISCIPLINE_LABEL) as Discipline[]).map((v) => ({
		value: v,
		label: DISCIPLINE_LABEL[v]
	}));
	// Level select: a "no level" option + one per level (dot shown via label text).
	const levelOptions = $derived([
		{ value: '', label: 'Bez razine' },
		...data.levels.map((l) => ({ value: l.id, label: l.name }))
	]);

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

	function validate(): string | null {
		if (!name.trim()) return 'Naziv događaja je obavezan.';
		if (!dateFrom) return 'Datum početka je obavezan.';
		if (dateTo && dateTo < dateFrom) return 'Datum završetka ne može biti prije početka.';
		if (imageUrl.trim() && !imageAlt.trim()) return 'Ako je slika navedena, opis (alt) je obavezan.';
		return null;
	}

	async function submit(status: 'draft' | 'published') {
		if (saving) return;
		const v = validate();
		if (v) {
			error = v;
			return;
		}
		error = '';
		saving = true;
		try {
			await createEvent(buildInput(status));
			await goto('/nadzorna-ploca/raspored/svi');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Spremanje nije uspjelo.';
			saving = false;
		}
	}
</script>

<svelte:head><title>Novi događaj · VSK</title></svelte:head>

<section class="ev-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<CalendarIcon size={40} />
		<div>
			<h2 class="mgmt-title">Novi događaj</h2>
			<p class="mgmt-sub">Dodajte natjecanje ili događaj i spremite kao nacrt ili odmah objavite.</p>
		</div>
	</div>

	{#if error}
		<p class="form-error" role="alert">{error}</p>
	{/if}

	<form class="panel bg-white" onsubmit={(e) => e.preventDefault()}>
		<div class="form-grid">
			<!-- LEFT: the core details. -->
			<div class="col column-nowrap gap-1">
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Naziv događaja</span>
					<input class="field-input w-full br-xs" type="text" bind:value={name} required />
				</label>
				<div class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Disciplina</span>
					<DashSelect options={disciplineOptions} bind:value={discipline} ariaLabel="Disciplina" />
				</div>
				<div class="two-col">
					<label class="field column-nowrap gap-0-3">
						<span class="field-label fw-600">Datum početka</span>
						<input class="field-input w-full br-xs" type="date" bind:value={dateFrom} required />
					</label>
					<label class="field column-nowrap gap-0-3">
						<span class="field-label fw-600">Datum završetka <span class="field-hint">(nije obavezno)</span></span>
						<input class="field-input w-full br-xs" type="date" bind:value={dateTo} />
					</label>
				</div>
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Lokacija</span>
					<input class="field-input w-full br-xs" type="text" bind:value={location} />
				</label>
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Organizator</span>
					<input class="field-input w-full br-xs" type="text" bind:value={organizer} />
				</label>
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Format <span class="field-hint">(npr. WA 720)</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={format} />
				</label>
			</div>

			<!-- RIGHT: level, attendees, media, flags. -->
			<div class="col column-nowrap gap-1">
				<div class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Razina (kategorija)</span>
					{#if data.levelLoadError}
						<div class="soft-warn">Učitavanje kategorija nije uspjelo.</div>
					{:else}
						<DashSelect options={levelOptions} bind:value={levelId} ariaLabel="Razina" />
					{/if}
				</div>

				<div class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Sudionici (streličari)</span>
					<ArcherPicker
						options={data.archerOptions}
						loadError={data.archerLoadError}
						errorDetail={data.archerErrorDetail}
						bind:selected={attendingArcherIds}
					/>
				</div>
				<label class="check-row display-f align-items-center gap-0-5">
					<input type="checkbox" bind:checked={hasUnlistedClubAttendee} />
					<span>Sudjelovali i drugi članovi kluba <span class="field-hint">(nisu na popisu)</span></span>
				</label>

				<fieldset class="group">
					<legend class="group-legend">Slika <span class="field-hint">(nije obavezno)</span></legend>
					<label class="field column-nowrap gap-0-3">
						<span class="field-label fw-600">URL slike</span>
						<input class="field-input w-full br-xs" type="url" bind:value={imageUrl} />
					</label>
					<label class="field column-nowrap gap-0-3 mt-0-6">
						<span class="field-label fw-600">Opis slike (alt)</span>
						<input class="field-input w-full br-xs" type="text" bind:value={imageAlt} />
					</label>
				</fieldset>

				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Poveznica na izvor <span class="field-hint">(nije obavezno)</span></span>
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
			<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={() => submit('draft')}>
				Spremi kao nacrt
			</button>
			<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={() => submit('published')}>
				{saving ? 'Spremanje…' : 'Objavi'}
			</button>
		</div>
	</form>
</section>

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
	.form-error {
		margin: 0 0 1rem;
		padding: 0.6rem 0.9rem;
		border-radius: 8px;
		background: #fde7ec;
		color: #a4133c;
		font-size: 0.92rem;
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
	.field-label {
		font-size: 0.85rem;
		color: #5b6577;
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
	.form-actions {
		margin-top: 1.25rem;
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
	@media (max-width: 900px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

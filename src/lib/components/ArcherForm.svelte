<script lang="ts">
	// Shared create/edit form for a club archer (Momčad). Novi streličar and Uredi
	// streličar both render this — `initial` seeds it (empty for create), and `onSubmit`
	// gets the built CreateArcherInput. Full parity with the backend create/update body:
	// identity, roles/bow/categories multi-selects, gender, order, both photos + alts,
	// worldArcheryId, birthDate, coaches picker, hidden sections, status/hidden, HR bio,
	// and the repeatable Career-stats + Performance row editors.
	import { goto, beforeNavigate } from '$app/navigation';
	import {
		BOW_LABEL,
		ROLE_LABEL,
		GENDER_LABEL,
		STATUS_LABEL,
		PERF_SCOPE_LABEL,
		PERF_TYPE_LABEL,
		HIDDEN_SECTION_LABEL,
		type Bow,
		type Role,
		type Gender,
		type ArcherStatus,
		type PerformanceScope,
		type PerformanceType,
		type HiddenSection,
		type CareerStatInput,
		type PerformanceInput,
		type CreateArcherInput,
		type ArcherEditData
	} from '$lib/archers';
	import type { ArcherOption } from '$lib/articles';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import ArcherPicker from '$lib/components/ArcherPicker.svelte';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ErrorPopup from '$lib/components/ErrorPopup.svelte';
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';

	let {
		initial = null,
		coachOptions,
		coachLoadError = false,
		coachErrorDetail = '',
		submitLabel,
		onSubmit
	}: {
		/** Existing archer to edit, or null for a new one. */
		initial?: ArcherEditData | null;
		/** Published archers offered as coaches (from /admin/archers/options). */
		coachOptions: ArcherOption[];
		coachLoadError?: boolean;
		coachErrorDetail?: string;
		submitLabel: string;
		onSubmit: (input: CreateArcherInput) => Promise<void>;
	} = $props();

	// ── Form state (seeded ONCE from `initial` when editing) ───────────────────
	// The form is remounted per route, so reading `initial` once to seed local state
	// is intended (not a live binding). svelte-ignore the state_referenced_locally hint.
	// svelte-ignore state_referenced_locally
	const seed = initial;
	let firstName = $state(seed?.firstName ?? '');
	let lastName = $state(seed?.lastName ?? '');
	let roles = $state<Role[]>(seed?.roles ?? ['archer']);
	let bowType = $state<Bow[]>(seed?.bowType ?? []);
	let gender = $state<string>(seed?.gender ?? '');
	let categoriesText = $state((seed?.competitionCategories ?? []).join(', '));
	let order = $state<number>(seed?.order ?? 0);
	let cardPhotoUrl = $state(seed?.cardPhotoUrl ?? '');
	let cardPhotoAlt = $state(seed?.cardPhotoAlt ?? '');
	let profilePhotoUrl = $state(seed?.profilePhotoUrl ?? '');
	let profilePhotoAlt = $state(seed?.profilePhotoAlt ?? '');
	let worldArcheryId = $state(seed?.worldArcheryId ?? '');
	let birthDate = $state(seed?.birthDate ?? '');
	let coachIds = $state<string[]>(seed?.coachIds ?? []);
	let hiddenSections = $state<HiddenSection[]>((seed?.hiddenSections as HiddenSection[]) ?? []);
	let status = $state<ArcherStatus>(seed?.status ?? 'draft');
	let hidden = $state<boolean>(seed?.hidden ?? false);
	let bio = $state(seed?.bio ?? '');
	let careerStats = $state<CareerStatInput[]>(seed ? seed.careerStats.map((s) => ({ ...s })) : []);
	let performance = $state<PerformanceInput[]>(
		seed ? seed.performance.map((p) => ({ ...p, categories: [...p.categories] })) : []
	);

	let saving = $state(false);
	let errors = $state<string[]>([]);

	const ROLE_KEYS = Object.keys(ROLE_LABEL) as Role[];
	const BOW_KEYS = Object.keys(BOW_LABEL) as Bow[];
	const HIDDEN_KEYS = Object.keys(HIDDEN_SECTION_LABEL) as HiddenSection[];
	const genderOptions = [
		{ value: '', label: 'Nepoznato / neodređeno' },
		...(Object.keys(GENDER_LABEL) as Gender[]).map((v) => ({ value: v, label: GENDER_LABEL[v] }))
	];
	const statusOptions = (Object.keys(STATUS_LABEL) as ArcherStatus[]).map((v) => ({ value: v, label: STATUS_LABEL[v] }));
	const scopeOptions = (Object.keys(PERF_SCOPE_LABEL) as PerformanceScope[]).map((v) => ({ value: v, label: PERF_SCOPE_LABEL[v] }));
	const perfTypeOptions = (Object.keys(PERF_TYPE_LABEL) as PerformanceType[]).map((v) => ({ value: v, label: PERF_TYPE_LABEL[v] }));

	function toggleRole(r: Role) {
		roles = roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r];
	}
	function toggleBow(b: Bow) {
		bowType = bowType.includes(b) ? bowType.filter((x) => x !== b) : [...bowType, b];
	}
	function toggleHidden(s: HiddenSection) {
		hiddenSections = hiddenSections.includes(s) ? hiddenSections.filter((x) => x !== s) : [...hiddenSections, s];
	}

	// ── Career-stat rows ───────────────────────────────────────────────────────
	function addStat() {
		careerStats = [
			...careerStats,
			{ year: new Date().getFullYear(), discipline: '', averageScore: null, wins: 0, losses: 0, highestScore: null }
		];
	}
	function removeStat(i: number) {
		careerStats = careerStats.filter((_, idx) => idx !== i);
	}

	// ── Performance rows ─────────────────────────────────────────────────────────
	function addPerf() {
		performance = [
			...performance,
			{ date: '', name: '', scope: 'domestic', type: 'outdoor', categories: [], meters: null, placing: null, points: null }
		];
	}
	function removePerf(i: number) {
		performance = performance.filter((_, idx) => idx !== i);
	}

	// ── Unsaved-changes guard ────────────────────────────────────────────────────
	let saved = $state(false);
	const snapshot = () =>
		JSON.stringify({
			firstName, lastName, roles, bowType, gender, categoriesText, order,
			cardPhotoUrl, cardPhotoAlt, profilePhotoUrl, profilePhotoAlt,
			worldArcheryId, birthDate, coachIds, hiddenSections, status, hidden, bio,
			careerStats, performance
		});
	const initialSnapshot = snapshot();
	const dirty = $derived(!saved && snapshot() !== initialSnapshot);
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
	function onBeforeUnload(e: BeforeUnloadEvent) {
		if (dirty) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	function parseCats(text: string): string[] {
		return text
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}

	function buildInput(): CreateArcherInput {
		const t = (s: string) => s.trim();
		const numOrNull = (v: number | null) => (v === null || Number.isNaN(v) ? null : Number(v));
		return {
			firstName: t(firstName),
			lastName: t(lastName),
			roles,
			bowType,
			gender: (gender || null) as Gender | null,
			competitionCategories: parseCats(categoriesText),
			order: Number(order) || 0,
			cardPhotoUrl: t(cardPhotoUrl) || null,
			cardPhotoAlt: t(cardPhotoAlt) || null,
			profilePhotoUrl: t(profilePhotoUrl) || null,
			profilePhotoAlt: t(profilePhotoAlt) || null,
			worldArcheryId: t(worldArcheryId) || null,
			birthDate: birthDate || null,
			hiddenSections,
			coachIds,
			status,
			hidden,
			bio: t(bio),
			careerStats: careerStats.map((s) => ({
				...s,
				year: Number(s.year) || 0,
				averageScore: numOrNull(s.averageScore),
				wins: Number(s.wins) || 0,
				losses: Number(s.losses) || 0,
				highestScore: numOrNull(s.highestScore)
			})),
			performance: performance.map((p) => ({
				...p,
				categories: p.categories,
				meters: p.meters?.trim() || null,
				placing: p.placing?.trim() || null,
				points: numOrNull(p.points)
			}))
		};
	}

	// Mandatory: first + last name, ≥1 role, ≥1 bow, ≥1 competition category, bio, and
	// BOTH images with their alt text. (The backend allows more to be empty, but the
	// dashboard requires a complete archer profile.)
	function validate(): string[] {
		const errs: string[] = [];
		if (!firstName.trim()) errs.push('Ime je obavezno.');
		if (!lastName.trim()) errs.push('Prezime je obavezno.');
		if (roles.length === 0) errs.push('Odaberite barem jednu ulogu.');
		if (bowType.length === 0) errs.push('Odaberite barem jedan luk.');
		if (parseCats(categoriesText).length === 0) errs.push('Kategorije natjecanja su obavezne.');
		if (!bio.trim()) errs.push('Biografija je obavezna.');
		if (!cardPhotoUrl.trim()) errs.push('Slika za malu karticu je obavezna.');
		if (cardPhotoUrl.trim() && !cardPhotoAlt.trim()) errs.push('Opis slike za malu karticu (alt) je obavezan.');
		if (!profilePhotoUrl.trim()) errs.push('Profilna slika je obavezna.');
		if (profilePhotoUrl.trim() && !profilePhotoAlt.trim()) errs.push('Opis profilne slike (alt) je obavezan.');
		for (const [i, s] of careerStats.entries()) {
			if (!s.discipline.trim()) errs.push(`Statistika #${i + 1}: disciplina je obavezna.`);
		}
		for (const [i, p] of performance.entries()) {
			if (!p.date.trim()) errs.push(`Nastup #${i + 1}: datum je obavezan.`);
			if (!p.name.trim()) errs.push(`Nastup #${i + 1}: naziv je obavezan.`);
		}
		return errs;
	}

	async function submit() {
		if (saving) return;
		const errs = validate();
		if (errs.length > 0) {
			errors = errs;
			return;
		}
		errors = [];
		saving = true;
		try {
			await onSubmit(buildInput());
			saved = true;
			await goto('/nadzorna-ploca/momcad/svi');
		} catch (e) {
			errors = [e instanceof Error ? e.message : 'Spremanje nije uspjelo.'];
			saving = false;
		}
	}

	async function cancel() {
		await goto('/nadzorna-ploca/momcad/svi');
	}

	// Bind a performance row's categories (comma text ↔ string[]).
	function catsFor(p: PerformanceInput): string {
		return p.categories.join(', ');
	}
	function setPerfCats(i: number, text: string) {
		performance[i].categories = parseCats(text);
	}
</script>

<svelte:window onbeforeunload={onBeforeUnload} />

<form class="panel bg-white custom-scrollbar" onsubmit={(e) => e.preventDefault()}>
	<div class="form-grid">
		<!-- LEFT: identity + classification + bio. -->
		<div class="col column-nowrap gap-1-5">
			<div class="two-col">
				<label class="field column-nowrap gap-title">
					<span class="field-title">Ime <span class="req">*</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={firstName} required />
				</label>
				<label class="field column-nowrap gap-title">
					<span class="field-title">Prezime <span class="req">*</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={lastName} required />
				</label>
			</div>

			<div class="field column-nowrap gap-title">
				<span class="field-title">Uloga <span class="req">*</span></span>
				<div class="checks checks-spaced display-f gap-1">
					{#each ROLE_KEYS as r (r)}
						<button type="button" class="check-opt cursor-pointer display-f align-items-center gap-0-4" onclick={() => toggleRole(r)}>
							<span class="check-box display-f align-items-center justify-content-center" class:checked={roles.includes(r)} aria-hidden="true">
								{#if roles.includes(r)}<CheckIcon size={12} />{/if}
							</span>
							{ROLE_LABEL[r]}
						</button>
					{/each}
				</div>
			</div>

			<div class="field column-nowrap gap-title">
				<span class="field-title">Luk <span class="req">*</span></span>
				<div class="checks checks-spaced display-f gap-1">
					{#each BOW_KEYS as b (b)}
						<button type="button" class="check-opt cursor-pointer display-f align-items-center gap-0-4" onclick={() => toggleBow(b)}>
							<span class="check-box display-f align-items-center justify-content-center" class:checked={bowType.includes(b)} aria-hidden="true">
								{#if bowType.includes(b)}<CheckIcon size={12} />{/if}
							</span>
							{BOW_LABEL[b]}
						</button>
					{/each}
				</div>
			</div>

			<div class="two-col">
				<div class="field column-nowrap gap-title">
					<span class="field-title">Spol</span>
					<DashSelect options={genderOptions} bind:value={gender} ariaLabel="Spol" />
				</div>
				<label class="field column-nowrap gap-title">
					<span class="field-title">Redoslijed</span>
					<input class="field-input w-full br-xs" type="number" bind:value={order} min="0" />
				</label>
			</div>

			<label class="field column-nowrap gap-title">
				<span class="field-title">Kategorije natjecanja <span class="req">*</span></span>
				<input class="field-input w-full br-xs" type="text" bind:value={categoriesText} placeholder="npr. RM, CW, RŽ" />
				<span class="field-hint">Odvojite zarezom (World Archery kodovi).</span>
			</label>

			<div class="two-col">
				<label class="field column-nowrap gap-title">
					<span class="field-title">Datum rođenja</span>
					<input class="field-input w-full br-xs" type="date" bind:value={birthDate} />
				</label>
				<label class="field column-nowrap gap-title">
					<span class="field-title">World Archery ID</span>
					<input class="field-input w-full br-xs" type="text" bind:value={worldArcheryId} />
				</label>
			</div>

			<label class="field column-nowrap gap-title">
				<span class="field-title">Biografija <span class="req">*</span></span>
				<textarea class="field-input field-textarea w-full br-xs" bind:value={bio}></textarea>
			</label>
		</div>

		<!-- RIGHT: photos + coaches + visibility + row editors. -->
		<div class="col column-nowrap gap-1-5">
			<fieldset class="group">
				<legend class="group-legend">Slika za malu karticu <span class="req">*</span></legend>
				<ImageUpload label="Slika" entityType="archer" fit="cover" bind:url={cardPhotoUrl} />
				<label class="field column-nowrap gap-title mt-1">
					<span class="field-title">Opis slike za malu karticu (alt) <span class="req">*</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={cardPhotoAlt} />
				</label>
			</fieldset>

			<fieldset class="group">
				<legend class="group-legend">Profilna slika <span class="req">*</span></legend>
				<ImageUpload label="Slika" entityType="archer" fit="cover" bind:url={profilePhotoUrl} />
				<label class="field column-nowrap gap-title mt-1">
					<span class="field-title">Opis profilne slike (alt) <span class="req">*</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={profilePhotoAlt} />
				</label>
			</fieldset>

			<div class="field column-nowrap gap-title">
				<span class="field-title">Treneri <span class="req">*</span></span>
				<ArcherPicker options={coachOptions} loadError={coachLoadError} errorDetail={coachErrorDetail} bind:selected={coachIds} />
			</div>

			<div class="two-col">
				<div class="field column-nowrap gap-title">
					<span class="field-title">Stanje <span class="req">*</span></span>
					<DashSelect options={statusOptions} bind:value={status} ariaLabel="Stanje" />
				</div>
				<label class="field checkbox-field display-f align-items-center gap-0-5">
					<input type="checkbox" bind:checked={hidden} />
					<span class="field-title">Skriveno s javne stranice</span>
				</label>
			</div>

			<div class="field column-nowrap">
				<span class="field-title">Skrivene sekcije</span>
				<span class="field-hint hint-under-title">Sakrij pojedine sekcije na javnom profilu.</span>
				<div class="checks checks-spaced checks-spaced--wide display-f gap-1">
					{#each HIDDEN_KEYS as s (s)}
						<button type="button" class="check-opt cursor-pointer display-f align-items-center gap-0-4" onclick={() => toggleHidden(s)}>
							<span class="check-box display-f align-items-center justify-content-center" class:checked={hiddenSections.includes(s)} aria-hidden="true">
								{#if hiddenSections.includes(s)}<CheckIcon size={12} />{/if}
							</span>
							{HIDDEN_SECTION_LABEL[s]}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Career stats row editor -->
	<div class="rows-block">
		<div class="rows-head display-f align-items-center gap-1-5">
			<span class="rows-title">Statistika karijere</span>
			<button type="button" class="btn-row-add cursor-pointer display-f align-items-center gap-0-4" onclick={addStat}>
				<AddIcon size={16} /> Dodaj red
			</button>
		</div>
		{#if careerStats.length === 0}
			<p class="rows-empty">Nema unesene statistike.</p>
		{:else}
			<div class="rows-scroll custom-scrollbar">
				<table class="rows-tbl">
					<thead>
						<tr><th>Godina</th><th>Disciplina</th><th>Prosjek</th><th>Pobjede</th><th>Porazi</th><th>Najbolji</th><th></th></tr>
					</thead>
					<tbody>
						{#each careerStats as s, i (i)}
							<tr>
								<td><input class="cell-input" type="number" bind:value={s.year} /></td>
								<td><input class="cell-input cell-wide" type="text" bind:value={s.discipline} /></td>
								<td><input class="cell-input" type="number" step="any" bind:value={s.averageScore} /></td>
								<td><input class="cell-input cell-narrow" type="number" bind:value={s.wins} /></td>
								<td><input class="cell-input cell-narrow" type="number" bind:value={s.losses} /></td>
								<td><input class="cell-input" type="number" step="any" bind:value={s.highestScore} /></td>
								<td><button type="button" class="row-del cursor-pointer display-f" aria-label="Ukloni red" onclick={() => removeStat(i)}><TrashIcon size={16} /></button></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Performance row editor -->
	<div class="rows-block">
		<div class="rows-head display-f align-items-center gap-1-5">
			<span class="rows-title">Nastupi</span>
			<button type="button" class="btn-row-add cursor-pointer display-f align-items-center gap-0-4" onclick={addPerf}>
				<AddIcon size={16} /> Dodaj red
			</button>
		</div>
		{#if performance.length === 0}
			<p class="rows-empty">Nema unesenih nastupa.</p>
		{:else}
			<div class="rows-scroll custom-scrollbar">
				<table class="rows-tbl">
					<thead>
						<tr><th>Datum (MM/GGGG)</th><th>Natjecanje</th><th>Vrsta</th><th>Opseg</th><th>Kategorije</th><th>Metri</th><th>Plasman</th><th>Bodovi</th><th></th></tr>
					</thead>
					<tbody>
						{#each performance as p, i (i)}
							<tr>
								<td><input class="cell-input" type="text" bind:value={p.date} placeholder="07/2026" /></td>
								<td><input class="cell-input cell-wide" type="text" bind:value={p.name} /></td>
								<td><select class="cell-select" bind:value={p.type}>{#each perfTypeOptions as o (o.value)}<option value={o.value}>{o.label}</option>{/each}</select></td>
								<td><select class="cell-select" bind:value={p.scope}>{#each scopeOptions as o (o.value)}<option value={o.value}>{o.label}</option>{/each}</select></td>
								<td><input class="cell-input cell-wide" type="text" value={catsFor(p)} oninput={(e) => setPerfCats(i, e.currentTarget.value)} placeholder="RM, CW" /></td>
								<td><input class="cell-input cell-narrow" type="text" bind:value={p.meters} placeholder="50m" /></td>
								<td><input class="cell-input" type="text" bind:value={p.placing} /></td>
								<td><input class="cell-input cell-narrow" type="number" step="any" bind:value={p.points} /></td>
								<td><button type="button" class="row-del cursor-pointer display-f" aria-label="Ukloni red" onclick={() => removePerf(i)}><TrashIcon size={16} /></button></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<div class="form-actions display-f justify-content-flex-end gap-0-5">
		<button class="btn btn--cancel cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={cancel}>
			Odustani
		</button>
		<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={submit}>
			{saving ? 'Spremanje…' : submitLabel}
		</button>
	</div>
</form>

<ErrorPopup bind:messages={errors} />
<ConfirmDialog bind:this={leaveDlg} confirmLabel="Napusti" cancelLabel="Ostani" />

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$blue: map.get(lib.$colors, 'blue-dress');
	$red: map.get(lib.$colors, 'error-secondary');
	$border: map.get(lib.$colors, 'seashell');

	.panel {
		border-radius: 14px;
		padding: 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		/* Fill the content frame and scroll the (tall) form INSIDE the white div, so the
		   lower sections (Statistika karijere / Nastupi) come into view instead of running
		   off the bottom of the screen. The page itself never scrolls. */
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
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
	.mt-1 {
		margin-top: 1rem;
	}
	.field-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: $navy;
	}
	.gap-title {
		gap: 0.3rem;
	}
	.req {
		color: $red;
		font-weight: 700;
	}
	.field-hint {
		font-weight: 400;
		font-size: 0.8rem;
		color: #9aa3b2;
	}
	/* A hint that sits directly UNDER the title (small gap), before the control. */
	.hint-under-title {
		margin-top: 0.3rem;
	}
	/* More breathing room between a title/hint and its checkbox row. */
	.checks-spaced {
		margin-top: 0.6rem;
	}
	/* Skrivene sekcije: its .field has no flex gap-title, so add that 0.3rem here too, so
	   the hint→checkboxes gap matches the Luk title→checkboxes gap. */
	.checks-spaced--wide {
		margin-top: 0.9rem;
	}
	.field-input {
		box-sizing: border-box;
		padding: 0.6rem 0.8rem;
		border: 1px solid #d7dee8;
		font-size: 0.95rem;
		font-family: inherit;
		color: $navy;
		background: #fff;
	}
	.field-input:focus {
		outline: none;
		border-color: $blue;
	}
	.field-textarea {
		resize: vertical;
		line-height: 1.4;
		min-height: 10rem;
	}
	.checkbox-field {
		align-self: end;
		padding-bottom: 0.6rem;
	}
	.group {
		margin: 0;
		padding: 1rem 1.1rem;
		border: 1px solid $border;
		border-radius: 10px;
	}
	.group-legend {
		padding: 0 0.4rem;
		font-size: 0.9rem;
		font-weight: 700;
		color: $navy;
	}
	/* Multi-select checkboxes (roles / bow / hidden sections) — a plain check box + label,
	   no pill/chip shape. */
	.checks {
		flex-wrap: wrap;
	}
	.check-opt {
		gap: 0.4rem;
		padding: 0;
		border: 0;
		background: none;
		color: $navy;
		font-size: 0.9rem;
		font-family: inherit;
	}
	.check-box {
		width: 16px;
		height: 16px;
		flex: 0 0 auto;
		border: 1.5px solid #b9c3d3;
		border-radius: 4px;
		background: #fff;
		color: #fff;
	}
	.check-box.checked {
		border-color: $navy;
		background: $navy;
	}
	/* Row editors (career stats / performance). */
	.rows-block {
		margin-top: 1.75rem;
	}
	.rows-head {
		/* Small gap: the subtext sits close under the title, and this clears the (slightly
		   taller) "Dodaj red" button so it isn't in the way. */
		margin-bottom: 0.5rem;
	}
	.rows-title {
		font-size: 1rem;
		font-weight: 700;
		color: $navy;
	}
	.btn-row-add {
		padding: 0.3rem 0.8rem;
		border: 1px solid #d7dee8;
		border-radius: 8px;
		background: #fff;
		color: $navy;
		font-size: 0.85rem;
		font-weight: 600;
		font-family: inherit;
	}
	.btn-row-add:hover {
		background: #eef1f3;
	}
	.rows-empty {
		/* Sits close under the title; the .rows-head margin already clears the button. */
		margin: 0;
		padding: 0;
		color: #9aa3b2;
		font-size: 0.9rem;
	}
	.rows-scroll {
		overflow-x: auto;
		border: 1px solid $border;
		border-radius: 8px;
	}
	.rows-tbl {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	.rows-tbl th {
		text-align: left;
		padding: 0.5rem 0.6rem;
		font-weight: 700;
		color: #1b1b1b;
		white-space: nowrap;
		background: #f7f8fa;
		border-bottom: 1px solid $border;
	}
	.rows-tbl td {
		padding: 0.35rem 0.5rem;
		border-bottom: 1px solid #f3f5f8;
		vertical-align: middle;
	}
	.rows-tbl tbody tr:last-child td {
		border-bottom: 0;
	}
	.cell-input,
	.cell-select {
		box-sizing: border-box;
		width: 6rem;
		padding: 0.4rem 0.5rem;
		border: 1px solid #d7dee8;
		border-radius: 6px;
		font-size: 0.85rem;
		font-family: inherit;
		color: $navy;
		background: #fff;
	}
	.cell-input:focus,
	.cell-select:focus {
		outline: none;
		border-color: $blue;
	}
	.cell-wide {
		width: 12rem;
	}
	.cell-narrow {
		width: 4rem;
	}
	.row-del {
		align-items: center;
		border: 0;
		background: none;
		padding: 0.3rem;
		color: #5b6577;
	}
	.row-del:hover {
		color: $red;
	}
	.form-actions {
		/* Clear separation between the action buttons and the last section above. */
		margin-top: 4rem;
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
		background: $navy;
		color: #fff;
	}
	.btn--primary:hover:not(:disabled) {
		background: #0c2350;
	}
	.btn--cancel {
		background: #fff;
		color: $red;
		border-color: $red;
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

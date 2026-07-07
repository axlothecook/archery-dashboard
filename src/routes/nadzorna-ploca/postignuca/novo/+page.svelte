<script lang="ts">
	// Postignuća → Novo postignuće: the create-achievement form. Fields: title, year,
	// scope, level, type, medal (optional), credited archers, image (optional) + alt.
	// POSTs to POST /admin/achievements. Mirrors the Novi događaj form.
	import { goto, beforeNavigate } from '$app/navigation';
	import {
		createAchievement,
		SCOPE_LABEL,
		LEVEL_LABEL,
		TYPE_LABEL,
		MEDAL_LABEL,
		type AchievementScope,
		type AchievementLevel,
		type AchievementType,
		type AchievementMedal,
		type CreateAchievementInput
	} from '$lib/achievements';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import ArcherPicker from '$lib/components/ArcherPicker.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ErrorPopup from '$lib/components/ErrorPopup.svelte';
	import TrophyIcon from '$lib/components/icons/TrophyIcon.svelte';

	let { data } = $props();

	const CURRENT_YEAR = new Date().getFullYear();

	// ── Form state ───────────────────────────────────────────────────────────
	let title = $state('');
	let year = $state<number>(CURRENT_YEAR);
	let scope = $state<AchievementScope>('individual');
	let level = $state<AchievementLevel>('state');
	let type = $state<AchievementType>('title');
	let medal = $state<string>(''); // '' = no medal
	let archerIds = $state<string[]>([]);
	let imageUrl = $state('');
	let imageAlt = $state('');

	let saving = $state(false);
	let errors = $state<string[]>([]);

	const scopeOptions = (Object.keys(SCOPE_LABEL) as AchievementScope[]).map((v) => ({ value: v, label: SCOPE_LABEL[v] }));
	const levelOptions = (Object.keys(LEVEL_LABEL) as AchievementLevel[]).map((v) => ({ value: v, label: LEVEL_LABEL[v] }));
	const typeOptions = (Object.keys(TYPE_LABEL) as AchievementType[]).map((v) => ({ value: v, label: TYPE_LABEL[v] }));
	const medalOptions = [
		{ value: '', label: 'Bez medalje' },
		...(Object.keys(MEDAL_LABEL) as AchievementMedal[]).map((v) => ({ value: v, label: MEDAL_LABEL[v] }))
	];

	// ── Unsaved-changes guard ────────────────────────────────────────────────────
	let saved = $state(false);
	const dirty = $derived(
		!saved &&
			(title !== '' || year !== CURRENT_YEAR || scope !== 'individual' || level !== 'state' ||
				type !== 'title' || medal !== '' || archerIds.length > 0 || imageUrl !== '' || imageAlt !== '')
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
	function onBeforeUnload(e: BeforeUnloadEvent) {
		if (dirty) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	function buildInput(): CreateAchievementInput {
		const t = (s: string) => s.trim();
		return {
			year: Number(year),
			archerIds,
			scope,
			level,
			type,
			medal: (medal || null) as AchievementMedal | null,
			imageUrl: t(imageUrl) || null,
			imageAlt: t(imageAlt) || null,
			title: t(title)
		};
	}

	// Mandatory: Naslov, Godina, Scope, Razina, Vrsta, Slika + alt. Optional: Medalja,
	// Strijelci (a club-level achievement can have no credited archers; a title needs no medal).
	function validate(): string[] {
		const errs: string[] = [];
		if (!title.trim()) errs.push('Naslov postignuća je obavezan.');
		if (!year || Number.isNaN(Number(year))) errs.push('Godina je obavezna.');
		if (!imageUrl.trim()) errs.push('Slika je obavezna.');
		if (!imageAlt.trim()) errs.push('Opis slike (alt) je obavezan.');
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
			await createAchievement(buildInput());
			saved = true;
			await goto('/nadzorna-ploca/postignuca/sva');
		} catch (e) {
			errors = [e instanceof Error ? e.message : 'Spremanje nije uspjelo.'];
			saving = false;
		}
	}

	async function cancel() {
		await goto('/nadzorna-ploca/postignuca/sva');
	}
</script>

<svelte:window onbeforeunload={onBeforeUnload} />

<svelte:head><title>Novo postignuće · VSK</title></svelte:head>

<section class="ac-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<TrophyIcon size={40} />
		<div>
			<h2 class="mgmt-title">Novo postignuće</h2>
			<p class="mgmt-sub">Dodajte naslov, rekord ili medalju kluba.</p>
		</div>
	</div>

	<form class="panel bg-white" onsubmit={(e) => e.preventDefault()}>
		<div class="form-grid">
			<!-- LEFT: title, year, classification. -->
			<div class="col column-nowrap gap-1-5">
				<label class="field column-nowrap gap-title">
					<span class="field-title">Naslov postignuća <span class="req">*</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={title} required />
				</label>
				<div class="two-col">
					<label class="field column-nowrap gap-title">
						<span class="field-title">Godina <span class="req">*</span></span>
						<input class="field-input w-full br-xs" type="number" bind:value={year} min="1900" max="2100" />
					</label>
					<div class="field column-nowrap gap-title">
						<span class="field-title">Vrsta <span class="req">*</span></span>
						<DashSelect options={typeOptions} bind:value={type} ariaLabel="Vrsta" />
					</div>
				</div>
				<div class="two-col">
					<div class="field column-nowrap gap-title">
						<span class="field-title">Opseg <span class="req">*</span></span>
						<DashSelect options={scopeOptions} bind:value={scope} ariaLabel="Opseg" />
					</div>
					<div class="field column-nowrap gap-title">
						<span class="field-title">Razina <span class="req">*</span></span>
						<DashSelect options={levelOptions} bind:value={level} ariaLabel="Razina" />
					</div>
				</div>
				<div class="field column-nowrap gap-title">
					<span class="field-title">Medalja</span>
					<DashSelect options={medalOptions} bind:value={medal} ariaLabel="Medalja" />
				</div>
			</div>

			<!-- RIGHT: credited archers + image. -->
			<div class="col column-nowrap gap-1-5">
				<div class="field column-nowrap gap-title">
					<span class="field-title">Strijelci <span class="field-hint">(klupsko postignuće nema strijelce)</span></span>
					<ArcherPicker
						options={data.archerOptions}
						loadError={data.archerLoadError}
						errorDetail={data.archerErrorDetail}
						bind:selected={archerIds}
					/>
				</div>

				<fieldset class="group">
					<legend class="group-legend">Slika <span class="req">*</span></legend>
					<ImageUpload label="Slika" entityType="achievement" bind:url={imageUrl} />
					<label class="field column-nowrap gap-title mt-0-6">
						<span class="field-title">Opis slike (alt) <span class="req">*</span></span>
						<input class="field-input w-full br-xs" type="text" bind:value={imageAlt} required />
					</label>
				</fieldset>
			</div>
		</div>

		<div class="form-actions display-f justify-content-flex-end gap-0-5">
			<button class="btn btn--cancel cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={cancel}>
				Odustani
			</button>
			<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={submit}>
				{saving ? 'Spremanje…' : 'Spremi'}
			</button>
		</div>
	</form>
</section>

<ErrorPopup bind:messages={errors} />
<ConfirmDialog bind:this={leaveDlg} confirmLabel="Napusti" cancelLabel="Ostani" />

<style>
	.ac-section {
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
		/* Reserve the taller state (the Strijelci chips box adds ~11rem when the first
		   archer is picked) so the panel doesn't grow/jump when chips appear. */
		min-height: 37rem;
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
	.field-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: #102e66;
	}
	.gap-title {
		gap: 0.3rem;
	}
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
	.form-actions {
		margin-top: 2.5rem;
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

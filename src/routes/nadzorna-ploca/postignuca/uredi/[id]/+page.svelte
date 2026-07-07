<script lang="ts">
	// Postignuća → Uredi postignuće: same layout as Novo postignuće, prefilled with the
	// existing achievement (GET /admin/achievements/:id) and saved via PATCH. Mirrors the
	// Uredi događaj page.
	import { goto, beforeNavigate } from '$app/navigation';
	import {
		updateAchievement,
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
	// svelte-ignore state_referenced_locally
	const a = data.achievement;

	// ── Form state (seeded from the loaded achievement) ────────────────────────
	let title = $state(a.title);
	let year = $state<number>(a.year);
	let scope = $state<AchievementScope>(a.scope);
	let level = $state<AchievementLevel>(a.level);
	let type = $state<AchievementType>(a.type);
	let medal = $state<string>(a.medal ?? '');
	let archerIds = $state<string[]>([...a.archerIds]);
	let imageUrl = $state(a.imageUrl ?? '');
	let imageAlt = $state(a.imageAlt ?? '');

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
	const initialSnapshot = JSON.stringify({
		title: a.title, year: a.year, scope: a.scope, level: a.level, type: a.type,
		medal: a.medal ?? '', archerIds: a.archerIds, imageUrl: a.imageUrl ?? '', imageAlt: a.imageAlt ?? ''
	});
	let saved = $state(false);
	const dirty = $derived(
		!saved &&
			JSON.stringify({ title, year, scope, level, type, medal, archerIds, imageUrl, imageAlt }) !== initialSnapshot
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

	function buildPatch(): Partial<CreateAchievementInput> {
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

	function validate(): string[] {
		const errs: string[] = [];
		if (!title.trim()) errs.push('Naslov postignuća je obavezan.');
		if (!year || Number.isNaN(Number(year))) errs.push('Godina je obavezna.');
		if (imageUrl.trim() && !imageAlt.trim()) errs.push('Ako je slika navedena, opis (alt) je obavezan.');
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
			await updateAchievement(a.id, buildPatch());
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

<svelte:head><title>Uredi postignuće · VSK</title></svelte:head>

<section class="ac-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<TrophyIcon size={40} />
		<div>
			<h2 class="mgmt-title">Uredi postignuće</h2>
			<p class="mgmt-sub">Uredite postojeće postignuće i spremite promjene.</p>
		</div>
	</div>

	<form class="panel bg-white" onsubmit={(e) => e.preventDefault()}>
		<div class="form-grid">
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
					<span class="field-title">Medalja <span class="field-hint">(nije obavezno)</span></span>
					<DashSelect options={medalOptions} bind:value={medal} ariaLabel="Medalja" />
				</div>
			</div>

			<div class="col column-nowrap gap-1-5">
				<div class="field column-nowrap gap-title">
					<span class="field-title">Strijelci <span class="field-hint">(nije obavezno — klupsko postignuće nema strijelce)</span></span>
					<ArcherPicker
						options={data.archerOptions}
						loadError={data.archerLoadError}
						errorDetail={data.archerErrorDetail}
						bind:selected={archerIds}
					/>
				</div>

				<fieldset class="group">
					<legend class="group-legend">Slika <span class="field-hint">(nije obavezno)</span></legend>
					<ImageUpload label="Slika" entityType="achievement" bind:url={imageUrl} />
					<label class="field column-nowrap gap-title mt-0-6">
						<span class="field-title">Opis slike (alt)</span>
						<input class="field-input w-full br-xs" type="text" bind:value={imageAlt} />
					</label>
				</fieldset>
			</div>
		</div>

		<div class="form-actions display-f justify-content-flex-end gap-0-5">
			<button class="btn btn--cancel cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={cancel}>
				Odustani
			</button>
			<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={submit}>
				{saving ? 'Spremanje…' : 'Spremi promjene'}
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

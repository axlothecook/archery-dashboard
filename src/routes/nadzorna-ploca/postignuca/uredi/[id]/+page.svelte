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
		<TrophyIcon size={48} />
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
					<span class="field-title">Medalja</span>
					<DashSelect options={medalOptions} bind:value={medal} ariaLabel="Medalja" />
				</div>
			</div>

			<div class="col column-nowrap gap-1-5">
				<fieldset class="group">
					<legend class="group-legend">Slika <span class="req">*</span></legend>
					<ImageUpload label="Slika" entityType="achievement" bind:url={imageUrl} />
					<label class="field column-nowrap gap-title mt-0-6">
						<span class="field-title">Opis slike (alt) <span class="req">*</span></span>
						<input class="field-input w-full br-xs" type="text" bind:value={imageAlt} required />
					</label>
				</fieldset>

				<div class="field column-nowrap gap-title">
					<span class="field-title">Strijelci <span class="field-hint">(klupsko postignuće nema strijelce)</span></span>
					<ArcherPicker
						options={data.archerOptions}
						loadError={data.archerLoadError}
						errorDetail={data.archerErrorDetail}
						bind:selected={archerIds}
					/>
				</div>
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

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	// Library palette colours (exact matches).
	$navy: map.get(lib.$colors, 'deep-sapphire'); // $navy
	$blue: map.get(lib.$colors, 'blue-dress'); // $blue
	$red: map.get(lib.$colors, 'error-secondary'); // $red
	$border: map.get(lib.$colors, 'seashell'); // $border

	.ac-section {
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
		color: $navy;
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
		color: #9aa3b2;
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
		border-top: 1px solid $border;
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
		/* White panel edge-to-edge (cancel the content area's 1rem side padding) + tighter
		   inner padding; bottom padding clears the fixed action bar. Matches Novo postignuće. */
		.panel {
			margin-left: -1rem;
			margin-right: -1rem;
			border-radius: 0;
			padding-left: 1rem;
			padding-right: 1rem;
			/* Extra bottom room so the last field (Strijelci) + its open dropdown clear the
			   fixed action bar instead of tucking under it. */
			padding-bottom: 7rem;
			/* The page (not the panel) scrolls on phone, so drop the internal scroll — an
			   overflow:auto panel would clip the Strijelci dropdown (absolutely positioned)
			   at the panel's bottom edge. */
			overflow: visible;
		}
		/* Pin the action bar to the bottom of the SCREEN (the page scrolls on mobile, so the
		   in-panel sticky wouldn't stay in view). Mirrors Novo postignuće / Uredi događaj. */
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
		/* Both buttons share the row evenly, one line, FIXED height so they're identical. */
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
	}
</style>

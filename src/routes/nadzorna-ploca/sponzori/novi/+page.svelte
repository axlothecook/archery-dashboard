<script lang="ts">
	// Sponzori → Novi sponzor: the create-sponsor form. Fields: name, logo (upload → R2)
	// + logoAlt, website (optional), description. POSTs to POST /admin/sponsors. Mirrors
	// the Novi događaj form (field-title styling, ErrorPopup, cancel guard).
	import { goto, beforeNavigate } from '$app/navigation';
	import { createSponsor, type CreateSponsorInput } from '$lib/sponsors';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ErrorPopup from '$lib/components/ErrorPopup.svelte';
	import HandshakeIcon from '$lib/components/icons/HandshakeIcon.svelte';

	// ── Form state ───────────────────────────────────────────────────────────
	let name = $state('');
	let logoUrl = $state('');
	let logoAlt = $state('');
	let website = $state('');
	let description = $state('');

	let saving = $state(false);
	let errors = $state<string[]>([]);

	// ── Unsaved-changes guard ────────────────────────────────────────────────────
	let saved = $state(false);
	const dirty = $derived(
		!saved && (name !== '' || logoUrl !== '' || logoAlt !== '' || website !== '' || description !== '')
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

	function buildInput(): CreateSponsorInput {
		const t = (s: string) => s.trim();
		return {
			name: t(name),
			logoUrl: t(logoUrl),
			logoAlt: t(logoAlt),
			website: t(website) || null,
			description: t(description)
		};
	}

	function validate(): string[] {
		const errs: string[] = [];
		if (!name.trim()) errs.push('Naziv sponzora je obavezan.');
		if (!logoUrl.trim()) errs.push('Logotip je obavezan.');
		if (!logoAlt.trim()) errs.push('Opis logotipa (alt) je obavezan.');
		if (!description.trim()) errs.push('Opis sponzora je obavezan.');
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
			await createSponsor(buildInput());
			saved = true;
			await goto('/nadzorna-ploca/sponzori/svi');
		} catch (e) {
			errors = [e instanceof Error ? e.message : 'Spremanje nije uspjelo.'];
			saving = false;
		}
	}

	async function cancel() {
		await goto('/nadzorna-ploca/sponzori/svi');
	}
</script>

<svelte:window onbeforeunload={onBeforeUnload} />

<svelte:head><title>Novi sponzor · VSK</title></svelte:head>

<section class="sp-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<HandshakeIcon size={40} />
		<div>
			<h2 class="mgmt-title">Novi sponzor</h2>
			<p class="mgmt-sub">Dodajte partnera ili sponzora kluba.</p>
		</div>
	</div>

	<form class="panel bg-white" onsubmit={(e) => e.preventDefault()}>
		<div class="form-grid">
			<!-- LEFT: name + website + description. -->
			<div class="col column-nowrap gap-1-5">
				<label class="field column-nowrap gap-title">
					<span class="field-title">Naziv sponzora <span class="req">*</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={name} required />
				</label>
				<label class="field column-nowrap gap-title">
					<span class="field-title">Web stranica</span>
					<input class="field-input w-full br-xs" type="url" bind:value={website} placeholder="https://…" />
				</label>
				<label class="field column-nowrap gap-title">
					<span class="field-title">Opis <span class="req">*</span></span>
					<textarea class="field-input field-textarea w-full br-xs" bind:value={description}></textarea>
				</label>
			</div>

			<!-- RIGHT: logo. -->
			<div class="col column-nowrap gap-1-5">
				<fieldset class="group">
					<legend class="group-legend">Logotip <span class="req">*</span></legend>
					<ImageUpload label="Logotip" entityType="sponsor" fit="contain" bind:url={logoUrl} />
					<label class="field column-nowrap gap-title mt-0-6">
						<span class="field-title">Opis logotipa (alt) <span class="req">*</span></span>
						<input class="field-input w-full br-xs" type="text" bind:value={logoAlt} required />
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

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	// Library palette colours (exact matches).
	$navy: map.get(lib.$colors, 'deep-sapphire'); // $navy
	$blue: map.get(lib.$colors, 'blue-dress'); // $blue
	$red: map.get(lib.$colors, 'error-secondary'); // $red
	$border: map.get(lib.$colors, 'seashell'); // $border

	.sp-section {
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
		/* Fill the content frame and scroll the form INSIDE the white div so a tall form (or
		   a short screen) keeps the sticky action bar in view. Flex column so the bar can be
		   the last, sticky child. */
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
		min-height: 14rem;
		margin-top: 0;
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
		/* Sticky action bar flush to the panel's bottom edge, so Odustani/Spremi stay in
		   view while the form scrolls under it (any screen size). `bottom: -1.5rem` cancels
		   the panel's bottom padding; negative margins span the bar edge-to-edge. */
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
	@media (max-width: 820px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

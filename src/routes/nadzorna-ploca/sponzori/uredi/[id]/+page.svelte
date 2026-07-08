<script lang="ts">
	// Sponzori → Uredi sponzor: same layout as Novi sponzor, prefilled with the existing
	// sponsor (GET /admin/sponsors/:id) and saved via PATCH. Mirrors the Uredi događaj page.
	import { goto, beforeNavigate } from '$app/navigation';
	import { updateSponsor, type CreateSponsorInput } from '$lib/sponsors';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ErrorPopup from '$lib/components/ErrorPopup.svelte';
	import HandshakeIcon from '$lib/components/icons/HandshakeIcon.svelte';

	let { data } = $props();
	// svelte-ignore state_referenced_locally
	const s = data.sponsor;

	// ── Form state (seeded from the loaded sponsor) ────────────────────────────
	let name = $state(s.name);
	let logoUrl = $state(s.logoUrl);
	let logoAlt = $state(s.logoAlt);
	let website = $state(s.website ?? '');
	let description = $state(s.description);

	let saving = $state(false);
	let errors = $state<string[]>([]);

	// ── Unsaved-changes guard ────────────────────────────────────────────────────
	const initialSnapshot = JSON.stringify({
		name: s.name, logoUrl: s.logoUrl, logoAlt: s.logoAlt, website: s.website ?? '', description: s.description
	});
	let saved = $state(false);
	const dirty = $derived(
		!saved && JSON.stringify({ name, logoUrl, logoAlt, website, description }) !== initialSnapshot
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

	function buildPatch(): Partial<CreateSponsorInput> {
		const t = (str: string) => str.trim();
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
			await updateSponsor(s.id, buildPatch());
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

<svelte:head><title>Uredi sponzor · VSK</title></svelte:head>

<section class="sp-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<HandshakeIcon size={48} />
		<div>
			<h2 class="mgmt-title">Uredi sponzor</h2>
			<p class="mgmt-sub">Uredite postojećeg sponzora i spremite promjene.</p>
		</div>
	</div>

	<form class="panel bg-white" onsubmit={(e) => e.preventDefault()}>
		<div class="form-grid">
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

			<div class="col column-nowrap gap-1-5">
				<fieldset class="group">
					<legend class="group-legend">Logotip <span class="req">*</span></legend>
					<ImageUpload label="Logotip" entityType="sponsor" fit="contain" bind:url={logoUrl} />
					<label class="field column-nowrap gap-title mt-logo">
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
	/* Wider gap between the Logotip upload and the Opis logotipa row. */
	.mt-logo {
		margin-top: 1.5rem;
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
		min-height: 20rem;
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
		/* Sticky action bar flush to the panel's bottom edge (off-white bg for visibility),
		   so the buttons stay in view while the form scrolls under it on any screen size. */
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
		/* White panel edge-to-edge (cancel the content area's 1rem side padding) + tighter
		   inner padding; bottom padding clears the fixed action bar. Matches Novi sponzor. */
		.panel {
			margin-left: -1rem;
			margin-right: -1rem;
			border-radius: 0;
			padding-left: 1rem;
			padding-right: 1rem;
			padding-bottom: 5rem;
		}
		/* Pin the action bar to the bottom of the SCREEN (the page scrolls on mobile, so the
		   in-panel sticky wouldn't stay in view). */
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

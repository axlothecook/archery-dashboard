<script lang="ts">
	// Momčad → Uredi streličar: edit form. Renders the shared ArcherForm prefilled with
	// the loaded archer and PATCHes to PATCH /admin/archers/:id. Mirrors Novi streličar.
	import { updateArcher, type CreateArcherInput } from '$lib/archers';
	import ArcherForm from '$lib/components/ArcherForm.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';

	let { data } = $props();
	// The edit form is keyed to this route load; reading `data` once to seed is intended.
	// svelte-ignore state_referenced_locally
	const a = data.archer;
	// An archer can't be their own coach — drop self from the picker options.
	// svelte-ignore state_referenced_locally
	const coachOptions = data.coachOptions.filter((o) => o.id !== a.id);

	async function onSubmit(input: CreateArcherInput) {
		// slug isn't editable server-side; send the rest as the patch.
		const { slug: _slug, ...patch } = input;
		await updateArcher(a.id, patch);
	}
</script>

<svelte:head><title>Uredi streličara · VSK</title></svelte:head>

<section class="ar-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<PersonIcon size={40} />
		<div>
			<h2 class="mgmt-title">Uredi streličara</h2>
			<p class="mgmt-sub">Uredite profil streličara i spremite promjene.</p>
		</div>
	</div>

	<ArcherForm
		initial={a}
		{coachOptions}
		coachLoadError={data.coachLoadError}
		coachErrorDetail={data.coachErrorDetail}
		submitLabel="Spremi promjene"
		{onSubmit}
	/>
</section>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');

	.ar-section {
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
</style>

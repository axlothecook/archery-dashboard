<script lang="ts">
	// Momčad → Novi streličar: create form. Renders the shared ArcherForm (empty) and
	// POSTs to POST /admin/archers.
	import { createArcher, type CreateArcherInput } from '$lib/archers';
	import ArcherForm from '$lib/components/ArcherForm.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';

	let { data } = $props();

	async function onSubmit(input: CreateArcherInput) {
		await createArcher(input);
	}
</script>

<svelte:head><title>Novi streličar · VSK</title></svelte:head>

<section class="ar-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<PersonIcon size={40} />
		<div>
			<h2 class="mgmt-title">Novi streličar</h2>
			<p class="mgmt-sub">Dodajte streličara ili trenera u momčad kluba.</p>
		</div>
	</div>

	<ArcherForm
		coachOptions={data.coachOptions}
		coachLoadError={data.coachLoadError}
		coachErrorDetail={data.coachErrorDetail}
		submitLabel="Spremi"
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

<script lang="ts">
	// Sponzori → Svi sponzori: sponsor list (real backend data). Header + a scrolling
	// table panel, mirroring the Raspored Nacrti page.
	import type { SponsorAdminRow } from '$lib/sponsors';
	import SponsorTable from '$lib/components/SponsorTable.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import HandshakeIcon from '$lib/components/icons/HandshakeIcon.svelte';

	let { data } = $props();
	let sponsors = $state<SponsorAdminRow[]>([]);
	$effect(() => {
		sponsors = data.sponsors;
	});

	function onDeleted(id: string) {
		sponsors = sponsors.filter((s) => s.id !== id);
	}
</script>

<svelte:head><title>Svi sponzori · VSK</title></svelte:head>

<section class="sp-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<HandshakeIcon size={48} />
			<div>
				<h2 class="mgmt-title">Svi sponzori</h2>
				<p class="mgmt-sub">Partneri i sponzori kluba. Uredite ili uklonite sponzore.</p>
			</div>
		</div>
		<a class="btn-add cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/sponzori/novi">
			<AddIcon size={18} />
			Novi sponzor
		</a>
	</div>

	<div class="panel bg-white">
		{#if data.loadError}
			<p class="sp-load-error" role="alert">Učitavanje sponzora nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
		{/if}
		<div class="sp-scroll custom-scrollbar">
			<SponsorTable bind:sponsors emptyText="Još nema sponzora." {onDeleted} />
		</div>
	</div>
</section>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	// Library palette colours (exact matches).
	$navy: map.get(lib.$colors, 'deep-sapphire'); // $navy
	$blue: map.get(lib.$colors, 'blue-dress'); // $blue
	$red: map.get(lib.$colors, 'error-secondary'); // $red
	$border: map.get(lib.$colors, 'seashell'); // $border

	.sp-section {
		/* Fill the shared content frame as a flex column so the table panel bounds to it
		   and scrolls INSIDE (the page itself never grows past the viewport). */
		width: 100%;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
	}
	.mgmt-head {
		margin-bottom: 1.5rem;
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
	.btn-add {
		padding: 0.5rem 0.9rem;
		border: 0;
		border-radius: 8px;
		background: $navy;
		color: #fff;
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
		text-decoration: none;
		white-space: nowrap;
	}
	.btn-add:hover {
		background: #0c2350;
	}
	.panel {
		border-radius: 14px;
		padding: 1.25rem 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		/* Fill the section height + be a flex column so the scroll area bounds to it. */
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	.sp-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.sp-scroll {
		/* Fill the panel + scroll the table INSIDE it (both axes) so a long list never
		   runs off the bottom of the viewport. */
		flex: 1 1 auto;
		min-height: 0;
		overflow: auto;
		/* Scrollbar styling comes from the shared `.custom-scrollbar` class (library). */
	}
</style>

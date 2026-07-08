<script lang="ts">
	// Momčad → Nacrti: draft archers (profiles being built before they go public).
	// Same table as Svi streličari, filtered to status === 'draft'. Header + a
	// scrolling panel, mirroring the Raspored/Vijesti Nacrti pages.
	import { type ArcherAdminRow } from '$lib/archers';
	import ArcherTable from '$lib/components/ArcherTable.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';

	let { data } = $props();
	let archers = $state<ArcherAdminRow[]>([]);
	$effect(() => {
		archers = data.archers.filter((a) => a.status === 'draft');
	});

	function onDeleted(id: string) {
		archers = archers.filter((a) => a.id !== id);
	}
</script>

<svelte:head><title>Nacrti streličara · VSK</title></svelte:head>

<section class="ar-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<PersonIcon size={48} />
			<div>
				<h2 class="mgmt-title">Nacrti</h2>
				<p class="mgmt-sub">Profili streličara u izradi. Objavite ih kad su spremni za javnu stranicu.</p>
			</div>
		</div>
		<a class="btn-add cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/momcad/novi">
			<AddIcon size={18} />
			Novi streličar
		</a>
	</div>

	<div class="panel bg-white">
		{#if data.loadError}
			<p class="ar-load-error" role="alert">Učitavanje nacrta nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
		{/if}
		<div class="ar-scroll custom-scrollbar">
			<ArcherTable bind:archers action="edit" emptyText="Nema nacrta streličara." {onDeleted} />
		</div>
	</div>
</section>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');

	.ar-section {
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
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	.ar-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.ar-scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow: auto;
	}
</style>

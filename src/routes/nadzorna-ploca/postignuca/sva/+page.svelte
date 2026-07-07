<script lang="ts">
	// Postignuća → Sva postignuća: achievement list (real backend data). Header + a
	// scrolling table panel, mirroring the Svi sponzori page.
	import type { AchievementAdminRow } from '$lib/achievements';
	import AchievementTable from '$lib/components/AchievementTable.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import TrophyIcon from '$lib/components/icons/TrophyIcon.svelte';

	let { data } = $props();
	let achievements = $state<AchievementAdminRow[]>([]);
	$effect(() => {
		achievements = data.achievements;
	});

	function onDeleted(id: string) {
		achievements = achievements.filter((a) => a.id !== id);
	}
</script>

<svelte:head><title>Sva postignuća · VSK</title></svelte:head>

<section class="ac-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<TrophyIcon size={40} />
			<div>
				<h2 class="mgmt-title">Sva postignuća</h2>
				<p class="mgmt-sub">Naslovi, rekordi i medalje kluba. Uredite ili uklonite postignuća.</p>
			</div>
		</div>
		<a class="btn-add cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/postignuca/novo">
			<AddIcon size={18} />
			Novo postignuće
		</a>
	</div>

	<div class="panel bg-white">
		{#if data.loadError}
			<p class="ac-load-error" role="alert">Učitavanje postignuća nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
		{/if}
		<div class="ac-scroll custom-scrollbar">
			<AchievementTable bind:achievements emptyText="Još nema postignuća." {onDeleted} />
		</div>
	</div>
</section>

<style>
	.ac-section {
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
		color: #102e66;
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
		background: #102e66;
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
	.ac-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.ac-scroll {
		/* Fill the panel + scroll the table INSIDE it (both axes) so a long list never
		   runs off the bottom of the viewport. */
		flex: 1 1 auto;
		min-height: 0;
		overflow: auto;
		/* Scrollbar styling comes from the shared `.custom-scrollbar` class (library). */
	}
</style>

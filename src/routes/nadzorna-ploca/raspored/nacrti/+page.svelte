<script lang="ts">
	// Raspored → Nacrti: draft events (not yet on the public calendar). Same table as
	// Svi događaji. Mirrors the Vijesti Nacrti page.
	import type { EventAdminRow } from '$lib/events';
	import EventTable from '$lib/components/EventTable.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';

	let { data } = $props();
	// Local mutable copy (EventTable removes rows on delete); re-synced on load change.
	let events = $state<EventAdminRow[]>([]);
	$effect(() => {
		events = data.events;
	});
</script>

<svelte:head><title>Nacrti · VSK</title></svelte:head>

<section class="ev-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<CalendarIcon size={48} />
		<div>
			<h2 class="mgmt-title">Nacrti</h2>
			<p class="mgmt-sub">Događaji u pripremi, još nisu objavljeni. Dovršite ih i objavite kada su spremni.</p>
		</div>
	</div>

	<div class="panel bg-white">
		{#if data.loadError}
			<p class="ev-load-error" role="alert">Učitavanje nacrta nije uspjelo. Osvježite stranicu ili pokušajte kasnije.</p>
		{/if}
		<div class="ev-scroll custom-scrollbar">
			<EventTable bind:events emptyText="Nema nacrta." />
		</div>
	</div>
</section>

<style>
	.ev-section {
		width: 100%;
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
	.panel {
		border-radius: 14px;
		padding: 1.25rem 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}
	.ev-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.ev-scroll {
		overflow-x: auto;
		/* Scrollbar flush to the panel's right edge with a content gap (matches Svi događaji). */
		margin-right: -1.5rem;
		padding-right: 1rem;
		/* Scrollbar styling comes from the shared `.custom-scrollbar` class (library). */
	}
	/* Phone: white panel edge-to-edge (cancel the content area's 1rem side padding). */
	@media (max-width: 820px) {
		.panel {
			margin-left: -1rem;
			margin-right: -1rem;
			border-radius: 0;
		}
	}
</style>

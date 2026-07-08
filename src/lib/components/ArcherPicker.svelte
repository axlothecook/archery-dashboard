<script lang="ts">
	// Multi-select picker for tagging mentioned archers on an article. Options are the
	// PUBLISHED archers from GET /admin/archers/options. Bound `selected` is the list
	// of chosen archer IDs (→ mentionedArcherIds).
	//
	// GRACEFUL FAILURE: if the options failed to load (loadError), the picker renders
	// a warning ("Nešto je pošlo po zlu. Prijavite problem.") in its slot INSTEAD of
	// the control — the surrounding create form still works fully. The failure is
	// reported once to POST /admin/client-errors (best-effort) for developer triage.
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { reportClientError, type ArcherOption } from '$lib/articles';
	import { page } from '$app/state';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';

	let {
		options,
		loadError = false,
		errorDetail = '',
		selected = $bindable()
	}: {
		options: ArcherOption[];
		loadError?: boolean;
		errorDetail?: string;
		selected: string[];
	} = $props();

	let open = $state(false);
	// Flip the dropdown ABOVE the trigger when there isn't enough room below it (e.g. the
	// Strijelci field near the bottom of a form, above a fixed action bar). Measured on open.
	let dropUp = $state(false);
	let controlEl = $state<HTMLDivElement>();
	// Keep in sync with the .arp-list max-height (14rem) so we only flip when the space below
	// is genuinely too small.
	const LIST_MAX_PX = 14 * 16;
	function decideDirection() {
		if (!controlEl) return;
		const rect = controlEl.getBoundingClientRect();
		// The room below is bounded by a fixed action bar if the form has one (it would
		// otherwise cover a downward dropdown), else by the viewport bottom.
		const bar = document.querySelector<HTMLElement>('.form-actions');
		const barTop =
			bar && getComputedStyle(bar).position === 'fixed'
				? bar.getBoundingClientRect().top
				: window.innerHeight;
		const below = barTop - rect.bottom;
		const above = rect.top;
		// Flip up when the space below (down to the fixed bar) can't fit the list and there's
		// at least as much room above. On a phone form the trigger is usually just above the
		// fixed action bar, so this opens the list upward, fully clear of the bar.
		dropUp = below < LIST_MAX_PX && above >= below;
	}
	function toggleOpen() {
		if (!open) decideDirection();
		open = !open;
	}

	// Report the load failure once, on mount, so the dev sees it (fire-and-forget).
	onMount(() => {
		if (loadError) {
			reportClientError(
				'vijesti-novi:archer-options',
				errorDetail || 'Failed to load /admin/archers/options',
				page.url.pathname
			);
		}
	});

	const byId = $derived(new Map(options.map((o) => [o.id, o])));
	const selectedOptions = $derived(selected.map((id) => byId.get(id)).filter(Boolean) as ArcherOption[]);

	function toggle(id: string) {
		selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
	}
	function remove(id: string) {
		selected = selected.filter((x) => x !== id);
	}
	function onWindowClick(e: MouseEvent) {
		if (!open) return;
		if (!(e.target as HTMLElement).closest('.arp')) open = false;
	}
</script>

<svelte:window onclick={onWindowClick} />

{#if loadError}
	<div class="arp-warn" role="alert">
		Nešto je pošlo po zlu. Prijavite problem.
	</div>
{:else if options.length === 0}
	<div class="arp-empty">Nema objavljenih streličara za označavanje.</div>
{:else}
	<div class="arp">
		<!-- Trigger + dropdown share a relative wrapper so the list anchors UNDER the
		     trigger, not under the chips (which grow the component). The dropdown stays
		     put like a normal select regardless of how many chips are chosen. -->
		<div class="arp-control" class:drop-up={dropUp} bind:this={controlEl}>
			<button
				class="arp-trigger w-full display-f align-items-center justify-content-space-between br-xs cursor-pointer"
				type="button"
				aria-haspopup="listbox"
				aria-expanded={open}
				onclick={toggleOpen}
			>
				<span class="arp-trigger-text">
					{selected.length ? `Odabrano: ${selected.length}` : 'Odaberite streličare'}
				</span>
				<span class="arp-chev" class:open aria-hidden="true"><ChevronIcon size={16} direction="down" /></span>
			</button>

			{#if open}
				<ul class="arp-list column-nowrap br-xs custom-scrollbar" role="listbox" aria-multiselectable="true" transition:slide={{ duration: 150, easing: cubicOut }}>
					{#each options as o (o.id)}
						<li>
							<button
								class="arp-opt w-full display-f align-items-center gap-0-6 cursor-pointer"
								class:selected={selected.includes(o.id)}
								type="button"
								role="option"
								aria-selected={selected.includes(o.id)}
								onclick={() => toggle(o.id)}
							>
								<span class="arp-box" class:checked={selected.includes(o.id)} aria-hidden="true"></span>
								{o.name}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		{#if selectedOptions.length}
			<div class="arp-chips display-f custom-scrollbar">
				{#each selectedOptions as o (o.id)}
					<span class="arp-chip display-f align-items-center gap-0-3">
						{o.name}
						<button class="arp-chip-x display-f cursor-pointer" type="button" aria-label={`Ukloni ${o.name}`} onclick={() => remove(o.id)}>
							<CloseIcon size={14} />
						</button>
					</span>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.arp {
		position: relative;
	}
	/* The trigger + dropdown live here; the dropdown is absolute to THIS (the trigger),
	   so it stays anchored under the trigger no matter how many chips are added below. */
	.arp-control {
		position: relative;
	}
	.arp-trigger {
		gap: 0.5rem;
		padding: 0.6rem 0.8rem;
		border: 1px solid #d7dee8;
		background: #fff;
		font-size: 0.95rem;
		font-family: inherit;
		color: #102e66;
	}
	.arp-trigger:hover {
		border-color: #b9c3d3;
	}
	.arp-trigger-text {
		color: #5b6577;
	}
	.arp-chev {
		display: inline-flex;
		color: #5b6577;
		transition: transform 0.18s ease;
	}
	.arp-chev.open {
		transform: rotate(180deg);
	}
	.arp-chips {
		flex-wrap: wrap;
		/* Pack the wrapped rows to the TOP (align-content), otherwise the fixed-height box
		   spreads them apart to fill its height. align-items keeps chips top-aligned within
		   a row. Together they keep rows tight with only the `gap` between them. */
		align-content: flex-start;
		align-items: flex-start;
		gap: 0.4rem;
		/* Clear gap from the trigger above and the checkbox below so the selected-tags
		   box reads as its own grouped area. */
		margin-top: 0.7rem;
		/* Bordered box with inner padding so the chips sit in a clear container. */
		padding: 0.6rem 0.7rem;
		border: 1px solid #d7dee8;
		border-radius: 8px;
		background: #fbfcfe;
		/* Fixed height of exactly 5 chip rows: reserved even with a single row, and a 6th
		   row overflows → the box scrolls internally instead of growing (so the form panel
		   never moves). 5 rows = 5*chip + 4*row-gap + top/bottom padding (chip + gap are
		   rem-sized, so this rem value scales with them under the root-font breakpoints).
		   Scrollbar styling comes from the shared `.custom-scrollbar` class. */
		height: 11.3rem;
		overflow-y: auto;
	}
	.arp-chip {
		padding: 0.25rem 0.35rem 0.25rem 0.6rem;
		border-radius: 999px;
		background: #eef2fb;
		color: #1b3a7a;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.arp-chip-x {
		border: 0;
		background: none;
		padding: 0.1rem;
		color: #1b3a7a;
		align-items: center;
	}
	.arp-chip-x:hover {
		color: #d32752;
	}
	.arp-list {
		position: absolute;
		z-index: 41; /* above the forms' fixed action bar (z-index 40) so it's never covered */
		top: calc(100% + 0.3rem);
		left: 0;
		right: 0;
		max-height: 14rem;
		overflow-y: auto;
		list-style: none;
		margin: 0;
		padding: 0.3rem;
		background: #fff;
		border: 1px solid #d7dee8;
		box-shadow: 0 8px 24px rgba(16, 46, 102, 0.12);
	}
	/* When there isn't room below (last field above a fixed action bar), open UPWARD:
	   anchor the list to the trigger's top edge and stack it above. */
	.arp-control.drop-up .arp-list {
		top: auto;
		bottom: calc(100% + 0.3rem);
		box-shadow: 0 -8px 24px rgba(16, 46, 102, 0.12);
	}
	.arp-opt {
		gap: 0.6rem;
		padding: 0.5rem 0.6rem;
		border: 0;
		border-radius: 8px;
		background: none;
		text-align: left;
		font-size: 0.92rem;
		font-family: inherit;
		color: #102e66;
	}
	.arp-opt:hover {
		background: #f1f4fa;
	}
	.arp-opt.selected {
		color: #1b3a7a;
		font-weight: 600;
	}
	.arp-box {
		width: 16px;
		height: 16px;
		flex: 0 0 auto;
		border: 1.5px solid #b9c3d3;
		border-radius: 4px;
		background: #fff;
	}
	.arp-box.checked {
		border-color: #187ff5;
		background: #187ff5;
	}
	.arp-warn {
		padding: 0.6rem 0.8rem;
		border: 1px solid #f2c4cf;
		border-radius: 8px;
		background: #fdeef1;
		color: #a4133c;
		font-size: 0.9rem;
	}
	.arp-empty {
		padding: 0.6rem 0.8rem;
		border: 1px dashed #d7dee8;
		border-radius: 8px;
		color: #9aa3b2;
		font-size: 0.9rem;
	}
</style>

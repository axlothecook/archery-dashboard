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
		<button
			class="arp-trigger w-full display-f align-items-center justify-content-space-between br-xs cursor-pointer"
			type="button"
			aria-haspopup="listbox"
			aria-expanded={open}
			onclick={() => (open = !open)}
		>
			<span class="arp-trigger-text">
				{selected.length ? `Odabrano: ${selected.length}` : 'Odaberite streličare'}
			</span>
			<span class="arp-chev" class:open aria-hidden="true"><ChevronIcon size={16} direction="down" /></span>
		</button>

		{#if selectedOptions.length}
			<div class="arp-chips display-f align-items-center">
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

		{#if open}
			<ul class="arp-list column-nowrap br-xs" role="listbox" aria-multiselectable="true" transition:slide={{ duration: 150, easing: cubicOut }}>
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
{/if}

<style>
	.arp {
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
		gap: 0.4rem;
		margin-top: 0.5rem;
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
		z-index: 20;
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

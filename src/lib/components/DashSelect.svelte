<script lang="ts">
	// Single-select dropdown styled for the dashboard (navy/blue), mirroring the
	// game-shop SelectOne pattern (a styled option list) but: single-select, NO
	// tick/checkbox on options, dashboard colours, and the list height follows the
	// option count (no fixed height / scroll for these short lists). Reusable.
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';

	let {
		options,
		value = $bindable(),
		ariaLabel = 'Odaberi'
	}: {
		options: { value: string; label: string }[];
		value: string;
		ariaLabel?: string;
	} = $props();

	let open = $state(false);
	let root = $state<HTMLElement | null>(null);

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');

	function toggle() {
		open = !open;
	}
	function choose(v: string) {
		value = v;
		open = false;
	}
	function onWindowClick(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
	function onWindowKey(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

<div class="dash-select position-relative" bind:this={root}>
	<button
		class="dash-select-trigger w-full display-f align-items-center justify-content-space-between cursor-pointer"
		type="button"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label={ariaLabel}
		onclick={toggle}
	>
		<span class="dash-select-value">{selectedLabel}</span>
		<span class="dash-select-chevron display-f" class:up={open}>
			<ChevronIcon direction="down" size={18} />
		</span>
	</button>

	{#if open}
		<ul class="dash-select-list position-absolute w-full column-nowrap custom-scrollbar" role="listbox">
			{#each options as o (o.value)}
				<li>
					<button
						class="dash-select-opt w-full display-f align-items-center cursor-pointer"
						class:selected={o.value === value}
						type="button"
						role="option"
						aria-selected={o.value === value}
						onclick={() => choose(o.value)}
					>
						{o.label}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.dash-select {
		font-family: inherit;
	}
	/* Closed control — matches the modal's text inputs. */
	.dash-select-trigger {
		box-sizing: border-box;
		padding: 0.6rem 0.8rem;
		border: 1px solid #d7dee8;
		border-radius: 7px;
		background: #fff;
		color: #102e66;
		font-size: 0.95rem;
		font-family: inherit;
		text-align: left;
	}
	.dash-select-trigger:hover {
		border-color: #b8c2d1;
	}
	.dash-select-value {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dash-select-chevron {
		color: #5b6577;
		transition: transform 0.15s ease;
		flex: 0 0 auto;
	}
	.dash-select-chevron.up {
		transform: rotate(180deg);
	}

	/* Open list — capped height (a long list like the year/month filters scrolls inside
	   rather than running down the page); the inner padding is unchanged. Dashboard
	   colours; no tick on options. */
	.dash-select-list {
		top: calc(100% + 0.35rem);
		left: 0;
		z-index: 20;
		margin: 0;
		padding: 0.35rem;
		list-style: none;
		gap: 0.15rem;
		background: #fff;
		border: 1px solid #d7dee8;
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(16, 46, 102, 0.14);
		max-height: 17rem;
		overflow-y: auto;
	}
	.dash-select-opt {
		box-sizing: border-box;
		padding: 0.55rem 0.7rem;
		border: 0;
		border-radius: 6px;
		background: none;
		color: #102e66;
		font-size: 0.95rem;
		font-family: inherit;
		text-align: left;
		transition: background-color 0.12s ease;
	}
	.dash-select-opt:hover {
		background: #eef2f7;
	}
	.dash-select-opt.selected {
		background: #dbe6f6;
		font-weight: 600;
	}
</style>

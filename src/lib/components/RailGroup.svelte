<script lang="ts">
	// A side-rail nav item that OWNS a submenu (Cloudflare-style). Clicking the
	// parent toggles its list of sub-options in place — it does NOT navigate to a
	// page of its own; navigation happens via the sub-options. Plain single-link
	// items keep using RailLink; this is only for sections that have sub-views.
	//
	// Open state is CONTROLLED by the parent (+layout.svelte) so the rail behaves like
	// an accordion: only ONE group is open at a time. Opening one closes the rest, and
	// picking a sub-option (which navigates → makes that group the active one) leaves
	// only the active section open. In compact (icons-only) rail mode there's no room
	// for a submenu, so the chevron/submenu are hidden.
	import type { Component } from 'svelte';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/state';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';

	type Child = { label: string; href: string };

	let {
		label,
		icon: Icon,
		items,
		compact = false,
		open = false,
		onToggle
	}: {
		label: string;
		icon: Component<{ size?: number }>;
		items: Child[];
		compact?: boolean;
		open?: boolean;
		onToggle?: () => void;
	} = $props();

	// A child is active on exact match or nested under it.
	const childActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	// The group is "active" (highlight the parent) when any child route is active.
	const groupActive = $derived(items.some((c) => childActive(c.href)));

	function toggle() {
		onToggle?.();
	}
</script>

<div class="rail-group column-nowrap">
	<button
		class="rail-link rail-group-btn display-f align-items-center br-sm text-white w-full cursor-pointer"
		class:active={groupActive}
		class:compact
		type="button"
		aria-expanded={open}
		title={compact ? label : undefined}
		onclick={toggle}
	>
		<span class="rail-icon">
			<Icon size={26} />
		</span>
		<span class="rail-label">{label}</span>
		{#if !compact}
			<span class="rail-chevron" class:open aria-hidden="true">
				<ChevronIcon size={16} direction="right" />
			</span>
		{/if}
	</button>

	{#if open && !compact}
		<ul class="rail-sub column-nowrap" transition:slide={{ duration: 180, easing: cubicOut }}>
			{#each items as child (child.href)}
				<li>
					<a
						class="rail-sublink text-white display-f align-items-center"
						class:active={childActive(child.href)}
						href={child.href}
					>
						{child.label}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	/* Parent button styled identically to RailLink (kept in sync with RailLink.svelte)
	   so a group and a plain link read the same in the rail. */
	.rail-link {
		gap: 0.95rem;
		padding: 0.8rem 0.9rem;
		border: 0;
		background: none;
		text-align: left;
		text-decoration: none;
		font-size: 1.15rem;
		font-weight: 500;
		font-family: inherit;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}
	.rail-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		flex: 0 0 auto;
		opacity: 0.92;
	}
	.rail-icon :global(svg) {
		display: block;
	}
	.rail-link:hover {
		background: rgba(255, 255, 255, 0.16);
	}
	.rail-link.active {
		background: #fff;
		color: #187ff5; /* blue-dress — reads as "active" against the blue rail */
		font-weight: 600;
	}

	/* Chevron sits at the far end, rotates down when the submenu is open. */
	.rail-chevron {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		transition: transform 0.18s ease;
	}
	.rail-chevron.open {
		transform: rotate(90deg);
	}

	/* Sub-options (Cloudflare style): a vertical GUIDE LINE runs down the left of the
	   list, and each option's hover/active highlight is INSET so it never covers the
	   line. The line is the ul's left border; ul padding creates the gap between the
	   line and the highlight box; the sublink's own padding positions the text.
	   margin-left places the line ~under the parent icon's centre (0.9rem link pad +
	   ~half the 28px icon box). */
	.rail-sub {
		list-style: none;
		margin: 0.15rem 0 0.35rem 1.55rem;
		padding: 0 0 0 0.55rem;
		border-left: 1.5px solid rgba(255, 255, 255, 0.28);
		gap: 0.1rem;
	}
	.rail-sublink {
		gap: 0;
		/* Left padding here is INSIDE the highlight; the line + ul padding sit to its
		   left, so the highlight starts after the line. */
		padding: 0.55rem 0.9rem;
		border-radius: 8px;
		text-decoration: none;
		font-size: 1.02rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.86);
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}
	.rail-sublink:hover {
		background: rgba(255, 255, 255, 0.16);
		color: #fff;
	}
	.rail-sublink.active {
		background: #fff;
		color: #187ff5;
		font-weight: 600;
	}

	/* Compact (icons-only) rail: hide label + chevron; submenu never renders. */
	.rail-link.compact {
		justify-content: center;
		padding: 0.6rem;
		gap: 0;
	}
	.rail-link.compact .rail-label {
		display: none;
	}
	@media (max-width: 720px) {
		.rail-link {
			padding: 0.6rem 0.7rem;
		}
		.rail-label,
		.rail-chevron {
			display: none;
		}
	}
</style>

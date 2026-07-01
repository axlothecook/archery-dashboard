<script lang="ts">
	// One link in the blue side rail: an icon + label, highlighted when active.
	// Reused for every dashboard section, so it lives here as a single component.
	// Owns its own responsive behaviour: at <=720px the rail collapses to a row of
	// icon-only chips (labels hidden, tighter padding) — see the @media below.
	// `compact` forces that same icon-only mode on demand (the desktop collapse
	// toggle, item 14).
	import type { Component } from 'svelte';

	let {
		href,
		label,
		icon: Icon,
		active = false,
		compact = false
	}: {
		href: string;
		label: string;
		icon: Component<{ size?: number }>;
		active?: boolean;
		compact?: boolean;
	} = $props();
</script>

<a
	{href}
	class="rail-link display-f align-items-center br-sm text-white"
	class:active
	class:compact
	title={compact ? label : undefined}
>
	<span class="rail-icon">
		<Icon size={26} />
	</span>
	<span class="rail-label">{label}</span>
</a>

<style>
	/* display-f align-items-center br-sm (10px) text-white via utilities. */
	.rail-link {
		gap: 0.95rem;
		padding: 0.8rem 0.9rem;
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
		color: #187ff5; /* blue-dress — chip reads as "active" against the blue rail */
		font-weight: 600;
	}

	/* Icon-only mode: on narrow screens (top-strip) OR when `compact` is set (the
	   desktop collapse toggle). Labels hidden, icon centred, tighter padding. */
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
		.rail-label {
			display: none;
		}
	}
</style>

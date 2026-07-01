<script lang="ts">
	// One link in the blue side rail: an icon + label, highlighted when active.
	// Reused for every dashboard section, so it lives here as a single component.
	// Owns its own responsive behaviour: at <=720px the rail collapses to a row of
	// icon-only chips (labels hidden, tighter padding) — see the @media below.
	import type { Component } from 'svelte';

	let {
		href,
		label,
		icon: Icon,
		active = false
	}: { href: string; label: string; icon: Component<{ size?: number }>; active?: boolean } =
		$props();
</script>

<a {href} class="rail-link" class:active>
	<span class="rail-icon">
		<Icon size={26} />
	</span>
	<span class="rail-label">{label}</span>
</a>

<style>
	.rail-link {
		display: flex;
		align-items: center;
		gap: 0.95rem;
		padding: 0.8rem 0.9rem;
		border-radius: 10px;
		color: #fff;
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

	/* Collapsed rail (icon-only row) on narrow screens. */
	@media (max-width: 720px) {
		.rail-link {
			padding: 0.6rem 0.7rem;
		}
		.rail-label {
			display: none;
		}
	}
</style>

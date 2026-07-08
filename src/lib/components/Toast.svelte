<script lang="ts">
	// Toast stack: renders transient notices at the TOP-LEFT of the content area
	// (below the topbar). Subscribes to the shared `toasts` store; click a toast (or
	// its ×) to dismiss early, else it auto-removes after TOAST_DURATION. Styling
	// reuses the sass-library `default-notification-popup` mixin (repositioned to the
	// top-left) with success/error colour variants. Rendered ONCE in the admin layout.
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { toasts, dismissToast, TOAST_DURATION } from '$lib/toasts';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
	import AlertIcon from '$lib/components/icons/AlertIcon.svelte';
</script>

<div class="toast-stack position-absolute" aria-live="polite" aria-atomic="false">
	{#each $toasts as t, i (t.id)}
		<!-- Each toast is position:absolute (library default); we stack them by
		     offsetting each slot from the top so they never overlap. -->
		<div
			class="default-notification-popup toast toast--{t.type}"
			style="top: calc({i} * (var(--toast-h) + var(--toast-gap)));"
			role="status"
			transition:fly={{ x: 16, duration: 180, easing: cubicOut }}
		>
			<!-- Leading icon (direct child) inherits the toast's text colour. -->
			{#if t.type === 'success'}
				<CheckIcon size={20} />
			{:else}
				<AlertIcon size={20} />
			{/if}
			<h2>{t.message}</h2>
			<button class="toast-close" type="button" aria-label="Zatvori" onclick={() => dismissToast(t.id)}>
				<CloseIcon size={22} />
			</button>
			<!-- Countdown bar: shrinks to 0 over the toast's lifetime (like Create_Resume). -->
			<span class="toast-bar" style="animation-duration: {TOAST_DURATION}ms;"></span>
		</div>
	{/each}
</div>

<style lang="scss">
	/* The `.default-notification-popup` class (wrapper styling + optional-icon sizing
	   + fade keyframe) comes from the sass-library, applied globally via
	   src/styles/index.scss — we just add it in the markup and override here to pin
	   the toast TOP-RIGHT (below the topbar) and let the store + Svelte transition
	   drive enter/exit. */
	/* Fixed toast row height + gap drive the per-slot `top` offsets (single-line
	   messages, so a fixed height is safe — same idea as the Hitno rows). */
	:root,
	.toast-stack {
		--toast-h: 3.25rem;
		--toast-gap: 0.6rem;
	}
	/* position-absolute (utility) anchors the stack; it has zero box of its own,
	   the toasts inside are absolutely placed. Offsets/z-index/width stay scoped. */
	.toast-stack {
		top: 1rem; /* gap below the topbar */
		right: 1.5rem; /* gap from the right edge; > the fly distance so the exit
		                  transition never pushes past the edge (no scrollbar flash) */
		width: 22rem; /* fixed anchor width so each absolute toast right-aligns to it */
		z-index: 60;
		pointer-events: none; /* let clicks through the empty stack area */
	}

	/* Each toast is position:absolute (the library `.default-notification-popup`
	   default); pinned to the right of the stack, stacked downward by the inline
	   `top` offset. Radius + overflow are set HERE (not via utility classes) because
	   the library component class would otherwise win the cascade over a utility. */
	.toast {
		top: 0;
		right: 0;
		bottom: auto;
		left: auto;
		width: 100%;
		min-height: var(--toast-h);
		box-sizing: border-box;
		padding: 0.75rem 2.75rem 0.9rem 1rem; /* extra bottom pad clears the countdown bar */
		border-radius: 10px;
		overflow: hidden; /* clip the countdown bar to the rounded corners */
		animation: none; /* store + Svelte transition handle enter/exit */
		pointer-events: auto; /* the toast itself is interactive */
		box-shadow: 0 8px 30px rgba(16, 46, 102, 0.18);
	}
	.toast h2 {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.35;
	}

	/* Semantic colours (the library palette lacks a true success/error pair for a
	   light UI, so define them here to match the dashboard's greens/reds). */
	.toast--success {
		background-color: #d4f3df;
		color: #10683a;
	}
	.toast--error {
		background-color: #fde2e4;
		color: #a4133c;
	}

	.toast-close {
		position: absolute;
		top: 0.35rem;
		right: 0.35rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: none;
		color: inherit;
		opacity: 0.7;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			opacity 0.15s ease;

		&:hover {
			opacity: 1;
			background: rgba(0, 0, 0, 0.08);
		}
	}

	/* Countdown bar pinned to the bottom edge; shrinks 100% → 0 over the toast's
	   lifetime. Tinted with the current text colour (green/red) at low opacity. */
	.toast-bar {
		position: absolute;
		left: 0;
		bottom: 0;
		height: 3px;
		width: 100%;
		background: currentColor;
		opacity: 0.55;
		transform-origin: left center;
		animation-name: toast-countdown;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}
	@keyframes toast-countdown {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.toast-bar {
			display: none;
		}
	}

	/* Phone: the fixed 22rem stack + right offset can overflow / clip on a narrow screen.
	   Inset the stack from BOTH edges with an equal gap so the toast fits with a margin on
	   the left and right (and a comfortable top gap below the top bar). */
	@media (max-width: 900px) {
		.toast-stack {
			top: 0.75rem;
			left: 0.75rem;
			right: 0.75rem;
			width: auto;
		}
		/* Toast spans the inset stack; still right-aligned within it (which is now full-ish
		   width), so it reads as a top-of-screen banner with side margins. */
		.toast {
			width: 100%;
		}
	}
</style>

<script lang="ts">
	// Toast stack: renders transient notices at the TOP-LEFT of the content area
	// (below the topbar). Subscribes to the shared `toasts` store; click a toast (or
	// its ×) to dismiss early, else it auto-removes after TOAST_DURATION. Styling
	// reuses the sass-library `default-notification-popup` mixin (repositioned to the
	// top-left) with success/error colour variants. Rendered ONCE in the admin layout.
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { toasts, dismissToast } from '$lib/toasts';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
	import AlertIcon from '$lib/components/icons/AlertIcon.svelte';
</script>

<div class="toast-stack" aria-live="polite" aria-atomic="false">
	{#each $toasts as t (t.id)}
		<div
			class="default-notification-popup toast toast--{t.type}"
			role="status"
			transition:fly={{ x: -20, duration: 180, easing: cubicOut }}
		>
			<!-- Leading icon (direct child) inherits the toast's text colour. -->
			{#if t.type === 'success'}
				<CheckIcon size={20} />
			{:else}
				<AlertIcon size={20} />
			{/if}
			<h2>{t.message}</h2>
			<button class="toast-close" type="button" aria-label="Zatvori" onclick={() => dismissToast(t.id)}>
				<CloseIcon size={18} />
			</button>
		</div>
	{/each}
</div>

<style lang="scss">
	/* The `.default-notification-popup` class (wrapper styling + optional-icon sizing
	   + fade keyframe) comes from the sass-library, applied globally via
	   src/styles/index.scss — we just add it in the markup and override here to pin
	   the toast TOP-LEFT and let the store + Svelte transition drive enter/exit. */
	.toast-stack {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		pointer-events: none; /* let clicks through the empty stack area */
	}

	.toast {
		/* Override the library default (bottom-right + auto-fade) for this use. */
		position: relative;
		bottom: auto;
		right: auto;
		padding: 0.75rem 2.5rem 0.75rem 1rem;
		border-radius: 10px;
		animation: none; /* store + Svelte transition handle enter/exit */
		pointer-events: auto; /* the toast itself is interactive */
		min-width: 15rem;
		max-width: 22rem;
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
		width: 1.6rem;
		height: 1.6rem;
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
</style>

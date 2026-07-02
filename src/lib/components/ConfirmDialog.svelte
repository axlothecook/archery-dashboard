<script lang="ts">
	// Reusable confirm dialog — a styled, animated in-app replacement for the native
	// confirm(). Same scale show/hide + backdrop as the task/member modals, site
	// colours. Usage: keep a ref, then `if (await dlg.ask('Message?')) { … }`.
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let {
		confirmLabel = 'Da',
		cancelLabel = 'Odustani'
	}: { confirmLabel?: string; cancelLabel?: string } = $props();

	let open = $state(false);
	let message = $state('');
	let btnLabel = $state('Da'); // confirm-button label for the current ask() (set on open)
	let resolver: ((ok: boolean) => void) | null = null;
	const anim = { duration: 150, start: 0.97, opacity: 0, easing: cubicOut };

	// Show the dialog and resolve true (confirm) / false (cancel). Pass a per-call
	// confirm-button label (e.g. "Obriši") — falls back to the confirmLabel prop.
	export function ask(msg: string, confirm = confirmLabel): Promise<boolean> {
		message = msg;
		btnLabel = confirm;
		open = true;
		return new Promise<boolean>((resolve) => (resolver = resolve));
	}
	function settle(ok: boolean) {
		open = false;
		resolver?.(ok);
		resolver = null;
	}
	function onKey(e: KeyboardEvent) {
		if (open && e.key === 'Escape') settle(false);
	}
</script>

<svelte:window onkeydown={onKey} />

{#if open}
	<div class="cd-backdrop position-fixed" role="presentation" onclick={() => settle(false)}></div>
	<div class="cd position-fixed br-lg" role="alertdialog" aria-modal="true" transition:scale={anim}>
		<p class="cd-msg">{message}</p>
		<div class="cd-actions display-f justify-content-flex-end gap-0-5">
			<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" onclick={() => settle(false)}>
				{cancelLabel}
			</button>
			<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" onclick={() => settle(true)}>
				{btnLabel}
			</button>
		</div>
	</div>
{/if}

<style>
	.cd-backdrop {
		inset: 0;
		background: rgba(16, 46, 102, 0.28);
		z-index: 90;
	}
	.cd {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 26rem;
		max-width: calc(100vw - 2rem);
		padding: 1.5rem;
		background: #fff;
		box-shadow: 0 12px 40px rgba(16, 46, 102, 0.25);
		z-index: 91;
	}
	.cd-msg {
		margin: 0 0 1.25rem;
		font-size: 1rem;
		line-height: 1.4;
		color: #102e66;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		font-size: 0.9rem;
		font-family: inherit;
		border: 1px solid transparent;
	}
	.btn--primary {
		background: #102e66;
		color: #fff;
	}
	.btn--primary:hover {
		background: #0c2350;
	}
	.btn--ghost {
		background: #fff;
		color: #102e66; /* same navy as the confirm (Da/Obriši) button's bg */
		border-color: #d7dee8;
	}
	.btn--ghost:hover {
		background: #eef1f3;
	}
</style>

<script lang="ts">
	// Developer contact modal: opened from the Profil page's "Prijavi problem" /
	// "Predloži promjenu" buttons. The admin fills a short message and submits. For now
	// submit is a STUB (success toast) — on adoption this POSTs to a /admin/feedback
	// endpoint that surfaces on a developer dashboard. The modal can ONLY be closed via
	// the "Odustani" button (bottom-right); clicking the backdrop does nothing (per spec).
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { showToast } from '$lib/toasts';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import ErrorPopup from '$lib/components/ErrorPopup.svelte';

	let {
		open = $bindable(false),
		title,
		/** 'issue' | 'idea' — only changes copy + the toast wording. */
		kind
	}: {
		open?: boolean;
		title: string;
		kind: 'issue' | 'idea';
	} = $props();

	let recipient = $state('');
	let subject = $state('');
	let message = $state('');
	let submitting = $state(false);
	let errors = $state<string[]>([]);

	// Which developer to send to. Only one for now; the empty first option forces a pick.
	const recipientOptions = [
		{ value: '', label: 'Odaberite programera' },
		{ value: 'axlothecook', label: 'axlothecook' }
	];

	const placeholder = $derived(
		kind === 'issue'
			? 'Opišite problem: što ste radili i što se dogodilo'
			: 'Opišite svoju ideju: što biste htjeli i kako bi to pomoglo'
	);

	function close() {
		open = false;
		recipient = '';
		subject = '';
		message = '';
		errors = [];
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;
		// Collect validation errors and show them in the shared top-centre ErrorPopup
		// (same component the other forms use), not a toast.
		const errs: string[] = [];
		if (!recipient) errs.push('Odaberite programera kojem šaljete.');
		if (!subject.trim()) errs.push('Naslov je obavezan.');
		if (!message.trim()) errs.push('Poruka je obavezna.');
		if (errs.length > 0) {
			errors = errs;
			return;
		}
		errors = [];
		submitting = true;
		// TODO(adoption): POST /admin/feedback { kind, subject, message } → developer dashboard.
		await new Promise((r) => setTimeout(r, 200)); // simulate a send
		submitting = false;
		showToast('success', kind === 'issue' ? 'Hvala! Problem je prijavljen.' : 'Hvala! Prijedlog je poslan.');
		close();
	}
</script>

{#if open}
	<!-- Backdrop: clicking it does NOTHING (no onclick) — the modal only closes via Odustani. -->
	<div class="cm-backdrop position-fixed" role="presentation"></div>
	<div class="cm-modal position-fixed br-lg bg-white" role="dialog" aria-modal="true" aria-label={title} transition:scale={{ duration: 150, start: 0.97, easing: cubicOut }}>
		<header class="cm-head display-f align-items-center justify-content-space-between">
			<h3 class="cm-title">{title}</h3>
			<button class="cm-x cursor-pointer br-full display-f align-items-center justify-content-center" type="button" aria-label="Zatvori" onclick={close}>
				<CloseIcon size={22} />
			</button>
		</header>

		<form class="cm-form column-nowrap gap-1" onsubmit={submit}>
			<div class="cm-field column-nowrap gap-0-3">
				<span class="cm-label fw-600">Pošalji programeru <span class="cm-req">*</span></span>
				<DashSelect options={recipientOptions} bind:value={recipient} ariaLabel="Pošalji programeru" />
			</div>
			<label class="cm-field column-nowrap gap-0-3">
				<span class="cm-label fw-600">Naslov <span class="cm-req">*</span></span>
				<input class="cm-input w-full br-xs" type="text" bind:value={subject} placeholder="Kratki naslov" />
			</label>
			<label class="cm-field column-nowrap gap-0-3">
				<span class="cm-label fw-600">Poruka <span class="cm-req">*</span></span>
				<textarea class="cm-input cm-textarea w-full br-xs custom-scrollbar" bind:value={message} {placeholder}></textarea>
			</label>

			<div class="cm-actions display-f justify-content-flex-end gap-0-5">
				<button class="cm-btn cm-btn--ghost cursor-pointer br-xs fw-600" type="button" onclick={close}>Odustani</button>
				<button class="cm-btn cm-btn--primary cursor-pointer br-xs fw-600" type="submit" disabled={submitting}>
					{submitting ? 'Slanje…' : 'Pošalji'}
				</button>
			</div>
		</form>
	</div>

	<!-- Same top-centre, non-auto-dismiss error stack the other forms use. -->
	<ErrorPopup bind:messages={errors} />
{/if}

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$blue: map.get(lib.$colors, 'blue-dress');

	.cm-backdrop {
		inset: 0;
		background: rgba(16, 46, 102, 0.28);
		z-index: 80;
	}
	.cm-modal {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 32rem;
		max-width: calc(100vw - 2rem);
		padding: 1.5rem;
		box-shadow: 0 12px 40px rgba(16, 46, 102, 0.25);
		z-index: 81;
	}
	.cm-head {
		margin-bottom: 1.1rem;
	}
	.cm-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: $navy;
	}
	.cm-x {
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		background: none;
		color: #5b6577;
	}
	.cm-x:hover {
		background: #eef1f3;
	}
	.cm-label {
		font-size: 0.9rem;
		color: $navy;
	}
	.cm-req {
		color: #d32752;
	}
	.cm-input {
		box-sizing: border-box;
		padding: 0.6rem 0.8rem;
		border: 1px solid #d7dee8;
		font-size: 0.95rem;
		font-family: inherit;
		color: $navy;
		background: #fff;
	}
	.cm-input:focus {
		outline: none;
		border-color: $blue;
	}
	.cm-textarea {
		resize: vertical;
		min-height: 9rem;
		/* Cap the drag-resize + scroll long text inside so it stays within the modal. */
		max-height: 18rem;
		overflow-y: auto;
		line-height: 1.4;
		/* Zero the library's default textarea top margin so the Poruka title→textarea gap
		   matches the Naslov title→input gap. */
		margin-top: 0;
	}
	.cm-actions {
		margin-top: 0.5rem;
	}
	.cm-btn {
		padding: 0.6rem 1.3rem;
		font-size: 0.9rem;
		font-family: inherit;
		border: 1px solid transparent;
	}
	.cm-btn--primary {
		background: $navy;
		color: #fff;
	}
	.cm-btn--primary:hover:not(:disabled) {
		background: #0c2350;
	}
	.cm-btn--primary:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.cm-btn--ghost {
		background: #fff;
		color: $navy;
		border-color: #d7dee8;
	}
	.cm-btn--ghost:hover {
		background: #eef1f3;
	}
</style>

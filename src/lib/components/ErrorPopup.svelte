<script lang="ts">
	// Reusable validation-error popup: a fixed stack pinned top-centre (with a gap from
	// the top edge) that does NOT auto-dismiss. Each message is its own card with an X
	// button on the right; the user closes them one at a time. Used for input/form
	// validation warnings so they don't stack inline and push the page content down.
	//
	// Built on the sass-library `persistent-error-popup-wrapper` mixin (which styles the
	// <li> cards + the `.close` X button). `messages` is bindable so the parent can reset
	// it (clear all before re-validating); the X removes a single message.
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';

	let { messages = $bindable<string[]>([]) }: { messages?: string[] } = $props();

	function dismiss(i: number) {
		messages = messages.filter((_, idx) => idx !== i);
	}
</script>

{#if messages.length > 0}
	<ul class="persistent-error-popup-wrapper" aria-live="assertive">
		{#each messages as msg, i (msg + i)}
			<li transition:fly={{ y: -12, duration: 180, easing: cubicOut }}>
				<span class="msg">{msg}</span>
				<button class="close" type="button" aria-label="Zatvori upozorenje" onclick={() => dismiss(i)}>
					<CloseIcon size={18} />
				</button>
			</li>
		{/each}
	</ul>
{/if}

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/components/errorPopup' as popup;

	// Persistent top-centre dismissible stack, tinted for the light dashboard (its own
	// red rather than the gaming-shop orange-on-darkred default). The mixin styles the
	// <li> cards + the `.close` button.
	.persistent-error-popup-wrapper {
		@include popup.persistent-error-popup-wrapper(
			$top: 1.5rem,
			$text-color: #fff,
			$bg-color: #d32752
		);
	}
	.msg {
		font-size: 0.95rem;
	}
</style>

<script lang="ts">
	// "Dolazna pošta" (incoming mail) panel — sits beside the schedule, half width.
	// Shows the newest real Upiti inquiries (passed in from the Početno server load). Each
	// row is the reusable <MailItem>. Empty state when there are no inquiries yet.
	import MailItem from '$lib/components/MailItem.svelte';
	import type { Mail } from '$lib/mail';

	let { mails }: { mails: Mail[] } = $props();
</script>

<section class="panel bg-white mail">
	<div class="mail-list column-nowrap gap-1 custom-scrollbar">
		{#each mails as m (m.id)}
			<MailItem mail={m} />
		{:else}
			<p class="mail-empty">Nema novih upita.</p>
		{/each}
	</div>
</section>

<style>
	/* Panel surface (the +page `.panel` rule is scoped to that file). Sizes to its
	   content — with only the few messages there are, it does NOT scroll (no fixed
	   height / no scrollbar). When there are more than fit, the "(N)" count appears next
	   to the "Dolazna pošta" title instead (see +page.svelte), mirroring the
	   notifications cue. */
	.mail {
		padding: 1rem;
		border-radius: 14px;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		/* Flex column so the inner list fills the panel. The panel's height is set by its parent
		   (stretched to Raspored on the desktop lower row); the list fills that height so the
		   inner padding is EVEN on all sides instead of leaving empty space below a capped list. */
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
	.mail-empty {
		margin: 0;
		padding: 1.5rem 0.5rem;
		text-align: center;
		color: #9aa3b2;
		font-size: 0.95rem;
	}
	/* Fill the panel (flex parent) and scroll the overflow inside (styled scrollbar via
	   .custom-scrollbar). flex-basis:0 + min-height:0 mean the list takes the panel's height
	   WITHOUT its content inflating the panel, so it can't grow the page. padding-right keeps
	   the scrollbar off the text. On the phone stack the panel isn't stretched → a max-height
	   caps it at ~3 rows there. */
	.mail-list {
		flex: 1 1 0;
		min-height: 0;
		overflow-y: auto;
		padding-right: 0.5rem;
	}
	/* Phone: the panel is in the stacked layout (no stretched parent to give it a height), so the
	   desktop flex-fill would collapse the list to 0. Reset the panel to a normal block and let
	   the list size to its content, CAPPED at ~3 rows (max-height) and scrolling the rest. */
	@media (max-width: 900px) {
		.mail {
			display: block;
		}
		.mail-list {
			flex: none;
			max-height: 15.5rem;
		}
	}
</style>

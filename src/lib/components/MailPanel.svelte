<script lang="ts">
	// "Dolazna pošta" (incoming mail) panel — sits beside the schedule, half width.
	// Shows the placeholder messages (no scroll; just the few there are). Each row is
	// the reusable <MailItem> component.
	import MailItem from '$lib/components/MailItem.svelte';
	import { MAILS } from '$lib/mail';
</script>

<section class="panel bg-white mail">
	<div class="mail-scroll column-nowrap gap-1">
		{#each MAILS as m (m.id)}
			<MailItem mail={m} />
		{/each}
	</div>
</section>

<style>
	/* Panel surface (the +page `.panel` rule is scoped to that file). Fixed 20rem tall
	   (level with the schedule panel). Right padding = the gap between the scrollbar and
	   the white panel edge (test: 1rem); the inner .mail-scroll holds the messages + does
	   the scrolling, so the scrollbar sits 1rem in from the right edge (like the Vijesti
	   table + Zadaci). */
	.mail {
		/* Even 1rem frame: content inset 1rem from left/top/bottom, scrollbar (inside
		   .mail-scroll) 1rem from the right edge. */
		padding: 1rem;
		border-radius: 14px;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		height: 20rem;
	}
	/* Inner scroller: fills the panel height minus its top+bottom padding (20 − 2),
	   scrolls with a Hitno-style navy scrollbar when there are more messages than fit. */
	.mail-scroll {
		height: 18rem;
		overflow-y: auto;
		/* Gap between the mail cards and the scrollbar (inside the scroll area) so the
		   scrollbar doesn't touch the content's right edge. */
		padding-right: 0.75rem;
	}
	.mail-scroll::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	.mail-scroll::-webkit-scrollbar-track {
		background: transparent;
	}
	.mail-scroll::-webkit-scrollbar-thumb {
		background: #102e66;
		border-radius: 4px;
	}
	.mail-scroll::-webkit-scrollbar-corner {
		background: transparent;
	}
	.mail-scroll::-webkit-scrollbar-button {
		display: none;
		width: 0;
		height: 0;
	}
</style>

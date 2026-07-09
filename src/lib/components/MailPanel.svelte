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
	}
	.mail-empty {
		margin: 0;
		padding: 1.5rem 0.5rem;
		text-align: center;
		color: #9aa3b2;
		font-size: 0.95rem;
	}
	/* Phone: cap the list to ~3 messages tall and scroll the rest inside (styled scrollbar via
	   .custom-scrollbar), so a full inbox doesn't make the Pošta panel run long on a small
	   screen. ~3 rows = 3 items + 2 gaps; padding-right keeps the scrollbar off the text. */
	@media (max-width: 900px) {
		.mail-list {
			max-height: 15.5rem;
			overflow-y: auto;
			padding-right: 0.5rem;
		}
	}
</style>

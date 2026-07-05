<script lang="ts">
	// "Dolazna pošta" (incoming mail) panel — sits beside the schedule, half width.
	// Shows the placeholder messages (no scroll; just the few there are). Each row is
	// the reusable <MailItem> component.
	import MailItem from '$lib/components/MailItem.svelte';
	import { MAILS } from '$lib/mail';
</script>

<section class="panel bg-white mail">
	<div class="mail-list column-nowrap gap-1">
		{#each MAILS as m (m.id)}
			<MailItem mail={m} />
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
</style>

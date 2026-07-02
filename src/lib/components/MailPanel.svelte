<script lang="ts">
	// "Dolazna pošta" (incoming mail) panel — sits beside the schedule, half width.
	// Shows the placeholder messages (no scroll; just the few there are). Each row is
	// the reusable <MailItem> component.
	import MailItem from '$lib/components/MailItem.svelte';
	import { MAILS } from '$lib/mail';
</script>

<section class="panel bg-white mail column-nowrap gap-0-5">
	{#each MAILS as m (m.id)}
		<MailItem mail={m} />
	{/each}
</section>

<style>
	/* Panel surface (the +page `.panel` rule is scoped to that file). Fixed 20rem tall
	   (level with the schedule panel); scrolls with a Hitno-style navy scrollbar when
	   there are more messages than fit. */
	.mail {
		padding: 1.4rem 1.5rem;
		border-radius: 14px;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		height: 20rem;
		overflow-y: auto;
	}
	.mail::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	.mail::-webkit-scrollbar-track {
		background: transparent;
	}
	.mail::-webkit-scrollbar-thumb {
		background: #102e66;
		border-radius: 4px;
	}
	.mail::-webkit-scrollbar-corner {
		background: transparent;
	}
	.mail::-webkit-scrollbar-button {
		display: none;
		width: 0;
		height: 0;
	}
</style>

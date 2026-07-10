<script lang="ts">
	// One row in the "Dolazna pošta" panel: sender + inquiry type + time received
	// (no body). Small unread dot. Repeats per message, so it's its own component.
	import MailAltIcon from '$lib/components/icons/MailAltIcon.svelte';
	import type { Mail } from '$lib/mail';

	let { mail }: { mail: Mail } = $props();
	// Capitalize the type for display (stored value stays lowercase).
	const typeLabel = $derived(mail.type.charAt(0).toUpperCase() + mail.type.slice(1));
</script>

<!-- A real LINK to the Upiti inbox (not a dead div with a pointer cursor) — the row
     previews an inquiry that lives there. Deep-linking to the exact inquiry/tab is a
     separate deferred item; for now the row takes the admin to the inbox page. -->
<a class="mail-item display-f align-items-center gap-0-8" class:unread={mail.unread} href="/nadzorna-ploca/upiti">
	<span class="mail-ico display-f align-items-center justify-content-center">
		<MailAltIcon size={26} />
	</span>
	<span class="mail-body column-nowrap">
		<span class="mail-top display-f align-items-center justify-content-space-between gap-0-5">
			<span class="mail-sender fw-600">{mail.sender}</span>
			<span class="mail-status fw-600" class:is-unread={mail.unread}>
				{mail.unread ? 'Nepročitano' : 'Pročitano'}
			</span>
		</span>
		<span class="mail-type">{typeLabel}</span>
		<span class="mail-time">{mail.time}</span>
	</span>
</a>

<style>
	.mail-item {
		padding: 0.6rem 0.85rem;
		border-radius: 10px;
		background: #f6f8fa;
		/* It's a link now: pointer + no underline (the spans carry their own colours). */
		cursor: pointer;
		text-decoration: none;
		transition: filter 0.15s ease;
	}
	.mail-item:hover {
		filter: brightness(0.97);
	}
	.mail-item.unread {
		background: #eef4ff;
	}
	/* Mail icon: no background, just the tinted glyph. */
	.mail-ico {
		width: 2.4rem;
		height: 2.4rem;
		flex: 0 0 auto;
		color: #1657b8;
	}
	.mail-body {
		min-width: 0;
		line-height: 1.4;
		flex: 1 1 auto;
	}
	.mail-sender {
		font-size: 1.02rem;
		color: #102e66;
	}
	.mail-type {
		font-size: 0.9rem;
		color: #5b6577;
	}
	/* Type sits tight under the sender; a gap separates it from the time below. */
	.mail-time {
		margin-top: 0.35rem;
		font-size: 0.82rem;
		color: #9aa3b2;
	}
	.mail-top {
		width: 100%;
	}
	.mail-status {
		flex: 0 0 auto;
	}
	/* Status: plain coloured text (no pill background) — unread = blue, read = grey. */
	.mail-status {
		font-size: 0.78rem;
		color: #5b6577;
		white-space: nowrap;
	}
	.mail-status.is-unread {
		color: #1657b8;
	}
</style>

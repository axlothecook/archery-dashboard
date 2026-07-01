<script lang="ts">
	// One team ("Tim") row: a tinted avatar circle (role letter) + display name +
	// role. Clicking the row opens an upward details popover (avatar + display name
	// + role on top, labelled Puno ime / Telefon / Email below). The popover PERSISTS
	// while the pointer is over it; it closes (with a fade+scale animation) only when
	// the × in its top-right is clicked, when another part of the page is clicked, or
	// on Escape. Reused for every member in the Tim list, so it lives here as a single
	// component rather than inline markup.
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Member } from '$lib/team';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	let { member }: { member: Member } = $props();

	let open = $state(false);
	let root = $state<HTMLElement | null>(null);

	// Same fade+scale as the notifications dropdown (industry-standard menu reveal).
	const cardAnim = { duration: 150, start: 0.97, opacity: 0, easing: cubicOut };

	function toggle() {
		open = !open;
	}
	function close() {
		open = false;
	}
	// Close when clicking anywhere outside this member (incl. other page parts).
	function onWindowClick(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) close();
	}
	function onWindowKey(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

<div class="member" bind:this={root}>
	<button class="member-trigger" class:selected={open} type="button" aria-expanded={open} onclick={toggle}>
		<Avatar color={member.color} role={member.role} />
		<span class="member-meta">
			<span class="member-name">{member.displayName}</span>
			<span class="member-role">{member.role}</span>
		</span>
	</button>

	{#if open}
		<!-- Click-controlled details popover (opens upward); persists until dismissed. -->
		<div class="member-card" role="dialog" aria-label={member.displayName} transition:scale={cardAnim}>
			<button class="member-card-close" type="button" aria-label="Zatvori" onclick={close}>
				<CloseIcon size={22} />
			</button>
			<div class="member-card-head">
				<Avatar color={member.color} role={member.role} size={2.75} fontSize={1.45} />
				<div class="member-card-id">
					<span class="member-card-name">{member.displayName}</span>
					<span class="member-card-role">{member.role}</span>
				</div>
			</div>
			<dl class="member-card-contact">
				<div class="member-card-row"><dt>Puno ime:</dt> <dd>{member.realName}</dd></div>
				<div class="member-card-row"><dt>Telefon:</dt> <dd>{member.phone}</dd></div>
				<div class="member-card-row"><dt>Email:</dt> <dd>{member.email}</dd></div>
			</dl>
		</div>
	{/if}
</div>

<style>
	/* ---- Team row ("A" in a lighter-blue circle + name + role) ---- */
	.member {
		position: relative;
	}
	/* The whole row is a button (click to open the details popover). The small
	   padding + negative margin let the selected/hover highlight have breathing
	   room without shifting the row. */
	.member-trigger {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		width: calc(100% + 1.2rem);
		margin: -0.5rem -0.6rem;
		padding: 0.5rem 0.6rem;
		background: none;
		border: 0;
		border-radius: 10px;
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}
	.member-trigger:hover {
		background: #eef2f7;
	}
	/* Selected: this member's popover is open — highlight the row. */
	.member-trigger.selected {
		background: #dbe6f6; /* light blue-dress tint */
	}
	.member-trigger:focus-visible {
		outline: 2px solid #187ff5;
		outline-offset: 2px;
	}
	.member-meta {
		display: flex;
		flex-direction: column;
		line-height: 1.3;
	}
	.member-name {
		font-weight: 700;
		font-size: 0.95rem;
		color: #102e66;
	}
	.member-role {
		font-size: 0.82rem;
		color: #5b6577;
	}

	/* ---- Details card (opens upward, persists until dismissed) ---- */
	.member-card {
		position: absolute;
		bottom: calc(100% + 0.5rem); /* opens UPWARD, above the row */
		left: 0;
		width: 18rem; /* slightly wider */
		transform-origin: bottom left;
		padding: 2.1rem 1.4rem; /* taller card via more vertical padding */
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 8px 30px rgba(16, 46, 102, 0.18);
		z-index: 40;
	}
	/* × close button, top-right corner. */
	.member-card-close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: none;
		color: #9aa3b2;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}
	.member-card-close:hover {
		background: #eef1f3;
		color: #102e66;
	}
	.member-card-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		padding-right: 1.75rem; /* clear the × */
	}
	.member-card-id {
		display: flex;
		flex-direction: column;
		line-height: 1.3;
		min-width: 0;
	}
	.member-card-name {
		font-weight: 700;
		font-size: 1.15rem;
		color: #102e66;
		word-break: break-word;
	}
	.member-card-role {
		font-size: 0.88rem;
		color: #9aa3b2;
		text-transform: capitalize;
	}
	.member-card-contact {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-top: 1.6rem;
		border-top: 1px solid #eef1f3;
	}
	.member-card-row {
		display: flex;
		gap: 0.4rem;
		font-size: 0.95rem;
		line-height: 1.35;
	}
	.member-card-contact dt {
		margin: 0;
		font-weight: 600;
		color: #9aa3b2;
		flex: 0 0 auto;
	}
	.member-card-contact dd {
		margin: 0;
		color: #102e66;
		word-break: break-word;
	}
</style>

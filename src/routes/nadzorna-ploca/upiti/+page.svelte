<script lang="ts">
	// Upiti: the admin inquiry inbox. Three inbox types (Učlanjenje / Sponzorstvo /
	// Donacije) selected via tabs; a list on the left and a detail + reply panel on the
	// right. Change the workflow status or send an email reply (marks responded).
	// Real data from GET /admin/inquiries/<kind>. Backend: routes/admin/inquiries.ts.
	import { invalidateAll } from '$app/navigation';
	import {
		updateInquiryStatus,
		replyToInquiry,
		KIND_LABEL,
		type InquiryKind,
		type MembershipSubmission,
		type SponsorInquiry,
		type DonationInquiry
	} from '$lib/inquiries';
	import { showToast } from '$lib/toasts';
	import InquiryIcon from '$lib/components/icons/InquiryIcon.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';

	let { data } = $props();

	type AnyInquiry = MembershipSubmission | SponsorInquiry | DonationInquiry;

	// Which inbox tab is active.
	let kind = $state<InquiryKind>('membership');
	const lists = $derived({
		membership: data.membership,
		sponsor: data.sponsor,
		donation: data.donation
	} as Record<InquiryKind, AnyInquiry[]>);
	const list = $derived(lists[kind]);
	const tabs: { kind: InquiryKind; label: string; count: number }[] = $derived([
		{ kind: 'membership', label: KIND_LABEL.membership, count: data.membership.length },
		{ kind: 'sponsor', label: KIND_LABEL.sponsor, count: data.sponsor.length },
		{ kind: 'donation', label: KIND_LABEL.donation, count: data.donation.length }
	]);

	// The selected inquiry id (per tab). Reset when the tab changes.
	let selectedId = $state<string | null>(null);
	const selected = $derived(list.find((i) => i.id === selectedId) ?? null);
	function selectTab(k: InquiryKind) {
		kind = k;
		selectedId = null;
	}

	// Display name for a row (kind-specific).
	function senderName(i: AnyInquiry): string {
		if ('fullName' in i) return i.fullName; // membership
		if ('companyName' in i) return `${i.companyName} (${i.contactName})`; // sponsor
		return i.donorName; // donation
	}

	function fmtDate(iso: string): string {
		const d = new Date(iso);
		return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}.`;
	}

	// Read/unread is binary: an inquiry is UNREAD only while its status is 'new'.
	const isUnread = (i: AnyInquiry) => i.status === 'new';

	let busy = $state(false);

	// Open an inquiry: select it and, if it was unread ('new'), mark it read (PATCH →
	// 'read'). Clicking an email is the "read" signal — no manual status control.
	async function openInquiry(i: AnyInquiry) {
		selectedId = i.id;
		if (i.status !== 'new') return;
		try {
			await updateInquiryStatus(kind, i.id, 'read');
			await invalidateAll();
		} catch {
			// Non-fatal: the detail still opens; the row just stays marked unread.
		}
	}

	// ── Reply ─────────────────────────────────────────────────────────────────
	let replySubject = $state('');
	let replyText = $state('');
	// Reset the reply fields when a different inquiry is opened.
	let lastSelectedId = $state<string | null>(null);
	$effect(() => {
		if (selectedId !== lastSelectedId) {
			lastSelectedId = selectedId;
			replySubject = '';
			replyText = '';
		}
	});
	async function sendReply() {
		if (!selected || busy) return;
		if (!replySubject.trim() || !replyText.trim()) {
			showToast('error', 'Predmet i tekst odgovora su obavezni.');
			return;
		}
		busy = true;
		try {
			await replyToInquiry(kind, selected.id, { subject: replySubject.trim(), text: replyText.trim() });
			showToast('success', 'Odgovor poslan.');
			replySubject = '';
			replyText = '';
			await invalidateAll();
		} catch (e) {
			showToast('error', e instanceof Error ? e.message : 'Slanje odgovora nije uspjelo.');
		} finally {
			busy = false;
		}
	}

	// Kind-specific detail rows for the selected inquiry.
	const details = $derived.by(() => {
		const i = selected;
		if (!i) return [] as { label: string; value: string }[];
		const rows: { label: string; value: string }[] = [];
		rows.push({ label: 'E-pošta', value: i.email });
		if (i.phone) rows.push({ label: 'Telefon', value: i.phone });
		if ('salutation' in i && i.salutation) rows.push({ label: 'Oslovljavanje', value: i.salutation });
		if ('birthDate' in i && i.birthDate) rows.push({ label: 'Datum rođenja', value: fmtDate(i.birthDate) });
		if ('experience' in i && i.experience) rows.push({ label: 'Iskustvo', value: i.experience });
		if ('forMinor' in i && i.forMinor) rows.push({ label: 'Za maloljetnika', value: i.minorDetails || 'Da' });
		if ('sponsorshipInterest' in i && i.sponsorshipInterest) rows.push({ label: 'Interes', value: i.sponsorshipInterest });
		return rows;
	});
</script>

<svelte:head><title>Upiti · VSK</title></svelte:head>

<section class="in-section" class:detail-open={selected}>
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<InquiryIcon size={48} />
		<div>
			<h2 class="mgmt-title">Upiti</h2>
			<p class="mgmt-sub">Pristigli upiti s javne stranice. Pregledajte, promijenite status i odgovorite.</p>
		</div>
	</div>

	{#if data.loadError}
		<p class="in-load-error" role="alert">Neke pristigle upite nije bilo moguće učitati. Osvježite stranicu.</p>
	{/if}

	<!-- Tabs -->
	<div class="in-tabs display-f align-items-center gap-0-5" role="tablist">
		{#each tabs as tab (tab.kind)}
			<button
				class="in-tab cursor-pointer"
				class:active={kind === tab.kind}
				type="button"
				role="tab"
				aria-selected={kind === tab.kind}
				onclick={() => selectTab(tab.kind)}
			>
				{tab.label} <span class="in-tab-count">{tab.count}</span>
			</button>
		{/each}
	</div>

	<div class="in-layout" class:has-selection={selected}>
		<!-- LIST -->
		<div class="panel bg-white in-list-panel column-nowrap">
			<div class="in-list custom-scrollbar">
				{#if list.length === 0}
					<p class="in-empty">Nema upita u ovoj kategoriji.</p>
				{:else}
					{#each list as i (i.id)}
						<button
							class="in-row cursor-pointer display-f column-nowrap gap-0-2"
							class:active={selectedId === i.id}
							class:unread={isUnread(i)}
							class:read={!isUnread(i)}
							type="button"
							onclick={() => openInquiry(i)}
						>
							<div class="in-row-top display-f align-items-center justify-content-space-between gap-0-5">
								<span class="in-row-name fw-600">{senderName(i)}</span>
								<span class="in-row-flag">{isUnread(i) ? 'Nepročitano' : 'Pročitano'}</span>
							</div>
							<div class="in-row-meta display-f align-items-center justify-content-space-between gap-0-5">
								<span class="in-row-msg">{i.message ?? '(bez poruke)'}</span>
								<span class="in-row-date">{fmtDate(i.submittedAt)}</span>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>

		<!-- DETAIL + REPLY -->
		<div class="panel bg-white in-detail-panel column-nowrap">
			{#if !selected}
				<p class="in-placeholder">Odaberite upit s popisa za pregled i odgovor.</p>
			{:else}
				<div class="in-detail custom-scrollbar">
					<div class="in-detail-head display-f align-items-center gap-0-7">
						<!-- Phone-only: back to the list (the list + detail are shown one-at-a-time
						     on a phone, so a selected inquiry needs a way back). -->
						<button class="in-back cursor-pointer display-f align-items-center gap-0-4" type="button" onclick={() => (selectedId = null)}>
							<ChevronIcon direction="left" size={18} />
							Popis
						</button>
						<h3 class="in-detail-name">{senderName(selected)}</h3>
					</div>

					<dl class="in-fields">
						{#each details as row (row.label)}
							<div class="in-field-row">
								<dt>{row.label}</dt>
								<dd>{row.value}</dd>
							</div>
						{/each}
						<div class="in-field-row">
							<dt>Pristiglo</dt>
							<dd>{fmtDate(selected.submittedAt)}</dd>
						</div>
						<div class="in-field-row">
							<dt>Odgovoreno</dt>
							<dd>{selected.responded ? 'Da' : 'Ne'}</dd>
						</div>
					</dl>

					{#if selected.message}
						<div class="in-message">
							<span class="in-message-label">Poruka</span>
							<p class="in-message-text">{selected.message}</p>
						</div>
					{/if}

					<!-- Reply -->
					<div class="in-reply">
						<span class="in-reply-label">Odgovori e-poštom</span>
						<input class="field-input w-full br-xs" type="text" placeholder="Predmet" bind:value={replySubject} />
						<textarea class="field-input in-reply-text w-full br-xs" placeholder="Tekst odgovora…" bind:value={replyText}></textarea>
						<div class="in-reply-actions display-f justify-content-flex-end">
							<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={busy} onclick={sendReply}>
								{busy ? 'Slanje…' : 'Pošalji odgovor'}
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	// Library palette colours (exact matches).
	$navy: map.get(lib.$colors, 'deep-sapphire'); // $navy
	$blue: map.get(lib.$colors, 'blue-dress'); // $blue
	$red: map.get(lib.$colors, 'error-secondary'); // $red
	$border: map.get(lib.$colors, 'seashell'); // $border

	.in-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		min-height: 0;
		flex: 1 1 auto;
	}
	.mgmt-head {
		margin-bottom: 1.25rem;
	}
	.mgmt-title {
		margin: 0;
		font-size: 1.6rem;
		font-weight: 700;
		color: $navy;
	}
	.mgmt-sub {
		margin: 0.35rem 0 0;
		font-size: 0.95rem;
		color: #5b6577;
	}
	.in-load-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.in-tabs {
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}
	.in-tab {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 0.5rem 0.9rem;
		border: 1px solid #d7dee8;
		border-radius: 999px;
		background: #fff;
		color: #5b6577;
		font-size: 0.9rem;
		font-weight: 600;
		font-family: inherit;
	}
	.in-tab:hover {
		background: #f1f4fa;
	}
	.in-tab.active {
		background: $navy;
		border-color: $navy;
		color: #fff;
	}
	.in-tab-count {
		margin-left: 0.25rem;
		opacity: 0.75;
		font-weight: 700;
	}
	.in-layout {
		display: grid;
		/* Wider list (left), narrower detail (right). */
		grid-template-columns: 30rem 1fr;
		gap: 1.25rem;
		align-items: start;
		flex: 1 1 auto;
		min-height: 0;
	}
	.panel {
		border-radius: 14px;
		padding: 1rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}
	.in-list-panel,
	.in-detail-panel {
		align-self: stretch;
		min-height: 0;
		max-height: calc(100vh - 16rem);
	}
	/* Detail (right) panel: more inner padding + a flex column so the reply area can
	   grow the textarea down to the panel's bottom. */
	.in-detail-panel {
		padding: 1.6rem;
		display: flex;
		flex-direction: column;
	}
	/* Fill the list panel and scroll INSIDE it when the mail count exceeds the panel
	   height (min-height:0 + flex lets it bound to the panel instead of growing it). */
	.in-list {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.in-empty,
	.in-placeholder {
		margin: 0;
		padding: 2rem 1rem;
		text-align: center;
		color: #9aa3b2;
		font-size: 0.95rem;
	}
	/* The WHOLE row is tinted by read state (no pill): yellow = unread, green = read.
	   No border on the rows (removed per request) — the background tint alone marks state. */
	.in-row {
		text-align: left;
		border: none;
		border-radius: 10px;
		padding: 0.7rem 0.8rem;
		font-family: inherit;
	}
	.in-row.unread {
		background: #ffe69b; /* pale yellow — unread */
	}
	.in-row.read {
		background: #aeff93; /* green — read */
	}
	.in-row:hover {
		filter: brightness(0.98);
	}
	/* Selected row: no border, no ring — just a LIGHTER shade of the row's own read/unread
	   colour so it reads as the same state, only highlighted. */
	.in-row.active.unread {
		background: #fff3cd; /* lighter yellow */
	}
	.in-row.active.read {
		background: #d6ffc8; /* lighter green */
	}
	.in-row-name {
		font-size: 0.95rem;
		color: $navy;
	}
	/* Plain read/unread label (no pill). */
	.in-row-flag {
		flex: 0 0 auto;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}
	.in-row.unread .in-row-flag {
		color: #000;
	}
	.in-row.read .in-row-flag {
		color: #000;
	}
	.in-row-msg {
		font-size: 0.82rem;
		max-width: 17rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: #5b6577;
	}
	.in-row-date {
		font-size: 0.8rem;
		white-space: nowrap;
		color: #5b6577;
	}
	/* Fills the detail panel as a flex column so the reply textarea can grow down to the
	   panel's bottom padding. Its own scrollbar handles overflow if the detail is tall. */
	.in-detail {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}
	.in-detail-head {
		margin-bottom: 1rem;
	}
	/* Back-to-list button is phone-only (desktop shows both panes at once). */
	.in-back {
		display: none;
		border: 1px solid #d7dee8;
		border-radius: 8px;
		background: #fff;
		padding: 0.4rem 0.7rem;
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		color: $navy;
		flex: 0 0 auto;
	}
	.in-back:hover {
		background: #f1f4fa;
	}
	.in-detail-name {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 700;
		color: $navy;
	}
	.in-message-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #5b6577;
	}
	/* "Odgovori e-poštom": styled like the archer view page's Biografija section title
	   (navy, 1.15rem, bold) so it reads as a section header. */
	.in-reply-label {
		font-size: 1.15rem;
		font-weight: 700;
		color: $navy;
	}
	.in-fields {
		margin: 0 0 1rem;
		display: grid;
		gap: 0.35rem;
	}
	.in-field-row {
		display: grid;
		grid-template-columns: 9rem 1fr;
		gap: 0.5rem;
		font-size: 0.92rem;
	}
	.in-field-row dt {
		/* Match the archer view page's basic-data labels (Uloga / Luk / Spol …). */
		color: #5b6577;
		font-weight: 600;
	}
	.in-field-row dd {
		margin: 0;
		color: $navy;
		word-break: break-word;
	}
	.in-message {
		margin-bottom: 1.25rem;
		/* Don't let a long Poruka shove the reply area off-screen: the message box caps
		   its own height and scrolls internally (flex-shrink:0 so it isn't squeezed to
		   nothing, but its inner text scrolls past the cap). */
		flex: 0 0 auto;
	}
	.in-message-text {
		margin: 0.3rem 0 0;
		padding: 0.7rem 0.9rem;
		background: #f7f8fa;
		border-radius: 8px;
		color: $navy;
		font-size: 0.92rem;
		line-height: 1.5;
		white-space: pre-wrap;
		/* A very long message scrolls inside this box (max ~10 lines) instead of pushing
		   the reply form below the panel / screen. */
		max-height: 15rem;
		overflow-y: auto;
	}
	/* Fills the remaining detail height so the textarea can stretch to the panel's bottom
	   (the Subject + label + actions are fixed; the textarea takes the slack). */
	.in-reply {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-top: 1px solid $border;
		padding-top: 1rem;
	}
	.field-input {
		box-sizing: border-box;
		padding: 0.6rem 0.8rem;
		border: 1px solid #d7dee8;
		font-size: 0.95rem;
		font-family: inherit;
		color: $navy;
		background: #fff;
	}
	.field-input:focus {
		outline: none;
		border-color: $blue;
	}
	/* Grow to fill the reply area down to the panel bottom; never exceed the panel width
	   (box-sizing:border-box on .field-input keeps it within padding). When the space is
	   tight (a long Poruka shrank the reply area), the textarea compresses and scrolls its
	   own content (overflow-y:auto) instead of forcing the panel below the screen. */
	.in-reply-text {
		flex: 1 1 auto;
		min-height: 4rem;
		resize: none;
		overflow-y: auto;
		line-height: 1.4;
	}
	.in-reply-actions {
		flex: 0 0 auto;
		margin-top: 0.25rem;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		font-size: 0.9rem;
		font-family: inherit;
		border: 1px solid transparent;
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.btn--primary {
		background: $navy;
		color: #fff;
	}
	.btn--primary:hover:not(:disabled) {
		background: #0c2350;
	}
	@media (max-width: 900px) {
		/* Fit the page to the viewport so only the active pane scrolls (not the page). */
		.in-section {
			height: calc(100dvh - 70px - 44px);
			min-height: 0;
		}
		.mgmt-head {
			flex: 0 0 auto;
		}
		/* Tabs become the TOP of the white list card: white bg, edge-to-edge, rounded top
		   corners, no gap to the list below. Hidden while a detail is open (you're viewing a
		   single inquiry then). */
		.in-tabs {
			flex: 0 0 auto;
			margin: 0 -1rem;
			padding: 1rem 1rem 0.85rem;
			background: #fff;
			border-radius: 0;
		}
		.in-section.detail-open .in-tabs {
			display: none;
		}
		/* Master–detail: show ONE pane at a time. No selection → the list fills the space;
		   a selected inquiry → the detail replaces it (with a "Popis" back button). Stacking
		   both (the old behaviour) wasted half the screen on an empty detail card. */
		.in-layout {
			display: flex;
			flex-direction: column;
			min-height: 0;
		}
		.in-list-panel,
		.in-detail-panel {
			/* Fill the frame + go edge-to-edge (cancel the content area's 1rem side padding). */
			flex: 1 1 auto;
			min-height: 0;
			max-height: none;
			margin-left: -1rem;
			margin-right: -1rem;
			border-radius: 0;
		}
		/* Default (no selection): list shown, detail hidden. */
		.in-detail-panel {
			display: none;
		}
		/* A selection swaps them: hide the list, show the detail full-screen. */
		.in-layout.has-selection .in-list-panel {
			display: none;
		}
		.in-layout.has-selection .in-detail-panel {
			display: flex;
		}
		.in-back {
			display: inline-flex;
			/* A bit more breathing room between the back button and the title next to it. */
			margin-right: 0.5rem;
		}
		/* Scrollbar sits at the WHITE PANEL's right edge (not floating inset): let the detail
		   scroll area run to the panel edge by cancelling the panel's right padding on the scroll
		   container, then re-pad the CONTENT so text keeps a gap from the scrollbar. */
		.in-detail {
			margin-right: -1.6rem; /* = panel's right padding */
			padding-right: 0.9rem; /* gap between content and the edge scrollbar */
		}
	}
</style>

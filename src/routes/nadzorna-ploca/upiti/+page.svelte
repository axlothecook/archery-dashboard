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

<section class="in-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<InquiryIcon size={40} />
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

	<div class="in-layout">
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
					<div class="in-detail-head display-f align-items-center gap-1">
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

<style>
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
		color: #102e66;
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
		background: #102e66;
		border-color: #102e66;
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
	.in-list {
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
	   The border mirrors that background (a darker shade of the same hue), and there is
	   no curved left border. */
	.in-row {
		text-align: left;
		border: 1px solid transparent;
		border-radius: 10px;
		padding: 0.7rem 0.8rem;
		font-family: inherit;
	}
	.in-row.unread {
		background: #fdf6d8; /* yellow — unread */
		border-color: #ecdb92;
	}
	.in-row.read {
		background: #e3f6ea; /* green — read */
		border-color: #b7e3c6;
	}
	.in-row:hover {
		filter: brightness(0.98);
	}
	/* Selected row: keep its read/unread tint but show a clear navy ring. */
	.in-row.active {
		border-color: #102e66;
	}
	.in-row-name {
		font-size: 0.95rem;
		color: #102e66;
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
		color: #8a6d00;
	}
	.in-row.read .in-row-flag {
		color: #10683a;
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
	.in-detail-name {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 700;
		color: #102e66;
	}
	.in-reply-label,
	.in-message-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #5b6577;
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
		color: #9aa3b2;
	}
	.in-field-row dd {
		margin: 0;
		color: #102e66;
		word-break: break-word;
	}
	.in-message {
		margin-bottom: 1.25rem;
	}
	.in-message-text {
		margin: 0.3rem 0 0;
		padding: 0.7rem 0.9rem;
		background: #f7f8fa;
		border-radius: 8px;
		color: #102e66;
		font-size: 0.92rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}
	/* Fills the remaining detail height so the textarea can stretch to the panel's bottom
	   (the Subject + label + actions are fixed; the textarea takes the slack). */
	.in-reply {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-top: 1px solid #eef1f3;
		padding-top: 1rem;
	}
	.field-input {
		box-sizing: border-box;
		padding: 0.6rem 0.8rem;
		border: 1px solid #d7dee8;
		font-size: 0.95rem;
		font-family: inherit;
		color: #102e66;
		background: #fff;
	}
	.field-input:focus {
		outline: none;
		border-color: #187ff5;
	}
	/* Grow to fill the reply area down to the panel bottom; never exceed the panel width
	   (box-sizing:border-box on .field-input keeps it within padding). */
	.in-reply-text {
		flex: 1 1 auto;
		min-height: 7rem;
		resize: none;
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
		background: #102e66;
		color: #fff;
	}
	.btn--primary:hover:not(:disabled) {
		background: #0c2350;
	}
	@media (max-width: 900px) {
		.in-layout {
			grid-template-columns: 1fr;
		}
	}
</style>

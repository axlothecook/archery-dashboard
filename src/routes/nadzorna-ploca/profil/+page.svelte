<script lang="ts">
	// Admin profile settings. Opened from the top-bar user chip. Shows the signed-in
	// admin's info as editable inputs (display name, real name, email, phone) plus a
	// change-password section; role is read-only (admins don't self-change role).
	// Placeholder data lives in the shared reactive `teamStore`; saving pushes edits
	// there so they show everywhere (Tim list, top-bar chip). No backend save yet —
	// wire to PATCH /profile on adoption.
	import { getCurrentAdmin, updateCurrentAdmin } from '$lib/teamStore.svelte';
	import { roleLabel } from '$lib/team';
	import { showToast } from '$lib/toasts';
	import { changePassword as changePasswordApi, AuthError } from '$lib/auth';
	import {
		validateUsername,
		validateName,
		validateEmail,
		validatePhone,
		validateNewPassword,
		PW_MAX
	} from '$lib/profileValidation';
	import Avatar from '$lib/components/Avatar.svelte';
	import ContactModal from '$lib/components/ContactModal.svelte';
	import AlertIcon from '$lib/components/icons/AlertIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import EyeOffIcon from '$lib/components/icons/EyeOffIcon.svelte';

	// Developer-contact modals (Prijavi problem / Predloži promjenu). Fake emergency number
	// for now — swap for the real one on adoption.
	let issueOpen = $state(false);
	let ideaOpen = $state(false);
	const EMERGENCY_PHONE = '+31 6 1234 5678';

	// Live current-admin record from the shared store.
	const currentAdmin = $derived(getCurrentAdmin());

	// Local editable copies, seeded from the current admin. Committed to the shared
	// store on "Spremi promjene" (so the Tim row + chip update on save, not per key).
	let displayName = $state(getCurrentAdmin().displayName);
	let realName = $state(getCurrentAdmin().realName);
	let email = $state(getCurrentAdmin().email);
	let phone = $state(getCurrentAdmin().phone);

	// Originals as first seeded from the store. Used to tell whether a field has been EDITED —
	// a green tick only appears once the user changes a value, not on the pre-filled data.
	const original = {
		displayName: getCurrentAdmin().displayName,
		realName: getCurrentAdmin().realName,
		email: getCurrentAdmin().email,
		phone: getCurrentAdmin().phone
	};

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	// Per-field show/hide (eye toggle) for the three password inputs.
	let showCurrent = $state(false);
	let showNew = $state(false);
	let showConfirm = $state(false);

	// New password: 12–20 chars (backend min 12 + agreed 20 max). validateNewPassword
	// returns { state, message } — 'empty' until typing, 'bad' (too short/long) → 'ok'.
	const newPwV = $derived(validateNewPassword(newPassword));
	// Confirmation: neutral until typing starts, then mismatch (red) → match (green).
	const confirmState = $derived(
		confirmPassword.length === 0 ? 'empty' : confirmPassword === newPassword ? 'match' : 'mismatch'
	);
	// Current password has no client-side rule (correctness is server-side); we only flag it
	// empty AFTER a submit attempt, inline beneath the field.
	let submitted = $state(false);
	// Wrong-current-password error from the server (POST /auth/change-password). The client
	// CANNOT verify correctness — it has no stored hash — so this is populated by the backend
	// response on adoption and shown inline under the Trenutna lozinka field. Cleared on edit.
	let currentPwError = $state('');

	// ── Podaci računa validation (shared rules in $lib/profileValidation) ──────────
	// Each returns { state: 'empty'|'ok'|'bad', message? }. Format/char/length errors ('bad')
	// surface live; empty-required fields only flag AFTER a save attempt.
	let profileSubmitted = $state(false);

	const displayNameV = $derived(validateUsername(displayName));
	const realNameV = $derived(validateName(realName));
	const emailV = $derived(validateEmail(email));
	const phoneV = $derived(validatePhone(phone));
	const profileValid = $derived(
		displayNameV.state === 'ok' &&
			realNameV.state === 'ok' &&
			emailV.state === 'ok' &&
			phoneV.state === 'ok'
	);

	// A tick shows only for fields the user has actually EDITED (changed from the stored value)
	// and that are now valid — pre-filled data carries no checkmark.
	const displayNameEdited = $derived(displayName !== original.displayName);
	const realNameEdited = $derived(realName !== original.realName);
	const emailEdited = $derived(email !== original.email);
	const phoneEdited = $derived(phone !== original.phone);

	function saveProfile(e: SubmitEvent) {
		e.preventDefault();
		profileSubmitted = true;
		if (!profileValid) return;
		// Push edits into the shared store → reflected in the Tim list + top-bar chip.
		// TODO(adoption): also PATCH /profile to persist server-side.
		updateCurrentAdmin({ displayName, realName, email, phone });
		showToast('success', 'Promjene su spremljene.');
	}
	let changingPw = $state(false);

	async function changePassword(e: SubmitEvent) {
		e.preventDefault();
		if (changingPw) return;
		// Client-side gate (all inline beneath each field, no top-centre popup): current
		// non-empty, new >= 12, confirm matches. Marking `submitted` reveals the
		// current-password "required" message if it was left empty.
		submitted = true;
		currentPwError = '';
		if (!currentPassword || newPwV.state !== 'ok' || confirmState !== 'match') return;

		changingPw = true;
		try {
			// The BACKEND verifies the current password against the stored hash (the client
			// has no hash to check against). A wrong current password comes back as a 401.
			await changePasswordApi(currentPassword, newPassword);
			submitted = false;
			currentPassword = newPassword = confirmPassword = '';
			showToast('success', 'Lozinka je promijenjena.');
		} catch (err) {
			if (err instanceof AuthError && err.status === 401) {
				currentPwError = 'Trenutna lozinka nije ispravna';
			} else if (err instanceof AuthError && err.status === 400) {
				currentPwError = 'Lozinka nije valjana. Provjerite unos.';
			} else {
				showToast('error', 'Promjena lozinke nije uspjela. Pokušajte ponovno.');
			}
		} finally {
			changingPw = false;
		}
	}
</script>

<svelte:head><title>Profil · VSK</title></svelte:head>

<section class="profile">
	<header class="profile-head display-f align-items-center gap-1">
		<Avatar color={currentAdmin.color} role={currentAdmin.role} size={4} fontSize={2} />
		<div class="profile-id">
			<h2 class="profile-name">{displayName}</h2>
			<p class="profile-sub">{realName} · <span class="profile-role">{roleLabel(currentAdmin.role)}</span></p>
		</div>
	</header>

	<div class="profile-grid gap-1-5 align-items-start">
		<!-- Account details -->
		<form class="card bg-white" onsubmit={saveProfile}>
			<h3 class="card-title">Podaci računa</h3>

			<label class="field">
				<span class="field-label">Korisničko ime</span>
				<input
					class="field-input"
					class:is-error={displayNameV.state === 'bad' || (profileSubmitted && displayNameV.state === 'empty')}
					class:is-ok={displayNameEdited && displayNameV.state === 'ok'}
					type="text"
					maxlength="20"
					bind:value={displayName}
				/>
				{#if displayNameV.state === 'bad' || (profileSubmitted && displayNameV.state === 'empty')}
					<div class="warning-row display-f align-items-center gap-0-5">
						<span class="warning-ico display-f"><AlertIcon size={16} /></span>
						<span class="warning-text">{displayNameV.message ?? 'Korisničko ime je obavezno'}</span>
					</div>
				{/if}
			</label>
			<label class="field">
				<span class="field-label">Ime i prezime</span>
				<input
					class="field-input"
					class:is-error={realNameV.state === 'bad' || (profileSubmitted && realNameV.state === 'empty')}
					class:is-ok={realNameEdited && realNameV.state === 'ok'}
					type="text"
					maxlength="20"
					bind:value={realName}
				/>
				{#if realNameV.state === 'bad' || (profileSubmitted && realNameV.state === 'empty')}
					<div class="warning-row display-f align-items-center gap-0-5">
						<span class="warning-ico display-f"><AlertIcon size={16} /></span>
						<span class="warning-text">{realNameV.message ?? 'Ime i prezime je obavezno'}</span>
					</div>
				{/if}
			</label>
			<label class="field">
				<span class="field-label">Email</span>
				<input
					class="field-input"
					class:is-error={emailV.state === 'bad' || (profileSubmitted && emailV.state === 'empty')}
					class:is-ok={emailEdited && emailV.state === 'ok'}
					type="email"
					maxlength="254"
					bind:value={email}
				/>
				{#if emailV.state === 'bad' || (profileSubmitted && emailV.state === 'empty')}
					<div class="warning-row display-f align-items-center gap-0-5">
						<span class="warning-ico display-f"><AlertIcon size={16} /></span>
						<span class="warning-text">{emailV.message ?? 'Email je obavezan'}</span>
					</div>
				{/if}
			</label>
			<label class="field">
				<span class="field-label">Telefon</span>
				<input
					class="field-input"
					class:is-error={phoneV.state === 'bad' || (profileSubmitted && phoneV.state === 'empty')}
					class:is-ok={phoneEdited && phoneV.state === 'ok'}
					type="tel"
					maxlength="20"
					bind:value={phone}
				/>
				{#if phoneV.state === 'bad' || (profileSubmitted && phoneV.state === 'empty')}
					<div class="warning-row display-f align-items-center gap-0-5">
						<span class="warning-ico display-f"><AlertIcon size={16} /></span>
						<span class="warning-text">{phoneV.message ?? 'Telefon je obavezan'}</span>
					</div>
				{/if}
			</label>
			<label class="field field--no-msg">
				<span class="field-label">Uloga</span>
				<input class="field-input" type="text" value={roleLabel(currentAdmin.role)} disabled />
			</label>

			<div class="card-actions display-f justify-content-flex-end">
				<button class="btn btn--primary cursor-pointer" type="submit">Spremi promjene</button>
			</div>
		</form>

		<!-- Change password -->
		<form class="card bg-white" onsubmit={changePassword}>
			<h3 class="card-title">Promjena lozinke</h3>

			<label class="field">
				<span class="field-label">Trenutna lozinka</span>
				<div class="input-wrap">
					{#if showCurrent}
						<input class="field-input has-eye" class:is-error={(submitted && !currentPassword) || !!currentPwError} type="text" bind:value={currentPassword} oninput={() => (currentPwError = '')} autocomplete="current-password" />
					{:else}
						<input class="field-input has-eye" class:is-error={(submitted && !currentPassword) || !!currentPwError} type="password" bind:value={currentPassword} oninput={() => (currentPwError = '')} autocomplete="current-password" />
					{/if}
					<button class="eye-btn display-f align-items-center justify-content-center cursor-pointer" type="button" aria-label={showCurrent ? 'Sakrij lozinku' : 'Prikaži lozinku'} aria-pressed={showCurrent} onclick={() => (showCurrent = !showCurrent)}>
						{#if showCurrent}<EyeIcon size={20} />{:else}<EyeOffIcon size={20} />{/if}
					</button>
				</div>
				{#if submitted && !currentPassword}
					<div class="warning-row display-f align-items-center gap-0-5">
						<span class="warning-ico display-f"><AlertIcon size={16} /></span>
						<span class="warning-text">Unesite trenutnu lozinku</span>
					</div>
				{:else if currentPwError}
					<div class="warning-row display-f align-items-center gap-0-5">
						<span class="warning-ico display-f"><AlertIcon size={16} /></span>
						<span class="warning-text">{currentPwError}</span>
					</div>
				{/if}
			</label>
			<label class="field">
				<span class="field-label">Nova lozinka</span>
				<div class="input-wrap">
					{#if showNew}
						<input class="field-input has-eye" class:is-error={newPwV.state === 'bad'} class:is-ok={newPwV.state === 'ok'} type="text" maxlength={PW_MAX} bind:value={newPassword} autocomplete="new-password" />
					{:else}
						<input class="field-input has-eye" class:is-error={newPwV.state === 'bad'} class:is-ok={newPwV.state === 'ok'} type="password" maxlength={PW_MAX} bind:value={newPassword} autocomplete="new-password" />
					{/if}
					<button class="eye-btn display-f align-items-center justify-content-center cursor-pointer" type="button" aria-label={showNew ? 'Sakrij lozinku' : 'Prikaži lozinku'} aria-pressed={showNew} onclick={() => (showNew = !showNew)}>
						{#if showNew}<EyeIcon size={20} />{:else}<EyeOffIcon size={20} />{/if}
					</button>
				</div>
				{#if newPwV.state === 'bad'}
					<div class="warning-row display-f align-items-center gap-0-5">
						<span class="warning-ico display-f"><AlertIcon size={16} /></span>
						<span class="warning-text">{newPwV.message}</span>
					</div>
				{/if}
			</label>
			<label class="field">
				<span class="field-label">Potvrdi novu lozinku</span>
				<div class="input-wrap">
					{#if showConfirm}
						<input class="field-input has-eye" class:is-error={confirmState === 'mismatch'} class:is-ok={confirmState === 'match'} type="text" bind:value={confirmPassword} autocomplete="new-password" />
					{:else}
						<input class="field-input has-eye" class:is-error={confirmState === 'mismatch'} class:is-ok={confirmState === 'match'} type="password" bind:value={confirmPassword} autocomplete="new-password" />
					{/if}
					<button class="eye-btn display-f align-items-center justify-content-center cursor-pointer" type="button" aria-label={showConfirm ? 'Sakrij lozinku' : 'Prikaži lozinku'} aria-pressed={showConfirm} onclick={() => (showConfirm = !showConfirm)}>
						{#if showConfirm}<EyeIcon size={20} />{:else}<EyeOffIcon size={20} />{/if}
					</button>
				</div>
				{#if confirmState === 'mismatch'}
					<div class="warning-row display-f align-items-center gap-0-5">
						<span class="warning-ico display-f"><AlertIcon size={16} /></span>
						<span class="warning-text">Lozinke se ne podudaraju</span>
					</div>
				{/if}
			</label>

			<div class="card-actions display-f justify-content-flex-end">
				<button class="btn btn--primary cursor-pointer" type="submit" disabled={changingPw}>
					{changingPw ? 'Mijenjanje…' : 'Promijeni lozinku'}
				</button>
			</div>
		</form>
	</div>

	<!-- Support / contact the developer — full-width below the two account cards. -->
	<div class="card support-card bg-white">
		<h3 class="card-title">Podrška</h3>
		<p class="support-sub">Naišli ste na problem ili imate ideju? Javite se razvojnom programeru.</p>

		<div class="support-actions display-f gap-0-7">
			<button class="btn btn--report cursor-pointer" type="button" onclick={() => (issueOpen = true)}>Prijavi problem</button>
			<button class="btn btn--suggest cursor-pointer" type="button" onclick={() => (ideaOpen = true)}>Predloži promjenu</button>
		</div>

		<div class="emergency display-f align-items-center gap-0-5">
			<span class="emergency-ico display-f"><AlertIcon size={18} /></span>
			<span class="emergency-text">
				Za hitne slučajeve javite se na <strong>{EMERGENCY_PHONE}</strong> putem WhatsAppa ili poziva.
			</span>
		</div>
	</div>
</section>

<ContactModal bind:open={issueOpen} title="Prijavi problem" kind="issue" />
<ContactModal bind:open={ideaOpen} title="Predloži promjenu" kind="idea" />

<style>
	.profile {
		max-width: 78rem;
		/* The shell clips .admin-content (page never scrolls; inner divs do). This page has
		   no single inner scroll region, so the SECTION itself scrolls when its content is
		   taller than the frame — otherwise everything below the fold (Podrška) is clipped
		   and unreachable, which happened on phones. */
		overflow-y: auto;
		min-height: 0;
		/* Room for the scrollbar / a little breathing space at the bottom. */
		padding-right: 0.25rem;
	}
	.profile-head {
		/* layout via utility classes (display-f align-items-center gap-1) */
		margin-bottom: 1.25rem;
	}
	.profile-name {
		margin: 0;
		font-size: 1.6rem;
		font-weight: 700;
		color: #102e66;
	}
	.profile-sub {
		margin: 0.2rem 0 0;
		color: #5b6577;
	}

	/* Two columns: account details + password. Support sits full-width below. gap +
	   align-items-start come from utility classes; collapses to one column on phones. */
	.profile-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
	}
	.card {
		border-radius: 14px;
		padding: 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}
	.card-title {
		margin: 0 0 1.1rem;
		font-size: 1.15rem;
		font-weight: 700;
		color: #102e66;
	}

	.field {
		display: block;
		position: relative;
		/* Reserve a fixed slot beneath the input for a one-line error, so showing/hiding it
		   never changes the card height (the warning-row is absolutely placed into it). */
		margin-bottom: 0.5rem;
		padding-bottom: 1.7rem;
	}
	/* Fields that can never show an error (read-only Uloga) don't reserve the error slot. */
	.field--no-msg {
		padding-bottom: 0;
		margin-bottom: 1rem;
	}
	.field-label {
		display: block;
		margin-bottom: 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #5b6577;
	}
	.field-input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.65rem 0.8rem;
		border: 1px solid #d7dee8;
		border-radius: 8px;
		font-size: 0.95rem;
		font-family: inherit;
		color: #102e66;
		background: #fff;
		transition: border-color 0.15s ease;
	}
	.field-input:focus {
		outline: none;
		border-color: #187ff5;
	}
	/* Kill the browser AUTOFILL background tint (Chrome/Safari paint a grey/blue fill once
	   a field matches a saved value). Mask it with an inset shadow in the field's own white
	   and pin the text colour; the long transition delay defeats the fade-in. */
	.field-input:-webkit-autofill,
	.field-input:-webkit-autofill:hover,
	.field-input:-webkit-autofill:focus,
	.field-input:-webkit-autofill:active {
		-webkit-text-fill-color: #102e66;
		caret-color: #102e66;
		box-shadow: 0 0 0 1000px #fff inset;
		transition: background-color 9999s ease 0s;
	}
	.field-input:disabled {
		background: #f3f5f8;
		color: #5b6577;
		cursor: not-allowed;
	}

	/* Wrap holds the password input + its eye toggle (positioned within). */
	.input-wrap {
		position: relative;
	}
	/* Leave room on the right for the eye button so text never runs under it. */
	.field-input.has-eye {
		padding-right: 3rem;
	}

	/* Validation state shown by the FIELD BORDER: red on error, green on pass. These win
	   over :focus (declared earlier) via source order + the state class, so a bad field
	   stays red even while focused. */
	.field-input.is-error,
	.field-input.is-error:focus {
		border-color: #d32752; /* error red */
	}
	.field-input.is-ok,
	.field-input.is-ok:focus {
		border-color: #22a559; /* pass green */
	}
	/* Eye (show/hide) toggle pinned to the right edge of the input. */
	.eye-btn {
		position: absolute;
		top: 50%;
		right: 0.5rem;
		transform: translateY(-50%);
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		border-radius: 6px;
		background: none;
		color: #5b6577;
	}
	.eye-btn:hover {
		background: #eef1f3;
		color: #102e66;
	}

	/* Red warning row under a field (formValidation-style): circle-exclamation + message. */
	/* Sits in the reserved slot at the bottom of the field; absolute so it never grows the
	   card. One line (nowrap) — the card is wide enough to fit the longest message. */
	.warning-row {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		white-space: nowrap;
	}
	.warning-ico {
		flex: 0 0 auto;
		color: #b91618;
	}
	.warning-text {
		font-size: 0.85rem;
		color: #b91618;
	}

	.card-actions {
		/* layout via utility classes (display-f justify-content-flex-end) */
		margin-top: 0.5rem;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		border-radius: 8px;
		font-size: 0.92rem;
		font-weight: 600;
		font-family: inherit;
		border: 1px solid transparent;
	}
	.btn--primary {
		background: #102e66;
		color: #fff;
	}
	.btn--primary:hover {
		background: #0c2350;
	}

	/* Support card (full-width below the two account cards). */
	.support-card {
		margin-top: 0.5rem;
	}
	/* Tighter gap between the "Podrška" title and its subtext. */
	.support-card .card-title {
		margin-bottom: 0.3rem;
	}
	.support-sub {
		margin: 0 0 1.1rem;
		font-size: 0.85rem;
		color: #5b6577;
	}
	/* Both support buttons sit on ONE row, each sized to ITS OWN label (not stretched to fill
	   the card — they used to span the full width, which read as oversized). Left-aligned. */
	.support-actions {
		flex-wrap: nowrap;
		justify-content: flex-start;
		margin-bottom: 1.1rem;
	}
	.support-actions .btn {
		flex: 0 0 auto;
		padding: 0.7rem 1.2rem;
		font-size: 0.95rem;
		border-radius: 10px;
		white-space: nowrap;
	}
	.btn--report {
		background: #d32752;
		color: #fff;
	}
	.btn--report:hover {
		background: #b91d45;
	}
	.btn--suggest {
		background: #fff;
		color: #102e66;
		border-color: #d7dee8;
	}
	.btn--suggest:hover {
		background: #eef1f3;
	}
	/* Emergency note: red-tinted, under the buttons. */
	.emergency {
		padding: 0.7rem 0.9rem;
		border: 1px solid #f2c4cf;
		border-radius: 8px;
		background: #fdeef2;
	}
	.emergency-ico {
		flex: 0 0 auto;
		color: #d32752;
	}
	.emergency-text {
		font-size: 0.9rem;
		line-height: 1.45;
		color: #8a1f3a;
	}

	@media (max-width: 720px) {
		.profile-grid {
			grid-template-columns: 1fr;
		}
		/* White cards go edge-to-edge (touch the screen sides) with square corners, matching
		   the list/form pages (Objavljene vijesti / Svi događaji). */
		.card {
			margin-left: -1rem;
			margin-right: -1rem;
			border-radius: 0;
		}
		/* Keep the two support buttons SIDE BY SIDE on phone (don't stack): each shrinks to an
		   equal share of the row so both fit without clipping. Tighter padding + slightly
		   smaller text so the labels stay on one line on a narrow screen. */
		.support-actions {
			flex-wrap: nowrap;
		}
		.support-actions .btn {
			flex: 1 1 0;
			min-width: 0;
			padding: 0.7rem 0.5rem;
			font-size: 0.9rem;
		}
	}
</style>

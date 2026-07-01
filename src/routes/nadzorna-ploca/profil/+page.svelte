<script lang="ts">
	// Admin profile settings. Opened from the top-bar user chip. Shows the signed-in
	// admin's info as editable inputs (display name, real name, email, phone) plus a
	// change-password section; role is read-only (admins don't self-change role).
	// Placeholder data lives in the shared reactive `teamStore`; saving pushes edits
	// there so they show everywhere (Tim list, top-bar chip). No backend save yet —
	// wire to PATCH /profile on adoption.
	import { getCurrentAdmin, updateCurrentAdmin } from '$lib/teamStore.svelte';
	import { showToast } from '$lib/toasts';
	import Avatar from '$lib/components/Avatar.svelte';

	// Live current-admin record from the shared store.
	const currentAdmin = $derived(getCurrentAdmin());

	// Local editable copies, seeded from the current admin. Committed to the shared
	// store on "Spremi promjene" (so the Tim row + chip update on save, not per key).
	let displayName = $state(getCurrentAdmin().displayName);
	let realName = $state(getCurrentAdmin().realName);
	let email = $state(getCurrentAdmin().email);
	let phone = $state(getCurrentAdmin().phone);

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	function saveProfile(e: SubmitEvent) {
		e.preventDefault();
		// Push edits into the shared store → reflected in the Tim list + top-bar chip.
		// TODO(adoption): also PATCH /profile to persist server-side.
		updateCurrentAdmin({ displayName, realName, email, phone });
		showToast('success', 'Promjene su spremljene.');
	}
	function changePassword(e: SubmitEvent) {
		e.preventDefault();
		// TODO(adoption): POST /auth/change-password.
		if (!newPassword || newPassword !== confirmPassword) {
			showToast('error', 'Lozinke se ne podudaraju.');
			return;
		}
		currentPassword = newPassword = confirmPassword = '';
		showToast('success', 'Lozinka je promijenjena.');
	}
</script>

<svelte:head><title>Profil · VSK</title></svelte:head>

<section class="profile">
	<header class="profile-head display-f align-items-center gap-1">
		<Avatar color={currentAdmin.color} role={currentAdmin.role} size={4} fontSize={2} />
		<div class="profile-id">
			<h2 class="profile-name">{displayName}</h2>
			<p class="profile-sub">{realName} · <span class="profile-role">{currentAdmin.role}</span></p>
		</div>
	</header>

	<div class="profile-grid grid-cols-2 gap-1-5 align-items-start">
		<!-- Account details -->
		<form class="card bg-white" onsubmit={saveProfile}>
			<h3 class="card-title">Podaci računa</h3>

			<label class="field">
				<span class="field-label">Korisničko ime</span>
				<input class="field-input" type="text" bind:value={displayName} />
			</label>
			<label class="field">
				<span class="field-label">Ime i prezime</span>
				<input class="field-input" type="text" bind:value={realName} />
			</label>
			<label class="field">
				<span class="field-label">Email</span>
				<input class="field-input" type="email" bind:value={email} />
			</label>
			<label class="field">
				<span class="field-label">Telefon</span>
				<input class="field-input" type="tel" bind:value={phone} />
			</label>
			<label class="field">
				<span class="field-label">Uloga</span>
				<input class="field-input" type="text" value={currentAdmin.role} disabled />
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
				<input class="field-input" type="password" bind:value={currentPassword} autocomplete="current-password" />
			</label>
			<label class="field">
				<span class="field-label">Nova lozinka</span>
				<input class="field-input" type="password" bind:value={newPassword} autocomplete="new-password" />
			</label>
			<label class="field">
				<span class="field-label">Potvrdi novu lozinku</span>
				<input class="field-input" type="password" bind:value={confirmPassword} autocomplete="new-password" />
			</label>

			<div class="card-actions display-f justify-content-flex-end">
				<button class="btn btn--primary cursor-pointer" type="submit">Promijeni lozinku</button>
			</div>
		</form>
	</div>
</section>

<style>
	.profile {
		max-width: 56rem;
	}
	.profile-head {
		/* layout via utility classes (display-f align-items-center gap-1) */
		margin-bottom: 1.75rem;
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
	.profile-role {
		text-transform: capitalize;
	}

	/* grid via utility classes (grid-cols-2 gap-1-5 align-items-start); the
	   single-column stack below the breakpoint stays scoped. */
	.profile-grid {
		display: grid;
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
	.field-input:disabled {
		background: #f3f5f8;
		color: #5b6577;
		cursor: not-allowed;
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

	@media (max-width: 720px) {
		.profile-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

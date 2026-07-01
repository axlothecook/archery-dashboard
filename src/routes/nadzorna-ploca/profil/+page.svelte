<script lang="ts">
	// Admin profile settings. Opened from the top-bar user chip. Shows the signed-in
	// admin's info as editable inputs (display name, real name, email, phone) plus a
	// change-password section; role is read-only (admins don't self-change role).
	// Placeholder data + no backend save yet — wire to PATCH /profile on adoption.
	import { currentAdmin } from '$lib/currentAdmin';
	import { showToast } from '$lib/toasts';
	import Avatar from '$lib/components/Avatar.svelte';

	// Local editable copy of the profile (seeded from the placeholder).
	let displayName = $state(currentAdmin.displayName);
	let realName = $state(currentAdmin.realName);
	let email = $state(currentAdmin.email);
	let phone = $state(currentAdmin.phone);

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	function saveProfile(e: SubmitEvent) {
		e.preventDefault();
		// TODO(adoption): PATCH /profile with the changed fields.
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
	<header class="profile-head">
		<Avatar color={currentAdmin.color} role={currentAdmin.role} size={4} fontSize={2} />
		<div class="profile-id">
			<h2 class="profile-name">{displayName}</h2>
			<p class="profile-sub">{realName} · <span class="profile-role">{currentAdmin.role}</span></p>
		</div>
	</header>

	<div class="profile-grid">
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

			<div class="card-actions">
				<button class="btn btn--primary" type="submit">Spremi promjene</button>
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

			<div class="card-actions">
				<button class="btn btn--primary" type="submit">Promijeni lozinku</button>
			</div>
		</form>
	</div>
</section>

<style>
	.profile {
		max-width: 56rem;
	}
	.profile-head {
		display: flex;
		align-items: center;
		gap: 1rem;
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

	.profile-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		align-items: start;
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
		display: flex;
		justify-content: flex-end;
		margin-top: 0.5rem;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		border-radius: 8px;
		font-size: 0.92rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
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

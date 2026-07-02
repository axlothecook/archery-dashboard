<script lang="ts">
	// Administracija (items 24/22): manage the people who work on the website. Lists
	// each member (name + role) and lets an admin CREATE or DELETE admins/developers.
	// Both actions confirm first. Placeholder data via the shared team store — no
	// backend yet (TODO(adoption): POST/DELETE /admin/team).
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { team, getCurrentAdmin, addMember, removeMember } from '$lib/teamStore.svelte';
	import { roleLabel, type Member } from '$lib/team';
	import Avatar from '$lib/components/Avatar.svelte';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';

	let confirmDlg = $state<ConfirmDialog>();

	// Only an admin may manage accounts; developers see it read-only.
	const canManage = $derived(getCurrentAdmin().role === 'admin');

	const roleOptions = [
		{ value: 'admin', label: roleLabel('admin') },
		{ value: 'developer', label: roleLabel('developer') }
	];

	// ── Add-member modal ─────────────────────────────────────────────────────────
	let modalOpen = $state(false);
	let fDisplayName = $state('');
	let fRealName = $state('');
	let fEmail = $state('');
	let fPhone = $state('');
	let fRole = $state<string>('admin');
	// Same show/hide animation as the "Dodaj zadatak" modal.
	const anim = { duration: 150, start: 0.97, opacity: 0, easing: cubicOut };

	function openAdd() {
		fDisplayName = '';
		fRealName = '';
		fEmail = '';
		fPhone = '';
		fRole = 'admin';
		modalOpen = true;
	}
	async function submitAdd(e: SubmitEvent) {
		e.preventDefault();
		if (!fDisplayName.trim()) return;
		const role = fRole as Member['role'];
		const ok = await confirmDlg?.ask(
			`Upravo ćete dodati ${roleLabel(role)}. Jeste li sigurni da želite nastaviti?`
		);
		if (!ok) return;
		addMember({
			displayName: fDisplayName,
			realName: fRealName || fDisplayName,
			role,
			email: fEmail,
			phone: fPhone
		});
		modalOpen = false;
	}
	async function del(m: Member) {
		const ok = await confirmDlg?.ask(
			`Upravo ćete izbrisati ${roleLabel(m.role)}. Jeste li sigurni da želite nastaviti?`
		);
		if (ok) removeMember(m.id);
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') modalOpen = false;
	}
</script>

<svelte:window onkeydown={onKey} />
<svelte:head><title>Administracija · VSK</title></svelte:head>

<section class="admin-mgmt">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div>
			<h2 class="mgmt-title">Administracija</h2>
			<p class="mgmt-sub">Osobe koje rade na stranici. Dodajte ili uklonite administratore i razvojne programere.</p>
		</div>
		{#if canManage}
			<button class="btn-add cursor-pointer display-f align-items-center gap-0-4" type="button" onclick={openAdd}>
				<AddIcon size={18} />
				Dodaj člana
			</button>
		{/if}
	</div>

	<div class="panel bg-white column-nowrap gap-0-8">
		{#each team as m (m.id)}
			<div class="member-row display-f align-items-center gap-1">
				<Avatar color={m.color} role={m.role} size={2.6} />
				<div class="member-info column-nowrap">
					<span class="member-name fw-600">{m.displayName}</span>
					<span class="member-role">{roleLabel(m.role)}</span>
				</div>
				<span class="member-contact column-nowrap">
					<span class="member-email">{m.email}</span>
					<span class="member-phone">{m.phone}</span>
				</span>
				{#if canManage}
					<button class="row-del cursor-pointer display-f" type="button" aria-label="Izbriši" title="Izbriši" onclick={() => del(m)}>
						<TrashIcon size={20} />
					</button>
				{/if}
			</div>
		{/each}
	</div>
</section>

{#if modalOpen}
	<div class="modal-backdrop position-fixed" role="presentation" onclick={() => (modalOpen = false)}></div>
	<div class="modal position-fixed br-lg" role="dialog" aria-modal="true" aria-label="Dodaj člana" transition:scale={anim}>
		<header class="modal-head display-f align-items-center justify-content-space-between">
			<h3 class="modal-title">Dodaj člana</h3>
			<button class="modal-close cursor-pointer br-full display-f align-items-center justify-content-center" type="button" aria-label="Zatvori" onclick={() => (modalOpen = false)}>
				<CloseIcon size={22} />
			</button>
		</header>
		<form class="modal-form column-nowrap gap-1" onsubmit={submitAdd}>
			<label class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Korisničko ime</span>
				<input class="field-input w-full br-xs" type="text" bind:value={fDisplayName} required />
			</label>
			<label class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Ime i prezime</span>
				<input class="field-input w-full br-xs" type="text" bind:value={fRealName} />
			</label>
			<label class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Email</span>
				<input class="field-input w-full br-xs" type="email" bind:value={fEmail} />
			</label>
			<label class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Telefon</span>
				<input class="field-input w-full br-xs" type="tel" bind:value={fPhone} />
			</label>
			<div class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Uloga</span>
				<DashSelect options={roleOptions} bind:value={fRole} ariaLabel="Uloga" />
			</div>
			<div class="modal-actions display-f justify-content-flex-end gap-0-5">
				<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" onclick={() => (modalOpen = false)}>Odustani</button>
				<button class="btn btn--primary cursor-pointer br-xs fw-600" type="submit">Dodaj</button>
			</div>
		</form>
	</div>
{/if}

<ConfirmDialog bind:this={confirmDlg} />

<style>
	.admin-mgmt {
		max-width: 56rem;
	}
	.mgmt-head {
		margin-bottom: 1.5rem;
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
	.btn-add {
		padding: 0.5rem 0.9rem;
		border: 0;
		border-radius: 8px;
		background: #102e66;
		color: #fff;
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
	}
	.btn-add:hover {
		background: #0c2350;
	}

	.panel {
		border-radius: 14px;
		padding: 1.25rem 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}
	.member-row {
		padding: 0.6rem 0;
	}
	.member-row + .member-row {
		border-top: 1px solid #f3f5f8;
	}
	.member-info {
		line-height: 1.3;
		flex: 1 1 auto;
		min-width: 0;
	}
	.member-name {
		font-size: 1rem;
		color: #102e66;
	}
	.member-role {
		font-size: 0.85rem;
		color: #9aa3b2;
	}
	.member-contact {
		line-height: 1.3;
		text-align: right;
		flex: 0 0 auto;
	}
	.member-email {
		font-size: 0.88rem;
		color: #102e66;
	}
	.member-phone {
		font-size: 0.82rem;
		color: #5b6577;
	}
	.row-del {
		align-items: center;
		padding: 0.35rem;
		border: 0;
		background: none;
		color: #5b6577;
		flex: 0 0 auto;
		transition: color 0.15s ease;
	}
	.row-del:hover {
		color: #d32752;
	}

	/* ── Modal ── */
	.modal-backdrop {
		inset: 0;
		background: rgba(16, 46, 102, 0.28);
		z-index: 80;
	}
	.modal {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 30rem;
		max-width: calc(100vw - 2rem);
		padding: 1.5rem;
		background: #fff;
		box-shadow: 0 12px 40px rgba(16, 46, 102, 0.25);
		z-index: 81;
	}
	.modal-head {
		margin-bottom: 1.1rem;
	}
	.modal-title {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
		color: #102e66;
	}
	.modal-close {
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		background: none;
		color: #5b6577;
	}
	.modal-close:hover {
		background: #eef1f3;
	}
	.field-label {
		font-size: 0.85rem;
		color: #5b6577;
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
	.modal-actions {
		margin-top: 0.5rem;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		font-size: 0.9rem;
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
	.btn--ghost {
		background: #fff;
		color: #102e66; /* same navy as the confirm button's bg */
		border-color: #d7dee8;
	}
	.btn--ghost:hover {
		background: #eef1f3;
	}
</style>

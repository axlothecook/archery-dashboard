<script lang="ts">
	// Sponsors list table for Sponzori → Svi sponzori. Columns: logo, name, website,
	// description (truncated), edit + delete. Real data from GET /admin/sponsors.
	// Mirrors ArticleTable/EventTable.
	import { goto } from '$app/navigation';
	import { deleteSponsor, type SponsorAdminRow } from '$lib/sponsors';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import TextSizeIcon from '$lib/components/icons/TextSizeIcon.svelte';
	import HandshakeIcon from '$lib/components/icons/HandshakeIcon.svelte';

	let {
		sponsors = $bindable(),
		emptyText,
		onDeleted
	}: {
		sponsors: SponsorAdminRow[];
		emptyText: string;
		onDeleted?: (id: string) => void;
	} = $props();

	let confirmDlg = $state<ConfirmDialog>();
	let error = $state('');

	function edit(s: SponsorAdminRow) {
		goto(`/nadzorna-ploca/sponzori/uredi/${s.id}`);
	}

	async function remove(s: SponsorAdminRow) {
		const ok = await confirmDlg?.ask(`Izbrisati sponzora „${s.name}”? Ova radnja je trajna.`, 'Obriši');
		if (!ok) return;
		try {
			await deleteSponsor(s.id);
			if (onDeleted) onDeleted(s.id);
			else sponsors = sponsors.filter((x) => x.id !== s.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Brisanje nije uspjelo.';
		}
	}
</script>

{#if error}
	<p class="sp-error" role="alert">{error}</p>
{/if}

{#if sponsors.length === 0}
	<p class="sp-empty">{emptyText}</p>
{:else}
	<table class="sp-table w-full">
		<thead>
			<tr>
				<th class="sp-col-logo-head" colspan="2">
					<span class="th-in display-f align-items-center gap-0-4"><HandshakeIcon size={18} />Sponzor</span>
				</th>
				<th>
					<span class="th-in display-f align-items-center gap-0-4"><TextSizeIcon size={18} />Opis</span>
				</th>
				<th class="sp-th-actions"></th>
			</tr>
		</thead>
		<tbody>
			{#each sponsors as s (s.id)}
				<tr>
					<td class="sp-logo-cell">
						{#if s.logoUrl}
							<img class="sp-logo" src={s.logoUrl} alt={s.logoAlt} loading="lazy" />
						{:else}
							<span class="sp-logo sp-logo--empty" aria-hidden="true"></span>
						{/if}
					</td>
					<td class="sp-name-cell">
						<span class="sp-name fw-600">{s.name}</span>
						{#if s.website}
							<a class="sp-web" href={s.website} target="_blank" rel="noopener">{s.website}</a>
						{/if}
					</td>
					<td class="sp-desc text-jet-grey">{s.description}</td>
					<td class="sp-actions-cell">
						<div class="sp-actions display-f align-items-center">
							<button class="sp-act cursor-pointer display-f" type="button" aria-label="Uredi" title="Uredi" onclick={() => edit(s)}>
								<EditIcon size={18} />
							</button>
							<button class="sp-act sp-act--del cursor-pointer display-f" type="button" aria-label="Izbriši" title="Izbriši" onclick={() => remove(s)}>
								<TrashIcon size={18} />
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<ConfirmDialog bind:this={confirmDlg} />

<style>
	.sp-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.sp-empty {
		margin: 0;
		padding: 2rem 0;
		text-align: center;
		color: #9aa3b2;
		font-size: 0.95rem;
	}
	.sp-table {
		border-collapse: collapse;
		font-size: 1rem;
	}
	.sp-table th {
		text-align: left;
		padding: 0.65rem 0.75rem;
		font-size: 0.95rem;
		font-weight: 700;
		color: #1b1b1b;
		border-bottom: 1px solid #eef1f3;
		white-space: nowrap;
	}
	.sp-table td {
		padding: 0.7rem 0.75rem;
		color: #102e66;
		border-bottom: 1px solid #f3f5f8;
		vertical-align: middle;
	}
	.sp-logo-cell {
		width: 1%;
		padding-right: 0.5rem;
	}
	.sp-logo {
		display: block;
		width: 3.6rem;
		height: 2.4rem;
		object-fit: contain;
		border-radius: 6px;
		background: #f7f8fa;
	}
	.sp-logo--empty {
		width: 3.6rem;
		height: 2.4rem;
	}
	.sp-name-cell {
		white-space: nowrap;
	}
	.sp-name {
		display: block;
	}
	.sp-web {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.82rem;
		color: #187ff5;
		text-decoration: none;
		max-width: 18rem;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sp-web:hover {
		text-decoration: underline;
	}
	/* Description fills the remaining width; a single line that ellipsises. */
	.sp-table :is(th, td):nth-child(3) {
		width: 100%;
	}
	.sp-desc {
		max-width: 40rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sp-actions-cell {
		width: 1%;
	}
	.sp-actions {
		gap: 0.75rem;
	}
	.sp-act {
		align-items: center;
		border: 0;
		background: none;
		padding: 0.3rem;
		color: #5b6577;
		transition: color 0.15s ease;
	}
	.sp-act:hover {
		color: #187ff5;
	}
	.sp-act--del:hover {
		color: #d32752;
	}
</style>

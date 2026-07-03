<script lang="ts">
	// Events list table for Raspored → Svi događaji. Columns: name, discipline badge,
	// date range, level (colour dot + name), attendees, status flags, edit + delete.
	// Real data from GET /admin/events. Mirrors ArticleTable.
	import { goto } from '$app/navigation';
	import { DISCIPLINE_LABEL, deleteEvent, type EventAdminRow } from '$lib/events';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let {
		events,
		emptyText,
		onDeleted
	}: {
		events: EventAdminRow[];
		emptyText: string;
		onDeleted?: (id: string) => void;
	} = $props();

	let confirmDlg = $state<ConfirmDialog>();
	let error = $state('');

	function fmtDay(iso: string): string {
		const d = new Date(iso);
		return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}.`;
	}
	// "4.7.2026." or "4.7.2026. – 5.7.2026." for a range.
	function fmtRange(from: string, to: string | null): string {
		return to && to !== from ? `${fmtDay(from)} – ${fmtDay(to)}` : fmtDay(from);
	}

	function edit(e: EventAdminRow) {
		goto(`/nadzorna-ploca/raspored/uredi/${e.id}`);
	}

	async function remove(e: EventAdminRow) {
		const ok = await confirmDlg?.ask(`Izbrisati događaj „${e.name}”? Ova radnja je trajna.`, 'Obriši');
		if (!ok) return;
		try {
			await deleteEvent(e.id);
			if (onDeleted) onDeleted(e.id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Brisanje nije uspjelo.';
		}
	}
</script>

{#if error}
	<p class="ev-error" role="alert">{error}</p>
{/if}

{#if events.length === 0}
	<p class="ev-empty">{emptyText}</p>
{:else}
	<table class="ev-table w-full">
		<thead>
			<tr>
				<th>Naziv</th>
				<th>Disciplina</th>
				<th>Datum</th>
				<th>Razina</th>
				<th>Sudionici</th>
				<th>Stanje</th>
				<th class="ev-th-actions"></th>
			</tr>
		</thead>
		<tbody>
			{#each events as e (e.id)}
				<tr class:cancelled={e.isCancelled}>
					<td class="ev-name fw-600">{e.name}</td>
					<td><span class="ev-badge">{DISCIPLINE_LABEL[e.discipline]}</span></td>
					<td class="ev-date text-jet-grey">{fmtRange(e.dateFrom, e.dateTo)}</td>
					<td>
						{#if e.level}
							<span class="ev-level display-f align-items-center gap-0-4">
								<span class="ev-dot" style="background:{e.level.color}"></span>
								{e.level.name}
							</span>
						{:else}
							<span class="text-jet-grey">—</span>
						{/if}
					</td>
					<td class="ev-att text-jet-grey">
						{e.attendeeCount}{e.hasUnlistedClubAttendee ? '+' : ''}
					</td>
					<td class="ev-flags">
						{#if e.isCancelled}<span class="ev-flag ev-flag--cancelled">Otkazano</span>{/if}
						{#if e.hidden}<span class="ev-flag ev-flag--hidden">Skriveno</span>{/if}
						{#if !e.isCancelled && !e.hidden}<span class="text-jet-grey">—</span>{/if}
					</td>
					<td class="ev-actions-cell">
						<div class="ev-actions display-f align-items-center">
							<button class="ev-act cursor-pointer display-f" type="button" aria-label="Uredi" title="Uredi" onclick={() => edit(e)}>
								<EditIcon size={18} />
							</button>
							<button class="ev-act ev-act--del cursor-pointer display-f" type="button" aria-label="Izbriši" title="Izbriši" onclick={() => remove(e)}>
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
	.ev-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.ev-empty {
		margin: 0;
		padding: 2rem 0;
		text-align: center;
		color: #9aa3b2;
		font-size: 0.95rem;
	}
	.ev-table {
		border-collapse: collapse;
		font-size: 1rem;
	}
	.ev-table th {
		text-align: left;
		padding: 0.65rem 0.75rem;
		font-size: 0.95rem;
		font-weight: 700;
		color: #1b1b1b;
		border-bottom: 1px solid #eef1f3;
		white-space: nowrap;
	}
	.ev-table td {
		padding: 0.7rem 0.75rem;
		color: #102e66;
		border-bottom: 1px solid #f3f5f8;
		vertical-align: middle;
	}
	tr.cancelled .ev-name {
		text-decoration: line-through;
		color: #9aa3b2;
	}
	.ev-name {
		max-width: 20rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ev-badge {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		background: #eef2fb;
		color: #1b3a7a;
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.ev-date {
		white-space: nowrap;
	}
	.ev-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex: 0 0 auto;
		display: inline-block;
	}
	.ev-att {
		text-align: center;
	}
	.ev-flags {
		white-space: nowrap;
	}
	.ev-flag {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 600;
		margin-right: 0.3rem;
	}
	.ev-flag--cancelled {
		background: #fde7ec;
		color: #a4133c;
	}
	.ev-flag--hidden {
		background: #f1f3f7;
		color: #5b6577;
	}
	.ev-actions-cell {
		width: 1%;
	}
	.ev-actions {
		gap: 0.25rem;
	}
	.ev-act {
		align-items: center;
		border: 0;
		background: none;
		padding: 0.3rem;
		color: #5b6577;
		transition: color 0.15s ease;
	}
	.ev-act:hover {
		color: #187ff5;
	}
	.ev-act--del:hover {
		color: #d32752;
	}
</style>

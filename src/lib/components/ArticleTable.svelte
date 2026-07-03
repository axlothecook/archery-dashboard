<script lang="ts">
	// Reusable article LIST table for the Vijesti section (Objavljene vijesti +
	// Nacrti share it — same columns, different rows). Columns: poster thumbnail,
	// title, media-type badge, date, status/flags, edit + delete. Real data from
	// GET /admin/articles. Delete confirms via the shared ConfirmDialog.
	import { goto } from '$app/navigation';
	import { MEDIA_TYPE_LABEL, deleteArticle, type ArticleAdminRow } from '$lib/articles';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let {
		articles = $bindable(),
		emptyText,
		onDeleted
	}: {
		articles: ArticleAdminRow[];
		emptyText: string;
		// When the parent owns the master list (e.g. a filtered view), it passes
		// onDeleted and we call it instead of mutating our (derived, read-only) prop.
		onDeleted?: (id: string) => void;
	} = $props();

	let confirmDlg = $state<ConfirmDialog>();
	let error = $state('');

	// dd.mm.yyyy. from an ISO date, or "—" when unset (drafts have no publishedAt).
	function fmtDate(iso: string | null): string {
		if (!iso) return '—';
		const d = new Date(iso);
		return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}.`;
	}

	function edit(a: ArticleAdminRow) {
		// Edit routes to the create/edit form keyed by id (form not built for edit yet;
		// the route will 404 until wired — placeholder, matches the section rollout).
		goto(`/nadzorna-ploca/vijesti/uredi/${a.id}`);
	}

	async function remove(a: ArticleAdminRow) {
		const ok = await confirmDlg?.ask(`Izbrisati članak „${a.title}”? Ova radnja je trajna.`, 'Obriši');
		if (!ok) return;
		try {
			await deleteArticle(a.id);
			if (onDeleted) onDeleted(a.id);
			else articles = articles.filter((x) => x.id !== a.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Brisanje nije uspjelo.';
		}
	}
</script>

{#if error}
	<p class="art-error" role="alert">{error}</p>
{/if}

{#if articles.length === 0}
	<p class="art-empty">{emptyText}</p>
{:else}
	<table class="art-table w-full">
		<thead>
			<tr>
				<th class="art-th-poster"></th>
				<th>Naslov</th>
				<th>Vrsta</th>
				<th>Datum</th>
				<th>Stanje</th>
				<th class="art-th-actions"></th>
			</tr>
		</thead>
		<tbody>
			{#each articles as a (a.id)}
				<tr>
					<td class="art-poster-cell">
						{#if a.posterImage.url}
							<img class="art-poster" src={a.posterImage.url} alt={a.posterImage.alt} loading="lazy" />
						{:else}
							<span class="art-poster art-poster--empty" aria-hidden="true"></span>
						{/if}
					</td>
					<td class="art-title fw-600">{a.title}</td>
					<td>
						<span class="art-badge">{MEDIA_TYPE_LABEL[a.mediaType]}</span>
					</td>
					<td class="art-date text-jet-grey">{fmtDate(a.publishedAt)}</td>
					<td class="art-flags">
						<!-- The list is already status-scoped (Objavljene = published, Nacrti =
						     draft), so the only per-row state worth flagging is "hidden". -->
						{#if a.hidden}
							<span class="art-flag art-flag--hidden">Skriveno</span>
						{:else}
							<span class="text-jet-grey">—</span>
						{/if}
					</td>
					<td class="art-actions-cell">
						<div class="art-actions display-f align-items-center">
							<button class="art-act cursor-pointer display-f" type="button" aria-label="Uredi" title="Uredi" onclick={() => edit(a)}>
								<EditIcon size={18} />
							</button>
							<button class="art-act art-act--del cursor-pointer display-f" type="button" aria-label="Izbriši" title="Izbriši" onclick={() => remove(a)}>
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
	.art-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.art-empty {
		margin: 0;
		padding: 2rem 0;
		text-align: center;
		color: #9aa3b2;
		font-size: 0.95rem;
	}
	.art-table {
		border-collapse: collapse;
		font-size: 1rem;
	}
	.art-table th {
		text-align: left;
		padding: 0.65rem 0.75rem;
		font-size: 0.95rem;
		font-weight: 700;
		color: #1b1b1b;
		border-bottom: 1px solid #eef1f3;
		white-space: nowrap;
	}
	.art-table td {
		padding: 0.7rem 0.75rem;
		color: #102e66;
		border-bottom: 1px solid #f3f5f8;
		vertical-align: middle;
	}
	.art-th-poster,
	.art-poster-cell {
		width: 1%;
		padding-right: 0.5rem;
	}
	.art-poster {
		display: block;
		width: 3.4rem;
		height: 2.1rem;
		object-fit: cover;
		border-radius: 6px;
		background: #eef1f3;
	}
	.art-poster--empty {
		width: 3.4rem;
		height: 2.1rem;
	}
	.art-title {
		max-width: 22rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.art-badge {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		background: #eef2fb;
		color: #1b3a7a;
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.art-date {
		white-space: nowrap;
	}
	.art-flags {
		white-space: nowrap;
	}
	.art-flag {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 600;
		margin-right: 0.3rem;
	}
	.art-flag--hidden {
		background: #f1f3f7;
		color: #5b6577;
	}
	.art-actions-cell {
		width: 1%;
	}
	.art-actions {
		gap: 0.25rem;
	}
	.art-act {
		align-items: center;
		border: 0;
		background: none;
		padding: 0.3rem;
		color: #5b6577;
		transition: color 0.15s ease;
	}
	.art-act:hover {
		color: #187ff5;
	}
	.art-act--del:hover {
		color: #d32752;
	}
</style>

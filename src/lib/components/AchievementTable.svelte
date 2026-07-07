<script lang="ts">
	// Achievements list table for Postignuća → Sva postignuća. Columns: image, title,
	// year, type, level, medal, credited archers, edit + delete. Real data from
	// GET /admin/achievements. Mirrors ArticleTable/EventTable.
	import { goto } from '$app/navigation';
	import {
		deleteAchievement,
		TYPE_LABEL,
		LEVEL_LABEL,
		MEDAL_LABEL,
		type AchievementAdminRow
	} from '$lib/achievements';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import TextSizeIcon from '$lib/components/icons/TextSizeIcon.svelte';
	import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import LevelsIcon from '$lib/components/icons/LevelsIcon.svelte';
	import TrophyIcon from '$lib/components/icons/TrophyIcon.svelte';
	import PeopleIcon from '$lib/components/icons/PeopleIcon.svelte';

	let {
		achievements = $bindable(),
		emptyText,
		onDeleted
	}: {
		achievements: AchievementAdminRow[];
		emptyText: string;
		onDeleted?: (id: string) => void;
	} = $props();

	let confirmDlg = $state<ConfirmDialog>();
	let error = $state('');

	function edit(a: AchievementAdminRow) {
		goto(`/nadzorna-ploca/postignuca/uredi/${a.id}`);
	}

	async function remove(a: AchievementAdminRow) {
		const ok = await confirmDlg?.ask(`Izbrisati postignuće „${a.title}”? Ova radnja je trajna.`, 'Obriši');
		if (!ok) return;
		try {
			await deleteAchievement(a.id);
			if (onDeleted) onDeleted(a.id);
			else achievements = achievements.filter((x) => x.id !== a.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Brisanje nije uspjelo.';
		}
	}
</script>

{#if error}
	<p class="ac-error" role="alert">{error}</p>
{/if}

{#if achievements.length === 0}
	<p class="ac-empty">{emptyText}</p>
{:else}
	<table class="ac-table w-full">
		<thead>
			<tr>
				<th class="ac-col-title-head" colspan="2">
					<span class="th-in display-f align-items-center gap-0-4"><TextSizeIcon size={18} />Naslov</span>
				</th>
				<th><span class="th-in display-f align-items-center gap-0-4"><ClockIcon size={18} />Godina</span></th>
				<th><span class="th-in display-f align-items-center gap-0-4"><CategoryIcon size={18} />Vrsta</span></th>
				<th><span class="th-in display-f align-items-center gap-0-4"><LevelsIcon size={18} />Razina</span></th>
				<th><span class="th-in display-f align-items-center gap-0-4"><TrophyIcon size={18} />Medalja</span></th>
				<th><span class="th-in display-f align-items-center gap-0-4"><PeopleIcon size={18} />Strijelci</span></th>
				<th class="ac-th-actions"></th>
				<th class="ac-col-spacer"></th>
			</tr>
		</thead>
		<tbody>
			{#each achievements as a (a.id)}
				<tr>
					<td class="ac-img-cell">
						{#if a.image}
							<img class="ac-img" src={a.image.url} alt={a.image.alt} loading="lazy" />
						{:else}
							<span class="ac-img ac-img--empty" aria-hidden="true"></span>
						{/if}
					</td>
					<td class="ac-title fw-600">{a.title}</td>
					<td class="ac-year text-jet-grey">{a.year}.</td>
					<td><span class="ac-badge">{TYPE_LABEL[a.type]}</span></td>
					<td class="text-jet-grey">{LEVEL_LABEL[a.level]}</td>
					<td>
						{#if a.medal}
							<span class="ac-medal ac-medal--{a.medal}">{MEDAL_LABEL[a.medal]}</span>
						{:else}
							<span class="text-jet-grey">—</span>
						{/if}
					</td>
					<td class="ac-archers text-jet-grey">{a.archerNames.length ? a.archerNames.join(', ') : '—'}</td>
					<td class="ac-actions-cell">
						<div class="ac-actions display-f align-items-center">
							<button class="ac-act cursor-pointer display-f" type="button" aria-label="Uredi" title="Uredi" onclick={() => edit(a)}>
								<EditIcon size={18} />
							</button>
							<button class="ac-act ac-act--del cursor-pointer display-f" type="button" aria-label="Izbriši" title="Izbriši" onclick={() => remove(a)}>
								<TrashIcon size={18} />
							</button>
						</div>
					</td>
					<td class="ac-col-spacer"></td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<ConfirmDialog bind:this={confirmDlg} />

<style>
	.ac-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.ac-empty {
		margin: 0;
		padding: 2rem 0;
		text-align: center;
		color: #9aa3b2;
		font-size: 0.95rem;
	}
	.ac-table {
		border-collapse: collapse;
		font-size: 1rem;
	}
	.ac-table th {
		text-align: left;
		padding: 0.65rem 0.75rem;
		font-size: 0.95rem;
		font-weight: 700;
		color: #1b1b1b;
		border-bottom: 1px solid #eef1f3;
		white-space: nowrap;
	}
	.ac-table td {
		padding: 0.7rem 0.75rem;
		color: #102e66;
		border-bottom: 1px solid #f3f5f8;
		vertical-align: middle;
	}
	.ac-img-cell {
		width: 1%;
		padding-right: 0.5rem;
	}
	.ac-img {
		display: block;
		width: 2.6rem;
		height: 2.6rem;
		object-fit: contain;
		border-radius: 6px;
		background: #f7f8fa;
	}
	.ac-img--empty {
		width: 2.6rem;
		height: 2.6rem;
	}
	/* Title is a FIXED width; the trailing spacer (below) absorbs all leftover width, so
	   the right-side columns stay TIGHT to the title instead of spreading to the far right
	   (and a gap is kept before the scrollbar — mirrors Svi događaji). */
	.ac-table :is(th, td).ac-title {
		width: 26rem;
		max-width: 26rem;
	}
	.ac-title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	/* Slightly wider, EQUAL gap between the right-side columns (Godina … actions): each
	   carries the same left padding = the gap before it. Columns 3–8 (after img+title). */
	.ac-table :is(th, td):nth-child(n + 3):nth-child(-n + 8) {
		padding-left: 1.6rem;
	}
	.ac-year,
	.ac-archers {
		white-space: nowrap;
	}
	.ac-archers {
		max-width: 16rem;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	/* Trailing spacer: eats all slack so the real columns sit LEFT (tight to the title),
	   and keeps a gap between the last column and the scrollbar (matches Svi događaji). */
	.ac-table :is(th, td).ac-col-spacer {
		width: auto;
		min-width: 1.25rem;
		padding: 0;
		border-bottom: 0;
	}
	/* Vrsta + Medalja pills: match the Svi događaji pills (same min-width, centred text,
	   padding) so they read as one uniform pill size. */
	.ac-badge {
		display: inline-block;
		min-width: 6.5rem;
		text-align: center;
		padding: 0.55rem 0.4rem;
		border-radius: 999px;
		background: #eef2fb;
		color: #1b3a7a;
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.ac-medal {
		display: inline-block;
		min-width: 6.5rem;
		text-align: center;
		padding: 0.55rem 0.4rem;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.ac-medal--gold {
		background: #fbf0c9;
		color: #8a6d00;
	}
	.ac-medal--silver {
		background: #eceef1;
		color: #5b6577;
	}
	.ac-medal--bronze {
		background: #f6e2d2;
		color: #8a4b1e;
	}
	.ac-actions {
		gap: 1rem;
	}
	.ac-act {
		align-items: center;
		border: 0;
		background: none;
		padding: 0.3rem;
		color: #5b6577;
		transition: color 0.15s ease;
	}
	.ac-act:hover {
		color: #187ff5;
	}
	.ac-act--del:hover {
		color: #d32752;
	}
</style>

<script lang="ts">
	// Achievements list table for Postignuća → Sva postignuća. Columns: image, title,
	// year, type (coloured pill), level (colour dot + name), credited archers, edit +
	// delete. Real data from GET /admin/achievements. Mirrors ArticleTable/EventTable.
	import { goto } from '$app/navigation';
	import {
		deleteAchievement,
		TYPE_LABEL,
		LEVEL_LABEL,
		type AchievementLevel,
		type AchievementAdminRow
	} from '$lib/achievements';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import TextSizeIcon from '$lib/components/icons/TextSizeIcon.svelte';
	import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import LevelsIcon from '$lib/components/icons/LevelsIcon.svelte';
	import PeopleIcon from '$lib/components/icons/PeopleIcon.svelte';

	// Prestige-tier colour per level (mirrors the public site's world→european→state→other
	// ordering) → a coloured dot next to Razina, like the Svi događaji level dot.
	const LEVEL_COLOR: Record<AchievementLevel, string> = {
		world: '#e0a400', // gold — global
		european: '#187ff5', // blue — continental
		state: '#d32752', // red — national
		other: '#9aa3b2' // grey — other
	};

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
					<td><span class="ac-badge ac-badge--{a.type}">{TYPE_LABEL[a.type]}</span></td>
					<td>
						<span class="ac-level display-f align-items-center gap-0-4">
							<span class="ac-dot" style="background:{LEVEL_COLOR[a.level]}"></span>
							{LEVEL_LABEL[a.level]}
						</span>
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

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	// Library palette colours (exact matches).
	$navy: map.get(lib.$colors, 'deep-sapphire'); // #102e66
	$blue: map.get(lib.$colors, 'blue-dress'); // #187ff5
	$red: map.get(lib.$colors, 'error-secondary'); // #d32752
	$border: map.get(lib.$colors, 'seashell'); // #eef1f3

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
		border-bottom: 1px solid $border;
		white-space: nowrap;
	}
	.ac-table td {
		padding: 0.7rem 0.75rem;
		color: $navy;
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
	/* Title takes ALL the slack (100% width) so the right-side columns are pushed RIGHT,
	   sitting close to the actions (pen/trash) instead of tight to the title. */
	.ac-table :is(th, td).ac-title {
		width: 100%;
	}
	.ac-title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 34rem;
	}
	/* Slightly wider, EQUAL gap between the right-side columns (Godina … actions): each
	   carries the same left padding = the gap before it. Columns 3–7 (after img+title). */
	.ac-table :is(th, td):nth-child(n + 3):nth-child(-n + 7) {
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
	/* Trailing spacer: a small fixed gap between the actions and the scrollbar (the title
	   column now eats the slack, so this just keeps the last column off the scrollbar). */
	.ac-table :is(th, td).ac-col-spacer {
		width: 1.25rem;
		min-width: 1.25rem;
		padding: 0;
		border-bottom: 0;
	}
	/* Vrsta pill: same size as the Svi događaji pills, coloured by type so Naslov / Rekord
	   / Plasman read apart at a glance. */
	.ac-badge {
		display: inline-block;
		min-width: 6.5rem;
		text-align: center;
		padding: 0.55rem 0.4rem;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
		background: #eef2fb; /* fallback (Plasman): bluish */
		color: #1b3a7a;
	}
	.ac-badge--title {
		background: #fbf0c9; /* gold — a championship title */
		color: #8a6d00;
	}
	.ac-badge--record {
		background: #efe6fb; /* purple — a record */
		color: #5b2ea6;
	}
	.ac-badge--other {
		background: #eef2fb; /* blue — a placement (Plasman) */
		color: #1b3a7a;
	}
	/* Razina: a colour dot (prestige tier) + the level name, like the Svi događaji level. */
	.ac-level {
		white-space: nowrap;
	}
	.ac-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex: 0 0 auto;
		display: inline-block;
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
		color: $blue;
	}
	.ac-act--del:hover {
		color: $red;
	}
</style>

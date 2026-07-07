<script lang="ts">
	// Archer list table for Momčad → Svi streličari (+ Nacrti share it). Columns:
	// photo, name, roles, bow types, categories, status, VIEW + delete. The VIEW icon
	// (an eye, not a pen) opens the individual archer page, which is where editing
	// happens. Real data from GET /admin/archers. Mirrors SponsorTable/ArticleTable.
	import { goto } from '$app/navigation';
	import {
		deleteArcher,
		ROLE_LABEL,
		BOW_LABEL,
		type ArcherAdminRow
	} from '$lib/archers';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import LevelsIcon from '$lib/components/icons/LevelsIcon.svelte';
	import StatusIcon from '$lib/components/icons/StatusIcon.svelte';

	let {
		archers = $bindable(),
		emptyText,
		onDeleted
	}: {
		archers: ArcherAdminRow[];
		emptyText: string;
		onDeleted?: (id: string) => void;
	} = $props();

	let confirmDlg = $state<ConfirmDialog>();
	let error = $state('');

	// Add `.faded` when a (single-line, capped) cell overflows → fade the right edge to
	// transparent instead of an ellipsis. Mirrors the other admin tables.
	function fadeIfOverflow(node: HTMLElement, _text: string) {
		const check = () => node.classList.toggle('faded', node.scrollWidth > node.clientWidth + 1);
		check();
		const ro = new ResizeObserver(check);
		ro.observe(node);
		return { update: () => check(), destroy: () => ro.disconnect() };
	}

	// The VIEW action opens the individual archer page (read-only, with an Uredi
	// button there) — the requested "view, then edit" flow.
	function view(a: ArcherAdminRow) {
		goto(`/nadzorna-ploca/momcad/${a.id}`);
	}

	async function remove(a: ArcherAdminRow) {
		const ok = await confirmDlg?.ask(`Izbrisati streličara „${a.name}”? Ova radnja je trajna.`, 'Obriši');
		if (!ok) return;
		try {
			await deleteArcher(a.id);
			if (onDeleted) onDeleted(a.id);
			else archers = archers.filter((x) => x.id !== a.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Brisanje nije uspjelo.';
		}
	}

	const rolesText = (a: ArcherAdminRow) => a.roles.map((r) => ROLE_LABEL[r]).join(', ');
	const bowText = (a: ArcherAdminRow) =>
		a.bowType.length ? a.bowType.map((b) => BOW_LABEL[b].replace(/ \(.*\)$/, '')).join(', ') : '—';
	const catsText = (a: ArcherAdminRow) =>
		a.competitionCategories.length ? a.competitionCategories.join(', ') : '—';
</script>

{#if error}
	<p class="ar-error" role="alert">{error}</p>
{/if}

{#if archers.length === 0}
	<p class="ar-empty">{emptyText}</p>
{:else}
	<table class="ar-table w-full">
		<thead>
			<tr>
				<th class="ar-col-name-head">
					<span class="th-in display-f align-items-center gap-0-4"><PersonIcon size={18} />Streličar</span>
				</th>
				<th><span class="th-in display-f align-items-center gap-0-4"><PersonIcon size={18} />Uloga</span></th>
				<th><span class="th-in display-f align-items-center gap-0-4"><CategoryIcon size={18} />Luk</span></th>
				<th><span class="th-in display-f align-items-center gap-0-4"><LevelsIcon size={18} />Kategorije</span></th>
				<th><span class="th-in display-f align-items-center gap-0-4"><StatusIcon size={18} />Stanje</span></th>
				<th class="ar-th-actions"></th>
				<th class="ar-col-spacer"></th>
			</tr>
		</thead>
		<tbody>
			{#each archers as a (a.id)}
				<tr>
					<td class="ar-name-cell">
						<div class="ar-person display-f align-items-center">
							{#if a.cardPhoto}
								<img class="ar-img" src={a.cardPhoto.url} alt={a.cardPhoto.alt} loading="lazy" />
							{:else}
								<span class="ar-img ar-img--empty display-f align-items-center justify-content-center" aria-hidden="true">
									<PersonIcon size={20} />
								</span>
							{/if}
							<span class="ar-name fw-600" use:fadeIfOverflow={a.name}>{a.name}</span>
						</div>
					</td>
					<td class="ar-roles text-jet-grey" use:fadeIfOverflow={rolesText(a)}>{rolesText(a)}</td>
					<td class="ar-bow text-jet-grey" use:fadeIfOverflow={bowText(a)}>{bowText(a)}</td>
					<td class="ar-cats text-jet-grey" use:fadeIfOverflow={catsText(a)}>{catsText(a)}</td>
					<td class="ar-flags">
						{#if a.status === 'draft'}
							<span class="ar-state ar-state--draft">Nacrt</span>
						{:else if a.hidden}
							<span class="ar-state ar-state--hidden">Skriveno</span>
						{:else}
							<span class="ar-state ar-state--published">Objavljeno</span>
						{/if}
					</td>
					<td class="ar-actions-cell">
						<div class="ar-actions display-f align-items-center">
							<button class="ar-act cursor-pointer display-f" type="button" aria-label="Pregledaj" title="Pregledaj" onclick={() => view(a)}>
								<EyeIcon size={20} />
							</button>
							<button class="ar-act ar-act--del cursor-pointer display-f" type="button" aria-label="Izbriši" title="Izbriši" onclick={() => remove(a)}>
								<TrashIcon size={18} />
							</button>
						</div>
					</td>
					<td class="ar-col-spacer"></td>
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

	.ar-error {
		margin: 0 0 1rem;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.ar-empty {
		margin: 0;
		padding: 2rem 0;
		text-align: center;
		color: #9aa3b2;
		font-size: 0.95rem;
	}
	.ar-table {
		border-collapse: collapse;
		font-size: 1rem;
		table-layout: fixed;
	}
	.ar-table th {
		text-align: left;
		padding: 0.65rem 0.75rem;
		font-size: 0.95rem;
		font-weight: 700;
		color: #1b1b1b;
		border-bottom: 1px solid $border;
		white-space: nowrap;
	}
	.ar-table td {
		padding: 0.7rem 0.75rem;
		color: $navy;
		border-bottom: 1px solid #f3f5f8;
		vertical-align: middle;
	}
	/* Streličar cell = avatar + name in one flex row, so the name sits right next to
	   the photo (a fixed small gap) instead of across an empty image column. The cell
	   takes the slack (auto) so the right-side columns push toward the actions. */
	.ar-table :is(th, td).ar-name-cell {
		width: auto;
	}
	.ar-person {
		gap: 0.6rem;
		min-width: 0;
	}
	.ar-img {
		display: block;
		width: 2.8rem;
		height: 2.8rem;
		flex: 0 0 auto;
		object-fit: cover;
		border-radius: 50%;
		background: #f7f8fa;
	}
	.ar-img--empty {
		color: #9aa3b2;
		border: 1px solid #e3e7ee;
	}
	.ar-name {
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
	}
	.ar-table :is(th, td):nth-child(2) { width: 11rem; } /* Uloga */
	.ar-table :is(th, td):nth-child(3) { width: 12rem; } /* Luk */
	.ar-table :is(th, td):nth-child(4) { width: 13rem; } /* Kategorije */
	.ar-table :is(th, td):nth-child(5) { width: 9rem; } /* Stanje */
	.ar-table :is(th, td):nth-child(6) { width: 6rem; } /* actions */
	.ar-roles,
	.ar-bow,
	.ar-cats {
		white-space: nowrap;
		overflow: hidden;
	}
	/* Fade an overflowing cell's right edge to transparent (JS toggles `.faded`). */
	.ar-name:global(.faded),
	.ar-roles:global(.faded),
	.ar-bow:global(.faded),
	.ar-cats:global(.faded) {
		-webkit-mask-image: linear-gradient(to right, #000 82%, transparent 100%);
		mask-image: linear-gradient(to right, #000 82%, transparent 100%);
	}
	.ar-table :is(th, td).ar-col-spacer {
		width: 1.25rem;
		min-width: 1.25rem;
		padding: 0;
		border-bottom: 0;
	}
	/* Status pill — same size/shape as the events (.ev-state) pills. */
	.ar-state {
		display: inline-block;
		min-width: 6.5rem;
		text-align: center;
		padding: 0.55rem 0.4rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.ar-state--published {
		background: #d4f3df;
		color: #10683a;
	}
	.ar-state--hidden {
		background: #fdefc4;
		color: #7a5b00;
	}
	.ar-state--draft {
		background: #fde7d8;
		color: #8a4b1e;
	}
	.ar-actions-cell {
		width: 1%;
	}
	.ar-actions {
		gap: 1rem;
	}
	.ar-act {
		align-items: center;
		border: 0;
		background: none;
		padding: 0.3rem;
		color: #5b6577;
		transition: color 0.15s ease;
	}
	.ar-act:hover {
		color: $blue;
	}
	.ar-act--del:hover {
		color: $red;
	}
</style>

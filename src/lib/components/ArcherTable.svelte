<script lang="ts">
	// Archer list table for Momčad → Svi streličari (+ Nacrti share it). Columns:
	// photo, name, roles, bow types, categories, status, action + delete. The row's
	// primary action depends on `action`: 'view' (eye → the individual archer page,
	// used on Svi streličari) or 'edit' (pen → straight to the edit form, used on
	// Nacrti, since a draft has to be filled in before it can be published — drafts
	// aren't public so there's nothing to "view"). Real data from GET /admin/archers.
	import { goto } from '$app/navigation';
	import {
		deleteArcher,
		ROLE_LABEL,
		BOW_LABEL,
		type ArcherAdminRow
	} from '$lib/archers';
	import ViewIcon from '$lib/components/icons/ViewIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import LevelsIcon from '$lib/components/icons/LevelsIcon.svelte';
	import StatusIcon from '$lib/components/icons/StatusIcon.svelte';

	let {
		archers = $bindable(),
		emptyText,
		action = 'view',
		onDeleted
	}: {
		archers: ArcherAdminRow[];
		emptyText: string;
		/** Row's primary action: 'view' (eye → profile page) or 'edit' (pen → edit form). */
		action?: 'view' | 'edit';
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

	// VIEW opens the read-only profile page (Uredi lives there); EDIT jumps straight to
	// the edit form (used for drafts).
	function view(a: ArcherAdminRow) {
		goto(`/nadzorna-ploca/momcad/${a.id}`);
	}
	function edit(a: ArcherAdminRow) {
		goto(`/nadzorna-ploca/momcad/uredi/${a.id}`);
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
								<span class="ar-img ar-img--empty" aria-hidden="true">
									<PersonIcon size={26} />
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
							{#if action === 'edit'}
								<button class="ar-act cursor-pointer display-f" type="button" aria-label="Uredi" title="Uredi" onclick={() => edit(a)}>
									<EditIcon size={18} />
								</button>
							{:else}
								<button class="ar-act cursor-pointer display-f" type="button" aria-label="Pregledaj" title="Pregledaj" onclick={() => view(a)}>
									<ViewIcon size={20} />
								</button>
							{/if}
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
		/* Keep all columns at a readable size; below this the .ar-scroll wrapper scrolls
		   horizontally instead of collapsing the auto name column to just the avatar (which
		   made the "Streličar" header overlap "Uloga"). */
		min-width: 62rem;
	}
	.ar-table th {
		text-align: left;
		padding: 0.65rem 0.75rem;
		font-size: 1.05rem;
		font-weight: 700;
		color: #1b1b1b;
		border-bottom: 1px solid $border;
		white-space: nowrap;
		/* Sticky header: stays visible while the list scrolls vertically inside .ar-scroll.
		   Opaque white bg so rows don't show through; z-index over the cells. */
		position: sticky;
		top: 0;
		z-index: 1;
		background: #fff;
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
	/* Placeholder (draft archers have no photo): centre the person glyph inside the grey
	   circle. Overrides .ar-img's `display: block` so the SVG is truly centred. */
	.ar-img--empty {
		display: flex;
		align-items: center;
		justify-content: center;
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
	.ar-table :is(th, td):nth-child(6) { width: 8.75rem; } /* actions — icons right-aligned (see .ar-actions) */
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
		background: #88f641; /* green — live/published */
		color: #000;
	}
	.ar-state--hidden {
		background: #afa44f; /* husk olive — hidden */
		color: #000;
	}
	.ar-state--draft {
		background: #fde7d8;
		color: #8a4b1e;
	}
	/* Right-align the icon pair in its cell so it sits away from the Stanje pill
	   (the widened actions column + this alignment create the gap). */
	.ar-actions {
		gap: 1rem;
		justify-content: flex-end;
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

	/* Phone: give the table a min-width so it SCROLLS horizontally (in .ar-scroll) instead of
	   squishing the auto name column to nothing (which overlaps the header). Compact
	   font/padding + narrower columns; weight 800 headers to match Zadaci/other tables. */
	@media (max-width: 900px) {
		/* min-width = sum of the fixed column widths below (13 + 7 + 7 + 8 + 6 + 5.5 + 1.25
		   spacer ≈ 47.75), so the table pushes wider and scrolls horizontally instead of
		   scaling the Streličar column down and truncating the name. */
		.ar-table {
			min-width: 49rem;
		}
		.ar-table th {
			padding: 0.5rem 0.5rem;
			font-size: 0.9rem;
			font-weight: 800;
		}
		.ar-table td {
			padding: 0.5rem 0.5rem;
			font-size: 0.85rem;
		}
		/* Streličar column wide enough to fit "Amanda Mlinarić" in full (avatar + gap +
		   name + padding). This is the phone-only fix — most archer names now show whole. */
		.ar-table :is(th, td).ar-name-cell {
			width: 13rem;
		}
		.ar-table :is(th, td):nth-child(2) { width: 7rem; }
		.ar-table :is(th, td):nth-child(3) { width: 7rem; }
		.ar-table :is(th, td):nth-child(4) { width: 8rem; }
		.ar-table :is(th, td):nth-child(5) { width: 6rem; }
		/* Fixed (not auto) so the name column above keeps its full width instead of this
		   column stealing the slack. Left pad keeps the icons off the Stanje pill. */
		.ar-table :is(th, td):nth-child(6) { width: 5.5rem; padding-left: 2.5rem; }
		.ar-actions {
			justify-content: flex-start;
		}
		.ar-img,
		.ar-img--empty {
			width: 2.2rem;
			height: 2.2rem;
		}
		.ar-state {
			min-width: 5rem;
			font-size: 0.75rem;
		}
	}
</style>

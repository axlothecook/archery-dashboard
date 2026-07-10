<script lang="ts">
	// Events list table for Raspored → Svi događaji (+ Nacrti share it). Columns:
	// name, discipline badge, date range, level (colour dot + name), attendees,
	// status word, edit + eye-toggle + delete. Real data from GET /admin/events.
	// Mirrors ArticleTable (icons in the column heads, inline hide/unhide).
	import { goto } from '$app/navigation';
	import { DISCIPLINE_LABEL, deleteEvent, updateEvent, type EventAdminRow } from '$lib/events';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import TextSizeIcon from '$lib/components/icons/TextSizeIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
	import LevelsIcon from '$lib/components/icons/LevelsIcon.svelte';
	import PeopleIcon from '$lib/components/icons/PeopleIcon.svelte';
	import StatusIcon from '$lib/components/icons/StatusIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import EyeOffIcon from '$lib/components/icons/EyeOffIcon.svelte';

	let {
		events = $bindable(),
		emptyText,
		onDeleted
	}: {
		events: EventAdminRow[];
		emptyText: string;
		onDeleted?: (id: string) => void;
	} = $props();

	let confirmDlg = $state<ConfirmDialog>();
	let error = $state('');

	// Add `.faded` when the (single-line, capped) name overflows, so the right edge
	// fades to transparent (→ the white panel) instead of showing a "…". Re-checks on
	// the name text + on resize. Mirrors ArticleTable's title fade.
	function fadeIfOverflow(node: HTMLElement, _name: string) {
		const check = () => node.classList.toggle('faded', node.scrollWidth > node.clientWidth + 1);
		check();
		const ro = new ResizeObserver(check);
		ro.observe(node);
		return {
			update: () => check(),
			destroy: () => ro.disconnect()
		};
	}

	function fmtDay(iso: string): string {
		const d = new Date(iso);
		return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}.`;
	}
	// Day + month, no year ("28.5.") — used for the start of a same-year range so the
	// year isn't repeated twice.
	function fmtDayMonth(iso: string): string {
		const d = new Date(iso);
		return `${d.getDate()}.${d.getMonth() + 1}.`;
	}
	// "4.7.2026." (single day), "28.5. – 31.5.2027." (range within one year, year shown
	// once at the end), or "30.12.2026. – 2.1.2027." (range crossing years, both full).
	function fmtRange(from: string, to: string | null): string {
		if (!to || to === from) return fmtDay(from);
		const sameYear = new Date(from).getFullYear() === new Date(to).getFullYear();
		return `${sameYear ? fmtDayMonth(from) : fmtDay(from)} – ${fmtDay(to)}`;
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
			else events = events.filter((x) => x.id !== e.id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Brisanje nije uspjelo.';
		}
	}

	// Inline hide/unhide toggle: flips the event's `hidden` (PATCH), updating the
	// row's Stanje live. Optimistic — revert on failure. The eye icon reflects the
	// current visibility (eye = visible, eye-off = hidden).
	async function toggleHidden(e: EventAdminRow) {
		const next = !e.hidden;
		e.hidden = next; // optimistic (row object is reactive)
		try {
			await updateEvent(e.id, { hidden: next });
		} catch (err) {
			e.hidden = !next; // revert
			error = err instanceof Error ? err.message : 'Promjena vidljivosti nije uspjela.';
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
				<th>
					<span class="th-in display-f align-items-center gap-0-4"><TextSizeIcon size={18} />Naziv</span>
				</th>
				<th>
					<span class="th-in display-f align-items-center gap-0-4"><CategoryIcon size={18} />Disciplina</span>
				</th>
				<th>
					<span class="th-in display-f align-items-center gap-0-4"><ClockIcon size={18} />Datum</span>
				</th>
				<th>
					<span class="th-in display-f align-items-center gap-0-4"><LevelsIcon size={18} />Razina</span>
				</th>
				<th>
					<span class="th-in display-f align-items-center gap-0-4"><PeopleIcon size={18} />Sudionici</span>
				</th>
				<th>
					<span class="th-in display-f align-items-center gap-0-4"><StatusIcon size={18} />Stanje</span>
				</th>
				<th class="ev-th-actions"></th>
				<th class="ev-col-spacer"></th>
			</tr>
		</thead>
		<tbody>
			{#each events as e (e.id)}
				<tr class:cancelled={e.isCancelled}>
					<td class="ev-name fw-600" use:fadeIfOverflow={e.name}>{e.name}</td>
					<td><span class="ev-badge ev-badge--{e.discipline}">{DISCIPLINE_LABEL[e.discipline]}</span></td>
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
						<!-- The "+" (unlisted club attendee) only reads sensibly next to a real
						     count; with 0 listed archers just show a plain 0. -->
						{e.attendeeCount}{e.attendeeCount > 0 && e.hasUnlistedClubAttendee ? '+' : ''}
					</td>
					<td class="ev-flags">
						<!-- Always a state WORD: Otkazano (cancelled) / Nacrt (draft) /
						     Skriveno (published but hidden) / Objavljeno (live). -->
						{#if e.isCancelled}
							<span class="ev-state ev-state--cancelled">Otkazano</span>
						{:else if e.status === 'draft'}
							<span class="ev-state ev-state--draft">Nacrt</span>
						{:else if e.hidden}
							<span class="ev-state ev-state--hidden">Skriveno</span>
						{:else}
							<span class="ev-state ev-state--published">Objavljeno</span>
						{/if}
					</td>
					<td class="ev-actions-cell">
						<div class="ev-actions display-f align-items-center">
							<button class="ev-act cursor-pointer display-f" type="button" aria-label="Uredi" title="Uredi" onclick={() => edit(e)}>
								<EditIcon size={18} />
							</button>
							{#if e.status === 'published'}
								<!-- Eye toggle: hide/unhide a published event; icon reflects current
								     visibility and flips the Stanje live. -->
								<button
									class="ev-act cursor-pointer display-f"
									type="button"
									aria-pressed={e.hidden}
									aria-label={e.hidden ? 'Prikaži na javnoj stranici' : 'Sakrij s javne stranice'}
									title={e.hidden ? 'Skriveno — klik za prikaz' : 'Vidljivo — klik za skrivanje'}
									onclick={() => toggleHidden(e)}
								>
									{#if e.hidden}<EyeOffIcon size={22} />{:else}<EyeIcon size={22} />{/if}
								</button>
							{/if}
							<button class="ev-act ev-act--del cursor-pointer display-f" type="button" aria-label="Izbriši" title="Izbriši" onclick={() => remove(e)}>
								<TrashIcon size={18} />
							</button>
						</div>
					</td>
					<td class="ev-col-spacer"></td>
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
	/* GRID layout (not table-layout) so column widths are directly controllable:
	   - Naziv = minmax(8rem, 1fr) → takes ALL the leftover width, so on wide screens the
	     names get the room and the meta columns sit right, near the actions.
	   - pills / actions = max-content → exactly as wide as their content, never clipped.
	   - Datum / Razina = minmax(…, max-content) → full content when there's room ("14.11. –
	     16.11.2027.", "Europsko prvenstvo"), shrink gracefully (fade/clip) when the panel is
	     narrow.
	   The <table> markup stays (semantics/a11y); thead/tbody/tr become display:contents so
	   the th/td cells are the grid items. Visible column gaps come from the cells' symmetric
	   side padding (NOT column-gap, which would punch holes in the row separator lines). */
	.ev-table {
		display: grid;
		grid-template-columns:
			minmax(10rem, 1fr) /* Naziv — real floor; below it the wrapper h-scrolls */
			max-content /* Disciplina */
			max-content /* Datum — dates always shown in full, never clipped mid-number */
			minmax(6rem, max-content) /* Razina */
			max-content /* Sudionici */
			max-content /* Stanje */
			max-content /* actions */
			0.25rem; /* spacer before the scrollbar */
		font-size: 1rem;
		/* Below this the .ev-scroll wrapper scrolls horizontally rather than collapsing the
		   Naziv column to a few characters. */
		min-width: 44rem;
	}
	.ev-table thead,
	.ev-table tbody,
	.ev-table tr {
		display: contents;
	}
	.ev-table th {
		text-align: left;
		padding: 0.65rem 0.55rem;
		font-size: 1.05rem;
		font-weight: 700;
		color: #1b1b1b;
		border-bottom: 1px solid #eef1f3;
		white-space: nowrap;
		/* Sticky header: stays visible while the list scrolls vertically inside .ev-scroll.
		   Opaque white bg so rows don't show through; z-index over the cells. */
		position: sticky;
		top: 0;
		z-index: 1;
		background: #fff;
	}
	.ev-table td {
		padding: 0.7rem 0.55rem;
		color: #102e66;
		border-bottom: 1px solid #f3f5f8;
	}
	/* Cells are the grid items: flex so content centres vertically (the old
	   vertical-align:middle doesn't exist in grid); min-width:0 lets the fr/minmax tracks
	   shrink below their content (names/dates fade instead of blowing the track wide). */
	.ev-table :is(th, td) {
		display: flex;
		align-items: center;
		min-width: 0;
	}
	tr.cancelled .ev-name {
		text-decoration: line-through;
		color: #9aa3b2;
	}
	.ev-table :is(th, td).ev-col-spacer {
		padding: 0;
		border-bottom: 0;
	}
	.ev-name {
		white-space: nowrap;
		overflow: hidden;
	}
	/* When the name overflows (the `faded` class is added imperatively by
	   use:fadeIfOverflow), fade the right edge to transparent → the white panel shows
	   through, instead of a "…" ellipsis. :global on the class since it's toggled in JS
	   (svelte-check can't see it statically). Mirrors ArticleTable's .art-title fade. */
	.ev-name:global(.faded) {
		-webkit-mask-image: linear-gradient(to right, #000 82%, transparent 100%);
		mask-image: linear-gradient(to right, #000 82%, transparent 100%);
	}
	.ev-badge {
		display: inline-block;
		/* Match the Stanje (.ev-state) pill exactly: same min-width + centred text +
		   padding, so Disciplina and Stanje pills read as one uniform pill size. */
		min-width: 6.5rem;
		text-align: center;
		padding: 0.55rem 0.4rem;
		border-radius: 999px;
		background: #bbd0ff; /* light blue, solid fill (default: Vanjsko + other disciplines) */
		color: #000;
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
	}
	/* Dvoransko (indoor) gets its own amber fill to read apart from the blue disciplines. */
	.ev-badge--indoor {
		background: #ffad0a;
	}
	.ev-date {
		white-space: nowrap;
	}
	/* Keep the level name on one line (the name column absorbs the slack, so this
	   column shouldn't wrap when it tightens). */
	.ev-level {
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
		justify-content: center; /* number centred under the "Sudionici" title (cells are flex) */
	}
	/* Shrinkable text columns (Datum / Razina tracks are minmax) clip cleanly when tight. */
	.ev-table td:nth-child(3),
	.ev-table td:nth-child(4) {
		overflow: hidden;
	}
	.ev-flags {
		white-space: nowrap;
	}
	/* State word pill — always shown (never a bare dash). Mirrors ArticleTable's
	   .art-state: fixed min-width + centred so every state is the same length. */
	.ev-state {
		display: inline-block;
		min-width: 6.5rem;
		text-align: center;
		padding: 0.55rem 0.4rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.ev-state--published {
		background: #88f641; /* green — live/published */
		color: #000;
	}
	.ev-state--hidden {
		background: #afa44f; /* husk olive — hidden */
		color: #000;
	}
	.ev-state--draft {
		background: #fde7d8;
		color: #8a4b1e;
	}
	.ev-state--cancelled {
		background: #fde7ec;
		color: #a4133c;
	}
	.ev-actions {
		gap: 0.4rem;
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
	/* All three action icons share the same base colour + size; the eye's glyph
	   (eye vs eye-off) alone conveys the hidden state, so it isn't recoloured. */

	/* Phone: give the table a min-width so it SCROLLS horizontally (in the .ev-scroll wrapper)
	   instead of squishing the Naziv column to nothing. Compact font/padding; the grid template
	   keeps Naziv flexible with a real minimum and the meta columns content-sized. Weight 800
	   matches the Zadaci headers. */
	@media (max-width: 900px) {
		.ev-table {
			min-width: 46rem;
			grid-template-columns:
				minmax(11rem, 1fr) /* Naziv */
				max-content /* Disciplina */
				minmax(6rem, max-content) /* Datum */
				minmax(5.5rem, max-content) /* Razina */
				max-content /* Sudionici */
				max-content /* Stanje */
				max-content /* actions */
				0.25rem; /* spacer */
		}
		.ev-table th {
			padding: 0.5rem 0.45rem;
			font-size: 0.9rem;
			font-weight: 800;
		}
		.ev-table td {
			padding: 0.5rem 0.45rem;
			font-size: 0.85rem;
		}
		.ev-badge,
		.ev-state {
			min-width: 5rem;
			font-size: 0.75rem;
		}
	}
</style>

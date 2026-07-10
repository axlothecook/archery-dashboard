<script lang="ts">
	// Reusable article LIST table for the Vijesti section (Objavljene vijesti +
	// Nacrti share it — same columns, different rows). Columns: poster thumbnail,
	// title, media-type badge, date, status/flags, edit + delete. Real data from
	// GET /admin/articles. Delete confirms via the shared ConfirmDialog.
	import { goto } from '$app/navigation';
	import { MEDIA_TYPE_LABEL, deleteArticle, updateArticle, type ArticleAdminRow } from '$lib/articles';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import TextSizeIcon from '$lib/components/icons/TextSizeIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
	import StatusIcon from '$lib/components/icons/StatusIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import EyeOffIcon from '$lib/components/icons/EyeOffIcon.svelte';

	// Per-cell action: add `.faded` when the (single-line, capped) title overflows, so
	// the right edge fades to transparent (→ white panel) instead of showing a "…".
	// Re-checks on the title text + on resize. Works per-row inside the {#each}.
	function fadeIfOverflow(node: HTMLElement, _title: string) {
		const check = () => node.classList.toggle('faded', node.scrollWidth > node.clientWidth + 1);
		check();
		const ro = new ResizeObserver(check);
		ro.observe(node);
		return {
			update: () => check(),
			destroy: () => ro.disconnect()
		};
	}

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

	// Inline hide/unhide toggle: flips the article's `hidden` (PATCH), updating the
	// row's Stanje live. Optimistic — revert on failure. The eye icon reflects the
	// current visibility (eye = visible, eye-off = hidden).
	async function toggleHidden(a: ArticleAdminRow) {
		const next = !a.hidden;
		a.hidden = next; // optimistic (row object is reactive)
		try {
			await updateArticle(a.id, { hidden: next });
		} catch (e) {
			a.hidden = !next; // revert
			error = e instanceof Error ? e.message : 'Promjena vidljivosti nije uspjela.';
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
				<!-- Naslov header spans the poster + title columns so "Tt Naslov" starts at
				     the LEFT edge of the poster thumbnails (aligned with each article's pic). -->
				<th class="art-col-title-head" colspan="2">
					<span class="th-in display-f align-items-center gap-0-4"><TextSizeIcon size={18} />Naslov</span>
				</th>
				<th class="art-col-mid art-col-first-mid art-col-vrsta">
					<span class="th-in display-f align-items-center gap-0-4"><CategoryIcon size={18} />Vrsta</span>
				</th>
				<th class="art-col-mid art-col-datum">
					<span class="th-in display-f align-items-center gap-0-4"><ClockIcon size={18} />Datum</span>
				</th>
				<th class="art-col-mid art-col-stanje">
					<span class="th-in display-f align-items-center gap-0-4"><StatusIcon size={18} />Stanje</span>
				</th>
				<th class="art-th-actions"></th>
				<th class="art-col-spacer"></th>
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
					<td class="art-title fw-600 art-col-title" use:fadeIfOverflow={a.title}>{a.title}</td>
					<td class="art-col-mid art-col-first-mid art-col-vrsta">
						<span class="art-badge art-badge--{a.mediaType}">{MEDIA_TYPE_LABEL[a.mediaType]}</span>
					</td>
					<td class="art-date text-jet-grey art-col-mid art-col-datum">{fmtDate(a.publishedAt)}</td>
					<td class="art-flags art-col-mid art-col-stanje">
						<!-- Always a state WORD: Nacrt (draft) / Skriveno (published but hidden) /
						     Objavljeno (live). -->
						{#if a.status === 'draft'}
							<span class="art-state art-state--draft">Nacrt</span>
						{:else if a.hidden}
							<span class="art-state art-state--hidden">Skriveno</span>
						{:else}
							<span class="art-state art-state--published">Objavljeno</span>
						{/if}
					</td>
					<td class="art-actions-cell">
						<div class="art-actions display-f align-items-center">
							<button class="art-act cursor-pointer display-f" type="button" aria-label="Uredi" title="Uredi" onclick={() => edit(a)}>
								<EditIcon size={18} />
							</button>
							{#if a.status === 'published'}
								<!-- Eye toggle: hide/unhide a published article; icon reflects current
								     visibility and flips the Stanje live. -->
								<button
									class="art-act cursor-pointer display-f"
									type="button"
									aria-pressed={a.hidden}
									aria-label={a.hidden ? 'Prikaži na javnoj stranici' : 'Sakrij s javne stranice'}
									title={a.hidden ? 'Skriveno — klik za prikaz' : 'Vidljivo — klik za skrivanje'}
									onclick={() => toggleHidden(a)}
								>
									{#if a.hidden}<EyeOffIcon size={22} />{:else}<EyeIcon size={22} />{/if}
								</button>
							{/if}
							<button class="art-act art-act--del cursor-pointer display-f" type="button" aria-label="Izbriši" title="Izbriši" onclick={() => remove(a)}>
								<TrashIcon size={18} />
							</button>
						</div>
					</td>
					<td class="art-col-spacer"></td>
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
		font-size: 1.05rem;
		font-weight: 800; /* match the Zadaci (Početno) table headers */
		color: #1b1b1b;
		border-bottom: 1px solid #eef1f3;
		white-space: nowrap;
		/* Sticky header: stays visible while the list scrolls vertically inside .art-scroll.
		   Opaque white bg so rows don't show through; z-index over the cells. */
		position: sticky;
		top: 0;
		z-index: 1;
		background: #fff;
	}
	.art-table td {
		padding: 0.7rem 0.75rem;
		color: #102e66;
		border-bottom: 1px solid #f3f5f8;
		vertical-align: middle;
	}
	.art-poster-cell {
		width: 1%;
		padding-right: 0.5rem;
	}
	/* Column sizing: title fixed & narrower (overflow fades); the middle columns
	   (Vrsta/Datum/Stanje) + actions shrink to content with tighter horizontal
	   padding so they sit close together; a trailing spacer absorbs all leftover
	   width so the empty space lands on the FAR RIGHT (not between Stanje and the
	   actions). Net: narrower title, tight middle group, actions pulled left. */
	/* NB: prefixed with .art-table th/td to out-specify the base `.art-table td`
	   padding rule (compound selector), which otherwise wins and eats these. */
	.art-table :is(th, td).art-col-title {
		width: 33rem;
		max-width: 33rem;
	}
	/* EQUAL gap between the four right columns (Vrsta / Datum / Stanje / actions):
	   each carries the SAME left padding (the gap before it) and a minimal right pad,
	   so every adjacent-column gap is identical. FIXED widths (not shrink-to-content)
	   so the columns keep the SAME positions regardless of which rows the filter shows. */
	.art-table :is(th, td).art-col-mid,
	.art-table :is(th, td).art-actions-cell {
		white-space: nowrap;
		padding-left: 3.5rem;
		padding-right: 0;
	}
	.art-table :is(th, td).art-col-vrsta {
		width: 9rem;
	}
	.art-table :is(th, td).art-col-datum {
		width: 7rem;
	}
	.art-table :is(th, td).art-col-stanje {
		width: 8rem;
	}
	.art-table :is(th, td).art-actions-cell {
		width: 8rem;
	}
	/* Vrsta is the first of the group; its left padding is the (equal) gap after the
	   title, matching the gaps between the other columns. */
	.art-table :is(th, td).art-col-first-mid {
		padding-left: 3.5rem;
	}
	.art-table :is(th, td).art-col-spacer {
		/* Keeps a slight gap between the rightmost (actions) column and the scrollbar,
		   even when the table is wide enough to otherwise collapse the slack. */
		width: auto;
		min-width: 1.25rem;
		padding: 0;
		border-bottom: 0;
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
		/* Cap at the 2nd article's full width (~33rem) so titles up to that length show
		   in full and only longer ones fade. */
		max-width: 33rem;
		white-space: nowrap;
		overflow: hidden;
	}
	/* When the title overflows (the `faded` class is added imperatively by
	   use:fadeIfOverflow), fade the right edge to transparent → the white panel shows
	   through, instead of a "…" ellipsis. :global on the class since it's toggled in JS
	   (svelte-check can't see it statically). */
	.art-title:global(.faded) {
		-webkit-mask-image: linear-gradient(to right, #000 82%, transparent 100%);
		mask-image: linear-gradient(to right, #000 82%, transparent 100%);
	}
	.art-badge {
		display: inline-block;
		/* Match the Stanje (.art-state) pill exactly: same min-width + centred text +
		   padding, so Vrsta and Stanje pills read as one uniform pill size. */
		min-width: 6.5rem;
		text-align: center;
		padding: 0.55rem 0.4rem;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
		/* default (Događaj/event): light blue, solid fill */
		background: #bbd0ff;
		color: #000;
	}
	/* Per media-type badge colours. Događaj keeps the default above. */
	.art-badge--gallery {
		background: #efe6fb; /* purple */
		color: #5b2ea6;
	}
	.art-badge--external-link {
		background: #ffad0a; /* amber, solid fill — Vanjski link */
		color: #000;
	}
	.art-badge--video-only {
		background: #fb4c68; /* pink-red, solid fill — Video */
		color: #000;
	}
	.art-date {
		white-space: nowrap;
	}
	.art-flags {
		white-space: nowrap;
	}
	/* State word pill — always shown (never a bare dash). Fixed min-width + centred so
	   Objavljeno / Skriveno / Nacrt are all the SAME length. Taller vertical padding. */
	.art-state {
		display: inline-block;
		min-width: 6.5rem;
		text-align: center;
		/* Less horizontal, more vertical padding (taller pill). */
		padding: 0.55rem 0.4rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.art-state--published {
		background: #88f641; /* green — live/published */
		color: #000;
	}
	.art-state--hidden {
		background: #ffd453; /* yellow — hidden */
		color: #000;
	}
	.art-state--draft {
		background: #fde7d8;
		color: #8a4b1e;
	}
	.art-actions {
		gap: 0.75rem;
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
	/* All three action icons share the same base colour + size; the eye's glyph
	   (eye vs eye-off) alone conveys the hidden state, so it isn't recoloured. */

	/* Phone: compact the whole table so far more fits before the horizontal scroll — cut the
	   very wide title column, tighten the big inter-column gaps, shrink pills + cell padding.
	   The far columns (Stanje/actions) are still reached by swiping the table sideways. */
	@media (max-width: 900px) {
		.art-table th {
			padding: 0.5rem 0.5rem;
			font-size: 0.9rem;
		}
		.art-table td {
			padding: 0.5rem 0.5rem;
			font-size: 0.85rem;
		}
		/* Cut the Naslov column right down. */
		.art-table :is(th, td).art-col-title,
		.art-title {
			width: 11rem;
			max-width: 11rem;
		}
		/* Tighten the (desktop-wide) 3.5rem gaps before each right column. */
		.art-table :is(th, td).art-col-mid,
		.art-table :is(th, td).art-actions-cell,
		.art-table :is(th, td).art-col-first-mid {
			padding-left: 1.25rem;
		}
		.art-table :is(th, td).art-col-vrsta {
			width: 6.5rem;
		}
		.art-table :is(th, td).art-col-datum {
			width: 5.5rem;
		}
		.art-table :is(th, td).art-col-stanje {
			width: 6.5rem;
		}
		/* Wider left padding than the other columns pushes the action icons away from the
		   Stanje pill (the actions column is `auto`, so this becomes the gap). Matches the
		   Svi streličari table. */
		.art-table :is(th, td).art-actions-cell {
			width: auto;
			padding-left: 2.5rem;
		}
		/* Smaller Vrsta + Stanje pills. */
		.art-badge,
		.art-state {
			min-width: 5rem;
			font-size: 0.75rem;
			padding: 0.35rem 0.5rem;
		}
		.art-poster,
		.art-poster--empty {
			width: 2.8rem;
			height: 1.75rem;
		}
	}
</style>

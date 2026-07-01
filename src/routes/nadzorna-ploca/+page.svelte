<script lang="ts">
	// Dashboard landing (Nadzorna ploča). Layout mirrors the approved reference:
	// a "Your Projects" card grid on the left + an Announcements / Trending rail on
	// the right. The chrome (blue rail, top search bar, user) lives in the shared
	// admin +layout.svelte. Per the brief: NO gold card borders, only star + eye
	// per card (no third icon), no New/Upload/Share buttons, no greeting block.
	//
	// Content is mapped to real archery admin areas. The data here is placeholder
	// until the per-entity editors are wired — flagged so it is not mistaken for
	// live data.
	import UrgentIcon from '$lib/components/icons/UrgentIcon.svelte';
	import TeamMember from '$lib/components/TeamMember.svelte';
	import UrgentItem from '$lib/components/UrgentItem.svelte';
	import { team } from '$lib/teamStore.svelte';
	import type { Urgent } from '$lib/urgent';

	// Placeholder "projects" = the editable content areas of the site. Each links
	// to its (eventual) editor. lorem text stands in until real summaries exist.
	const PROJECTS = [
		{
			title: 'Vijesti',
			href: '/nadzorna-ploca/vijesti',
			summary: 'Uredi i objavi članke s naslovnice. Nacrti, objava i slike vijesti.'
		},
		{
			title: 'Raspored',
			href: '/nadzorna-ploca/raspored',
			summary: 'Natjecanja i događaji: dodaj, uredi ili ukloni termine i razine natjecanja.'
		},
		{
			title: 'Momčad',
			href: '/nadzorna-ploca/momcad',
			summary: 'Streličari, biografije, statistike, uloge i pojedinačna postignuća.'
		},
		{
			title: 'Postignuća',
			href: '/nadzorna-ploca/postignuca',
			summary: 'Klupska postignuća i naslovi: kategorije, brojači i ikone.'
		},
		{
			title: 'Sponzori',
			href: '/nadzorna-ploca/sponzori',
			summary: 'Partneri kluba: logotipi, poveznice i redoslijed prikaza.'
		},
		{
			title: 'Upiti',
			href: '/nadzorna-ploca/upiti',
			summary: 'Pristigli upiti za učlanjenje, sponzorstvo i donacije. Status i odgovori.'
		}
	];

	// Things that need the admin's URGENT attention. Placeholder copy + links to
	// the relevant section; empty = nothing urgent (panel shows a calm message).
	// Reactive so "Ukloni" (remove) can drop an item from the panel.
	let urgent = $state<Urgent[]>([
		{
			id: 'u1',
			title: 'Neodgovoreni upit',
			body: 'Upit za sponzorstvo čeka odgovor više od 3 dana.',
			href: '/nadzorna-ploca/upiti'
		},
		{
			id: 'u2',
			title: 'Nacrt članka istječe',
			body: 'Nacrt vijesti "Najava sezone" nije objavljen, a događaj je sutra.',
			href: '/nadzorna-ploca/vijesti'
		},
		{
			id: 'u3',
			title: 'Nedostaje slika sponzora',
			body: 'Partner "KODRA" nema postavljen logotip na javnoj stranici.',
			href: '/nadzorna-ploca/sponzori'
		},
		{
			id: 'u4',
			title: 'Događaj bez razine',
			body: 'Natjecanje "Oluja 2026" nema dodijeljenu razinu natjecanja.',
			href: '/nadzorna-ploca/raspored'
		},
		{
			id: 'u5',
			title: 'Profil bez biografije',
			body: 'Streličar "Leo Sulik" dodan je bez biografije i statistika.',
			href: '/nadzorna-ploca/momcad'
		}
	]);
	function removeUrgent(id: string) {
		urgent = urgent.filter((u) => u.id !== id);
	}

	// The Tim list reads the shared reactive `team` store, so profile edits to the
	// current admin (m1) show up here live. Each row + its hover popover is the
	// reusable <TeamMember> component.
</script>

<div class="dash grid gap-2 align-items-start">
	<!-- Main column: the project/content cards -->
	<section class="dash-main">
		<h2 class="dash-heading">Sadržaj</h2>
		<div class="cards grid grid-cols-2 gap-1-5">
			{#each PROJECTS as p (p.href)}
				<a class="card bg-white column-nowrap" href={p.href}>
					<h3 class="card-title">{p.title}</h3>
					<p class="card-summary">{p.summary}</p>
				</a>
			{/each}
		</div>
	</section>

	<!-- Side column: announcements + team ("trending") -->
	<aside class="dash-side">
		<h2 class="dash-heading dash-heading--urgent display-f align-items-center gap-0-5">
			Hitno
			<!-- Icon is the urgent orange when there are items, green ("all clear") when none. -->
			<span class="urgent-ico"><UrgentIcon size={24} color={urgent.length ? '#ff7800' : '#16a34a'} /></span>
		</h2>
		<div class="panel bg-white urgent-panel" class:is-empty={urgent.length === 0}>
			{#each urgent as u (u.id)}
				<UrgentItem item={u} onRemove={removeUrgent} />
			{:else}
				<p class="urgent-empty">Nema hitnih stavki za upravljanje.</p>
			{/each}
		</div>

		<h2 class="dash-heading mt">Tim</h2>
		<div class="panel bg-white team-list column-nowrap gap-1-1">
			{#each team as t (t.id)}
				<TeamMember member={t} />
			{/each}
		</div>
	</aside>
</div>

<style>
	/* Layout (grid gap-2 align-items-start) via utility classes; only the
	   asymmetric fractional track (content ~75% / Hitno-Tim ~25%) stays scoped. */
	.dash {
		grid-template-columns: 3fr 1fr;
	}
	/* Extra breathing room between the right (Hitno/Tim) column and the screen edge.
	   Works now that the track is fractional (it absorbs the margin). */
	.dash-side {
		margin-right: 1.5rem;
	}

	.dash-heading {
		margin: 0 0 1rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: #102e66;
	}
	.dash-heading.mt {
		margin-top: 1.75rem;
	}

	/* ---- Project cards (grid grid-cols-2 gap-1-5 via utilities) ---- */
	.card {
		min-height: 8rem;
		padding: 1.4rem 1.5rem;
		border-radius: 14px;
		text-decoration: none;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}
	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(16, 46, 102, 0.1);
	}
	.card-title {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
		font-weight: 700;
		color: #102e66;
	}
	.card-summary {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.5;
		color: #5b6577;
		flex: 1 1 auto;
	}

	/* ---- Side panels ---- */
	.panel {
		border-radius: 14px;
		padding: 1.4rem 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}

	/* ---- Urgent (Hitno) panel ---- */
	/* .dash-heading--urgent layout via utilities (display-f align-items-center gap-0-5) */
	.urgent-ico {
		display: inline-flex;
		align-items: center;
	}
	/* Items are separated by GAP, not a divider line. Tighter padding than the
	   default .panel (the item cards carry their own padding). */
	.urgent-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
	}
	.urgent-empty {
		margin: 0;
		font-size: 0.88rem;
		color: #5b6577;
	}
	/* Scrollable when there are many urgent items; custom navy scrollbar (no OS
	   arrows — same webkit-only approach as the notifications modal). */
	.urgent-panel {
		/* FIXED: exactly 3 fixed-height rows + symmetric padding. Does NOT shift with
		   content (= padTop .75 + item 8.625 + gap .75 + item 8.625 + gap .75 +
		   item 8.625 + padBottom .75 = 28.875rem). */
		max-height: 28.875rem;
		overflow-y: auto;
	}
	.urgent-panel.is-empty {
		overflow: visible;
	}
	.urgent-panel::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	.urgent-panel::-webkit-scrollbar-track {
		background: transparent;
	}
	.urgent-panel::-webkit-scrollbar-thumb {
		background: #102e66;
		border-radius: 4px;
	}
	.urgent-panel::-webkit-scrollbar-corner {
		background: transparent;
	}
	.urgent-panel::-webkit-scrollbar-button {
		display: none;
		width: 0;
		height: 0;
	}

	/* ---- Team list (column-nowrap gap-1-1 via utilities; rows are <TeamMember>) ---- */

	/* ---- Responsive ---- */
	@media (max-width: 1100px) {
		.dash {
			grid-template-columns: 1fr;
		}
		.dash-side {
			margin-right: 0; /* single column: no asymmetric right margin */
		}
	}
	@media (max-width: 640px) {
		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>

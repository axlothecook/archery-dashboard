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
	type Urgent = { id: string; title: string; body: string; href: string };
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

	// Placeholder team list — admins / developers with role (the detail we agreed
	// to show). Avatars are an "A" initial in a lighter-blue circle (no photos).
	const TEAM = [
		{ initial: 'A', name: 'Admin Jedan', role: 'developer' },
		{ initial: 'A', name: 'Admin Dva', role: 'admin' },
		{ initial: 'A', name: 'Admin Tri', role: 'admin' },
		{ initial: 'A', name: 'Admin Četiri', role: 'developer' }
	];
</script>

<div class="dash">
	<!-- Main column: the project/content cards -->
	<section class="dash-main">
		<h2 class="dash-heading">Sadržaj</h2>
		<div class="cards">
			{#each PROJECTS as p (p.href)}
				<a class="card bg-white" href={p.href}>
					<h3 class="card-title">{p.title}</h3>
					<p class="card-summary">{p.summary}</p>
				</a>
			{/each}
		</div>
	</section>

	<!-- Side column: announcements + team ("trending") -->
	<aside class="dash-side">
		<h2 class="dash-heading dash-heading--urgent">
			Hitno
			<!-- Icon is the urgent orange when there are items, green ("all clear") when none. -->
			<span class="urgent-ico"><UrgentIcon size={24} color={urgent.length ? '#ff7800' : '#16a34a'} /></span>
		</h2>
		<div class="panel bg-white urgent-panel" class:is-empty={urgent.length === 0}>
			{#each urgent as u, i (u.id)}
				<div class="urgent-item" class:divided={i > 0}>
					<h4 class="urgent-title">{u.title}</h4>
					<p class="urgent-body">{u.body}</p>
					<div class="urgent-actions">
						<a class="urgent-btn urgent-btn--fix" href={u.href}>Riješi sada</a>
						<button class="urgent-btn urgent-btn--remove" type="button" onclick={() => removeUrgent(u.id)}>
							Ukloni
						</button>
					</div>
				</div>
			{:else}
				<p class="urgent-empty">Nema hitnih stavki za upravljanje.</p>
			{/each}
		</div>

		<h2 class="dash-heading mt">Tim</h2>
		<div class="panel bg-white">
			{#each TEAM as t (t.name)}
				<div class="member">
					<span class="member-avatar bg-blue-dress-light-5">{t.initial}</span>
					<span class="member-meta">
						<span class="member-name">{t.name}</span>
						<span class="member-role">{t.role}</span>
					</span>
				</div>
			{/each}
		</div>
	</aside>
</div>

<style>
	.dash {
		display: grid;
		grid-template-columns: 1fr 420px;
		gap: 2rem;
		align-items: start;
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

	/* ---- Project cards (no gold border, only star + eye actions) ---- */
	.cards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}
	.card {
		display: flex;
		flex-direction: column;
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
	.dash-heading--urgent {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
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
	/* Each urgent item is its own card with a faint warm background. */
	.urgent-item {
		padding: 0.9rem 1rem;
		border-radius: 10px;
		background: #fff5ec; /* faint warm tint matching the urgent orange */
	}
	.urgent-title {
		margin: 0 0 0.35rem;
		font-size: 0.98rem;
		font-weight: 700;
		color: #102e66;
	}
	.urgent-body {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.5;
		color: #5b6577;
	}
	/* Action buttons, bottom-right, with a clear gap above the text. */
	.urgent-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.1rem;
	}
	.urgent-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		padding: 0.45rem 0.85rem;
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		border: 1px solid transparent;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}
	/* "Riješi sada" — light surface (not blue), leads to the section page. */
	.urgent-btn--fix {
		background: #fff;
		color: #102e66;
		border-color: #d7dee8;
	}
	.urgent-btn--fix:hover {
		background: #eef1f3;
	}
	/* "Ukloni" — secondary, removes the item from the panel. */
	.urgent-btn--remove {
		background: transparent;
		color: #5b6577;
		border-color: #cbd5e1;
	}
	.urgent-btn--remove:hover {
		background: #eef1f3;
		color: #102e66;
	}
	.urgent-empty {
		margin: 0;
		font-size: 0.88rem;
		color: #5b6577;
	}
	/* Scrollable when there are many urgent items; custom navy scrollbar (no OS
	   arrows — same webkit-only approach as the notifications modal). */
	.urgent-panel {
		max-height: 27.6rem; /* shows the first 3 items with symmetric top+bottom padding; 4th+ clipped, scroll to reach (sized to the current placeholder item heights) */
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

	/* ---- Team rows ("A" in a lighter-blue circle + name + role) ---- */
	.member {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}
	.member + .member {
		margin-top: 1.1rem;
	}
	.member-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 50%;
		color: #fff;
		font-weight: 700;
		flex: 0 0 auto;
	}
	.member-meta {
		display: flex;
		flex-direction: column;
		line-height: 1.3;
	}
	.member-name {
		font-weight: 700;
		font-size: 0.95rem;
		color: #102e66;
	}
	.member-role {
		font-size: 0.82rem;
		color: #5b6577;
	}

	/* ---- Responsive ---- */
	@media (max-width: 1100px) {
		.dash {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>

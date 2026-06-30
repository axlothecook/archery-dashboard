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

	// Placeholder team list. Each member's fields (display name, real name, email,
	// phone) are user-entered at account creation; the avatar is a colour circle
	// with a role letter (A = admin, D = developer) — TODO on adoption: replace the
	// avatar with a real image-upload field. Colours: the 2nd member is purple, the
	// rest follow role (developer = green, admin = blue). Hover reveals the details.
	type Member = {
		id: string;
		displayName: string;
		realName: string;
		role: 'admin' | 'developer';
		email: string;
		phone: string;
		/** explicit avatar colour key: 'purple' | 'green' | 'blue' */
		color: 'purple' | 'green' | 'blue';
	};
	const TEAM: Member[] = [
		{
			id: 'm1',
			displayName: 'Joškica Pupić',
			realName: 'Josip Pupić',
			role: 'admin',
			email: 'joskica.pupic@vsk.hr',
			phone: '+385 91 234 5678',
			color: 'blue'
		},
		{
			id: 'm2',
			displayName: 'zekke87',
			realName: 'Željko Kovač',
			role: 'admin',
			email: 'zekke87@vsk.hr',
			phone: '+385 98 765 4321',
			color: 'purple'
		},
		{
			id: 'm3',
			displayName: 'axlothecook',
			realName: 'Axel Inskyrim',
			role: 'developer',
			email: 'axelinskyrim@gmail.com',
			phone: '+385 95 111 2233',
			color: 'green'
		}
	];
	const roleLetter = (role: Member['role']) => (role === 'developer' ? 'D' : 'A');
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
			{#each TEAM as t (t.id)}
				<div class="member">
					<span class="member-avatar member-avatar--{t.color}">{roleLetter(t.role)}</span>
					<span class="member-meta">
						<span class="member-name">{t.displayName}</span>
						<span class="member-role">{t.role}</span>
					</span>

					<!-- Hover/focus details popover. -->
					<div class="member-card">
						<span class="member-avatar member-avatar--{t.color} member-card-avatar">{roleLetter(t.role)}</span>
						<div class="member-card-meta">
							<span class="member-card-name">{t.displayName}</span>
							<span class="member-card-real">{t.realName}</span>
							<span class="member-card-role">{t.role}</span>
						</div>
						<dl class="member-card-contact">
							<dt>Email</dt>
							<dd>{t.email}</dd>
							<dt>Telefon</dt>
							<dd>{t.phone}</dd>
						</dl>
					</div>
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
	/* FIXED height per item so the panel's scroll window never shifts with content
	   length (3 always fit identically). The body is clamped to 2 lines. */
	.urgent-item {
		box-sizing: border-box;
		height: 8.625rem; /* 138px — one consistent row height */
		flex: 0 0 auto;
		padding: 0.9rem 1rem;
		border-radius: 10px;
		background: #fff5ec; /* faint warm tint matching the urgent orange */
		display: flex;
		flex-direction: column;
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
		/* Clamp to 2 lines so every item keeps the same fixed height. */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	/* Action buttons, bottom-right, with a clear gap above the text. */
	.urgent-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: auto; /* pin actions to the bottom of the fixed-height card */
		padding-top: 0.6rem;
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

	/* ---- Team rows ("A" in a lighter-blue circle + name + role) ---- */
	.member {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.8rem;
		outline: none;
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
		font-weight: 800;
		font-size: 1.2rem; /* bigger letter */
		flex: 0 0 auto;
	}
	/* Each avatar: a light tinted circle with the role letter in a DARKER shade of
	   the same hue. */
	.member-avatar--blue {
		background: #cfe0fb; /* light blue-dress */
		color: #1657b8; /* darker blue */
	}
	.member-avatar--purple {
		background: #e7defb; /* light purple */
		color: #6b3fc0; /* darker purple */
	}
	.member-avatar--green {
		background: #d4f3df; /* light green */
		color: #1c8a4b; /* darker green */
	}
	.member-meta {
		display: flex;
		flex-direction: column;
		line-height: 1.3;
	}

	/* ---- Hover/focus details card ---- */
	.member-card {
		position: absolute;
		top: 50%;
		right: calc(100% + 0.75rem); /* opens to the LEFT of the row (panel is at the screen edge) */
		transform: translateY(-50%) scale(0.96);
		transform-origin: right center;
		width: 17rem;
		padding: 1rem 1.1rem;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 8px 30px rgba(16, 46, 102, 0.18);
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;
		z-index: 40;
	}
	.member:hover .member-card,
	.member:focus-visible .member-card,
	.member:focus-within .member-card {
		opacity: 1;
		visibility: visible;
		transform: translateY(-50%) scale(1);
	}
	.member-card-avatar {
		font-size: 1.4rem;
		width: 3rem;
		height: 3rem;
		margin-bottom: 0.6rem;
	}
	.member-card-meta {
		display: flex;
		flex-direction: column;
		line-height: 1.35;
		margin-bottom: 0.75rem;
	}
	.member-card-name {
		font-weight: 700;
		font-size: 1.05rem;
		color: #102e66;
	}
	.member-card-real {
		font-size: 0.88rem;
		color: #5b6577;
	}
	.member-card-role {
		font-size: 0.78rem;
		color: #9aa3b2;
		text-transform: capitalize;
	}
	.member-card-contact {
		margin: 0;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 0.75rem;
		padding-top: 0.6rem;
		border-top: 1px solid #eef1f3;
	}
	.member-card-contact dt {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 600;
		color: #9aa3b2;
	}
	.member-card-contact dd {
		margin: 0;
		font-size: 0.85rem;
		color: #102e66;
		word-break: break-word;
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

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
	import StarIcon from '$lib/components/icons/StarIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';

	// Placeholder "projects" = the editable content areas of the site. Each links
	// to its (eventual) editor. lorem text stands in until real summaries exist.
	const PROJECTS = [
		{
			title: 'Vijesti',
			href: '/admin/vijesti',
			summary: 'Uredi i objavi članke s naslovnice. Nacrti, objava i slike vijesti.'
		},
		{
			title: 'Raspored',
			href: '/admin/raspored',
			summary: 'Natjecanja i događaji: dodaj, uredi ili ukloni termine i razine natjecanja.'
		},
		{
			title: 'Momčad',
			href: '/admin/momcad',
			summary: 'Streličari, biografije, statistike, uloge i pojedinačna postignuća.'
		},
		{
			title: 'Postignuća',
			href: '/admin/postignuca',
			summary: 'Klupska postignuća i naslovi: kategorije, brojači i ikone.'
		},
		{
			title: 'Sponzori',
			href: '/admin/sponzori',
			summary: 'Partneri kluba: logotipi, poveznice i redoslijed prikaza.'
		},
		{
			title: 'Upiti',
			href: '/admin/upiti',
			summary: 'Pristigli upiti za učlanjenje, sponzorstvo i donacije. Status i odgovori.'
		}
	];

	// Placeholder announcements (stand-in copy).
	const ANNOUNCEMENTS = [
		{
			title: 'Održavanje sustava',
			body: 'Planirano kratko održavanje nadzorne ploče. Sadržaj ostaje dostupan posjetiteljima.'
		},
		{
			title: 'Novi unosi sadržaja',
			body: 'Dodani su novi predlošci za vijesti i događaje radi bržeg uređivanja.'
		},
		{
			title: 'Pravila privatnosti',
			body: 'Ažurirana pravila privatnosti i kolačića vidljiva su na javnim stranicama.'
		}
	];

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
				<article class="card bg-white">
					<h3 class="card-title">{p.title}</h3>
					<p class="card-summary">{p.summary}</p>
					<div class="card-actions">
						<a class="card-action" href={p.href} aria-label={`Otvori: ${p.title}`}>
							<StarIcon size={20} />
						</a>
						<a class="card-action" href={p.href} aria-label={`Pregledaj: ${p.title}`}>
							<EyeIcon size={20} />
						</a>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<!-- Side column: announcements + team ("trending") -->
	<aside class="dash-side">
		<h2 class="dash-heading">Obavijesti</h2>
		<div class="panel bg-white">
			{#each ANNOUNCEMENTS as a, i (a.title)}
				<div class="announce" class:divided={i > 0}>
					<h4 class="announce-title">{a.title}</h4>
					<p class="announce-body">{a.body}</p>
				</div>
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
		grid-template-columns: 1fr 320px;
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
		min-height: 11rem;
		padding: 1.4rem 1.5rem;
		border-radius: 14px;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
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
	.card-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1.2rem;
	}
	.card-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #102e66;
		opacity: 0.7;
		transition:
			opacity 0.15s ease,
			color 0.15s ease;
	}
	.card-action:hover {
		opacity: 1;
		color: #187ff5; /* blue-dress */
	}

	/* ---- Side panels ---- */
	.panel {
		border-radius: 14px;
		padding: 1.4rem 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}

	.announce.divided {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #eef1f3; /* seashell */
	}
	.announce-title {
		margin: 0 0 0.35rem;
		font-size: 0.98rem;
		font-weight: 700;
		color: #102e66;
	}
	.announce-body {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.5;
		color: #5b6577;
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

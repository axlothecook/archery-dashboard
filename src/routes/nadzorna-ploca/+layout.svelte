<script lang="ts">
	// Admin dashboard shell: a blue icon rail (entity nav + logout), a top bar
	// (search pill + notifications + the signed-in user), and the content area.
	// The +layout.server.ts guard guarantees `data.admin` is present (else it
	// redirects to /prijava before this renders).
	//
	// Colours come from the sass-library palette (blue-dress rail, white-smoke
	// page bg) via utility classes where possible; layout specifics are scoped
	// CSS below. Section icons are reusable icon components (currentColor + size).
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { logout } from '$lib/auth';

	import GridIcon from '$lib/components/icons/GridIcon.svelte';
	import HomeIcon from '$lib/components/icons/HomeIcon.svelte';
	import NewsIcon from '$lib/components/icons/NewsIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import TrophyIcon from '$lib/components/icons/TrophyIcon.svelte';
	import HandshakeIcon from '$lib/components/icons/HandshakeIcon.svelte';
	import InquiryIcon from '$lib/components/icons/InquiryIcon.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import BellIcon from '$lib/components/icons/BellIcon.svelte';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';
	import LogoutIcon from '$lib/components/icons/LogoutIcon.svelte';

	let { data, children } = $props();

	// Top-bar search query; the × clear button shows only when there's text.
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement | null>(null);
	function clearSearch() {
		searchQuery = '';
		searchInput?.focus();
	}

	// ── Notifications ("Novo") ──────────────────────────────────────────────────
	// New things since the admin's last visit (new posts/events, work other admins
	// did while away). Placeholder data for now — wire to a /notifications endpoint
	// later. The bell shows a red dot when there are any; clicking it opens a
	// dropdown panel (no page-dimming backdrop) with a sticky "Novo (N)" header and
	// a scrollable list (gap between items; max ~6 visible, scroll on overflow).
	// Each notice links to the section it relates to (e.g. a Raspored notice opens
	// the Raspored page) — so items are clickable.
	type Notice = { id: string; title: string; detail: string; when: string; href: string };
	const notifications: Notice[] = [
		{ id: 'n1', title: 'Nova vijest objavljena', detail: 'Admin Dva objavio je članak "Pobjeda na Varaždin Openu".', when: 'prije 2 h', href: '/nadzorna-ploca/vijesti' },
		{ id: 'n2', title: 'Novi događaj u rasporedu', detail: 'Dodano natjecanje "CEC 2. kolo" (4. srpnja).', when: 'prije 5 h', href: '/nadzorna-ploca/raspored' },
		{ id: 'n3', title: 'Uređen profil streličara', detail: 'Admin Tri ažurirao je biografiju za Amandu Mlinarić.', when: 'jučer', href: '/nadzorna-ploca/momcad' },
		{ id: 'n4', title: 'Novi upit za sponzorstvo', detail: 'Pristigao je upit od tvrtke Lasercopy.', when: 'jučer', href: '/nadzorna-ploca/upiti' },
		{ id: 'n5', title: 'Dodano postignuće', detail: 'Novi naslov dodan u kategoriju "Svjetski naslovi".', when: 'prije 2 dana', href: '/nadzorna-ploca/postignuca' },
		{ id: 'n6', title: 'Novi sponzor dodan', detail: 'Admin Dva dodao je partnera "KODRA" na popis sponzora.', when: 'prije 3 dana', href: '/nadzorna-ploca/sponzori' }
	];
	let noticesOpen = $state(false);
	const noticeCount = $derived(notifications.length);
	const hasNew = $derived(noticeCount > 0);

	function toggleNotices() {
		noticesOpen = !noticesOpen;
	}
	// Respect the OS "reduce motion" setting — skip the open/close animation then.
	const reduceMotion =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	const noticeAnim = reduceMotion
		? { start: 1, duration: 0 }
		: { start: 0.95, duration: 160, easing: cubicOut };
	// Close the dropdown on an outside click or Escape.
	function onWindowClick(e: MouseEvent) {
		if (!noticesOpen) return;
		const t = e.target as HTMLElement;
		if (!t.closest('.notif')) noticesOpen = false;
	}
	function onWindowKey(e: KeyboardEvent) {
		if (e.key === 'Escape') noticesOpen = false;
	}

	// Dashboard sections (built incrementally; hrefs may 404 until their editor
	// exists). Each pairs a real admin area with a reusable icon component.
	// Everything lives under /nadzorna-ploca: "Home" is the dashboard index, every
	// other section is nested beneath it (/nadzorna-ploca/momcad, …).
	const NAV = [
		{ label: 'Početno', href: '/nadzorna-ploca', icon: HomeIcon },
		{ label: 'Vijesti', href: '/nadzorna-ploca/vijesti', icon: NewsIcon },
		{ label: 'Raspored', href: '/nadzorna-ploca/raspored', icon: CalendarIcon },
		{ label: 'Momčad', href: '/nadzorna-ploca/momcad', icon: PersonIcon },
		{ label: 'Postignuća', href: '/nadzorna-ploca/postignuca', icon: TrophyIcon },
		{ label: 'Sponzori', href: '/nadzorna-ploca/sponzori', icon: HandshakeIcon },
		{ label: 'Upiti', href: '/nadzorna-ploca/upiti', icon: InquiryIcon }
	];

	// Active when the path equals the item exactly, or (for non-index items) is
	// nested under it. The Home item ('/nadzorna-ploca') must match EXACTLY, else
	// it would stay active on every nested section.
	const isActive = (href: string) =>
		page.url.pathname === href ||
		(href !== '/nadzorna-ploca' && page.url.pathname.startsWith(href + '/'));

	let loggingOut = $state(false);
	async function handleLogout() {
		if (loggingOut) return;
		loggingOut = true;
		try {
			await logout();
		} catch {
			// even if the request fails, send them back to login
		}
		await goto('/prijava');
	}

	// Initials for the user chip (first letters of the work name, max 2).
	const initials = $derived(
		(data.admin.workName ?? '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w: string) => w[0]?.toUpperCase() ?? '')
			.join('')
	);
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

<svelte:head>
	<title>Admin · VSK</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="admin-shell bg-white-smoke">
	<!-- Blue icon rail -->
	<aside class="admin-rail bg-blue-dress">
		<!-- Non-clickable title: everything in the dashboard originates from here. -->
		<div class="rail-brand">
			<GridIcon size={34} />
			<span class="rail-brand-text">Nadzorna ploča</span>
		</div>

		<nav class="rail-nav" aria-label="Glavni izbornik">
			{#each NAV as item (item.href)}
				<a href={item.href} class="rail-link" class:active={isActive(item.href)}>
					<span class="rail-icon">
						<item.icon size={26} />
					</span>
					<span class="rail-label">{item.label}</span>
				</a>
			{/each}
		</nav>
	</aside>

	<div class="admin-body">
		<!-- Top bar: search pill + notifications + user -->
		<header class="admin-topbar">
			<form class="search-pill" role="search" onsubmit={(e) => e.preventDefault()}>
				<input
					class="search-input"
					type="search"
					placeholder="Pretraži…"
					aria-label="Pretraži"
					bind:value={searchQuery}
					bind:this={searchInput}
				/>
				{#if searchQuery}
					<button class="search-clear" type="button" aria-label="Očisti pretragu" onclick={clearSearch}>
						<CloseIcon size={24} />
					</button>
				{/if}
				<button class="search-btn" type="submit" aria-label="Pretraži">
					<SearchIcon size={28} />
				</button>
			</form>

			<div class="topbar-right">
				<div class="notif">
					<button
						class="topbar-bell"
						aria-label="Obavijesti"
						aria-expanded={noticesOpen}
						onclick={toggleNotices}
					>
						<BellIcon size={28} />
						{#if hasNew}
							<span class="notif-dot" aria-hidden="true"></span>
						{/if}
					</button>

					{#if noticesOpen}
						<div
							class="notif-panel"
							role="dialog"
							aria-label="Obavijesti"
							transition:scale={noticeAnim}
						>
							<div class="notif-head">
								<span class="notif-title">Novo</span>
								<span class="notif-count">({noticeCount})</span>
							</div>
							<div class="notif-list">
								{#each notifications as n (n.id)}
									<a class="notif-item" href={n.href} onclick={() => (noticesOpen = false)}>
										<p class="notif-item-title">{n.title}</p>
										<p class="notif-item-detail">{n.detail}</p>
										<span class="notif-item-when">{n.when}</span>
									</a>
								{:else}
									<p class="notif-empty">Nema novih obavijesti.</p>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				<div class="topbar-user">
					<span class="user-avatar bg-blue-dress-light-5">{initials || 'A'}</span>
					<span class="user-name">{data.admin.workName}</span>
					<button
						class="topbar-logout"
						onclick={handleLogout}
						disabled={loggingOut}
						aria-label="Odjava"
						title="Odjava"
					>
						<LogoutIcon size={28} />
					</button>
				</div>
			</div>
		</header>

		<main class="admin-content">
			{@render children()}
		</main>
	</div>
</div>

<style>
	/* Layout shell — rail + body. Colours that map to the library palette use
	   utility classes in the markup (bg-blue-dress, bg-white-smoke, …); the
	   structural CSS lives here. */
	.admin-shell {
		display: grid;
		grid-template-columns: 280px 1fr;
		min-height: 100dvh;
		color: #102e66; /* deep-sapphire ink on the light page */
	}

	/* ---- Blue icon rail ---- */
	.admin-rail {
		display: flex;
		flex-direction: column;
		color: #fff;
		padding: 1.5rem 1rem;
		gap: 0.4rem;
	}
	.rail-brand {
		display: flex;
		align-items: center;
		justify-content: center; /* centre the icon + title within the rail */
		gap: 0.7rem;
		font-weight: 700;
		font-size: 1.35rem;
		white-space: nowrap; /* keep "Nadzorna ploča" on one row */
		padding: 0 0.5rem 1.5rem;
	}
	.rail-nav {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		flex: 1 0 auto;
		/* The library applies $base-box-shadow to every <nav> globally
		   (_navbar.scss); kill it here so the sidebar reads as one solid colour. */
		box-shadow: none;
	}
	.rail-link {
		display: flex;
		align-items: center;
		gap: 0.95rem;
		padding: 0.8rem 0.9rem;
		border-radius: 10px;
		color: #fff;
		text-decoration: none;
		font-size: 1.15rem;
		font-weight: 500;
		font-family: inherit;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}
	.rail-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		flex: 0 0 auto;
		opacity: 0.92;
	}
	.rail-icon :global(svg) {
		display: block;
	}
	.rail-link:hover {
		background: rgba(255, 255, 255, 0.16);
	}
	.rail-link.active {
		background: #fff;
		color: #187ff5; /* blue-dress — chip reads as "active" against the blue rail */
		font-weight: 600;
	}

	/* ---- Body (topbar + content) ---- */
	.admin-body {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	/* ---- Top bar ---- */
	/* White strip so the search/user chrome reads as a distinct surface above the
	   grey content area below. */
	.admin-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 0.7rem 3rem;
		background: #ffffff;
	}

	/* Search: YouTube-style. Input + button share ONE pill; the button is a
	   distinct block at the right end with a slightly DARKER fill than the input,
	   the magnifier centred in it. The pill has no right padding so the button sits
	   flush to the rounded edge. */
	.search-pill {
		display: flex;
		align-items: stretch; /* button stretches to full pill height */
		flex: 1 1 auto;
		max-width: 720px;
		min-height: 2.5rem;
		background: #e2e8f0;
		border-radius: 999px;
		padding: 0 0 0 1.2rem;
		overflow: hidden; /* clip the button's square inner corners to the pill radius */
		box-shadow: 0 1px 2px rgba(16, 46, 102, 0.06);
	}
	.search-input {
		flex: 1 1 auto;
		border: none;
		outline: none;
		background: transparent;
		font-size: 1rem;
		font-family: inherit;
		color: #102e66;
		min-width: 0;
		padding-right: 1.5rem;
	}
	.search-input::placeholder {
		color: #9aa3b2;
	}
	/* Suppress the browser's native type="search" clear control so only our custom
	   × button shows (otherwise both appear). */
	.search-input::-webkit-search-cancel-button {
		-webkit-appearance: none;
		appearance: none;
	}
	/* Clear (×) button: shows only when there is text. Same ink colour as the
	   search icon; a gap separates it from both the input and the search button. */
	.search-clear {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		margin: 0 0.6rem 0 0.2rem;
		align-self: center;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: #102e66; /* same colour as the search SVG */
		cursor: pointer;
		flex: 0 0 auto;
		transition: background-color 0.15s ease;
	}
	.search-clear:hover {
		background: rgba(16, 46, 102, 0.1);
	}
	/* Distinct button: a bit DARKER than the input bg, icon centred, slightly wider
	   so it reads as a YT-style search button. */
	.search-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3.6rem;
		border: none;
		border-radius: 0;
		background: #cbd5e1; /* a step darker than the input's #e2e8f0 */
		color: #102e66;
		cursor: pointer;
		flex: 0 0 auto;
		transition: background-color 0.15s ease;
	}
	.search-btn:hover {
		background: #b8c2d1; /* darker still on hover */
	}

	.topbar-right {
		display: flex;
		align-items: center;
		gap: 1.4rem;
		flex: 0 0 auto;
	}
	/* Notifications: bell trigger + dropdown panel (no page-dimming backdrop). */
	.notif {
		position: relative;
		display: inline-flex;
	}
	.topbar-bell {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: #102e66;
		cursor: pointer;
		padding: 0.3rem;
		border-radius: 50%;
	}
	.topbar-bell:hover {
		background: rgba(16, 46, 102, 0.08);
	}
	/* Red dot (#19): shown when there are new notifications. */
	.notif-dot {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: #e60023; /* state-red */
		border: 2px solid #fff;
	}
	/* Dropdown panel anchored under the bell. No backdrop overlay. Enters/leaves
	   with a fade + subtle scale from the trigger corner (the industry-standard
	   menu/notification animation — Material/MUI), via transition:scale + this
	   transform-origin. */
	.notif-panel {
		position: absolute;
		top: calc(100% + 0.6rem);
		right: 0;
		transform-origin: top right;
		width: 30rem;
		max-width: calc(100vw - 2rem);
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 8px 30px rgba(16, 46, 102, 0.18);
		z-index: 50;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	/* Sticky header stays at the top while the list scrolls. */
	.notif-head {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
		padding: 1.4rem 1.5rem 1.1rem;
		border-bottom: 1px solid #eef1f3;
		flex: 0 0 auto;
	}
	.notif-title {
		font-size: 1.6rem;
		font-weight: 700;
		color: #102e66;
	}
	.notif-count {
		font-size: 1.35rem;
		font-weight: 600;
		color: #e60023; /* same red as the bell notification dot */
	}
	/* Scrollable list: ~6 items tall, scroll on overflow; gap between items. */
	.notif-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1rem;
		max-height: 31.3rem; /* shows exactly 5 items; the 6th+ are fully clipped out of view (scroll to reach) */
		overflow-y: auto;
		/* NOTE: deliberately NOT setting `scrollbar-width`/`scrollbar-color` here.
		   When the standard `scrollbar-width` is set, Chromium switches to the
		   standard scrollbar and IGNORES the ::-webkit-scrollbar rules below — which
		   left the native OS arrow buttons visible. Using only the webkit path lets
		   the custom thumb + button-removal actually apply (the user is on Chromium).
		   Firefox would show its default thin bar, which is acceptable. */
	}
	/* Fully define EVERY scrollbar part (incl. width+height) so Chromium uses the
	   custom scrollbar and does NOT fall back to the OS scrollbar (whose stepper
	   arrows can't be removed) — the same approach the public archer page uses. */
	.notif-list::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	.notif-list::-webkit-scrollbar-track {
		background: transparent;
	}
	.notif-list::-webkit-scrollbar-thumb {
		background: #102e66; /* same as the bell SVG colour */
		border-radius: 4px;
	}
	.notif-list::-webkit-scrollbar-corner {
		background: transparent;
	}
	/* No stepper arrows at the ends of the scrollbar (all directions/positions). */
	.notif-list::-webkit-scrollbar-button {
		display: none;
		width: 0;
		height: 0;
	}
	/* Each item links to its section page — clickable, pointer cursor, darker on hover. */
	.notif-item {
		display: block;
		padding: 0.9rem 1rem;
		border-radius: 10px;
		background: #f6f8fa;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}
	.notif-item:hover {
		background: #e8edf2; /* slightly darker than #f6f8fa */
	}
	.notif-item-title {
		margin: 0 0 0.2rem;
		font-size: 0.92rem;
		font-weight: 700;
		color: #102e66;
	}
	.notif-item-detail {
		margin: 0 0 0.3rem;
		font-size: 0.82rem;
		line-height: 1.45;
		color: #5b6577;
	}
	.notif-item-when {
		font-size: 0.74rem;
		color: #9aa3b2;
	}
	.notif-empty {
		margin: 0;
		padding: 1rem 1.1rem 1.25rem;
		font-size: 0.88rem;
		color: #5b6577;
	}
	.topbar-bell:hover {
		background: rgba(16, 46, 102, 0.06);
	}
	.topbar-user {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}
	.user-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		color: #fff;
		font-weight: 700;
		font-size: 0.95rem;
	}
	.user-name {
		font-weight: 700;
		font-size: 1.02rem;
	}
	/* Logout icon button next to the signed-in user's name. */
	.topbar-logout {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-left: 0.35rem;
		padding: 0.35rem;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: #102e66;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}
	.topbar-logout:hover:not(:disabled) {
		background: rgba(16, 46, 102, 0.08);
	}
	.topbar-logout:disabled {
		opacity: 0.6;
		cursor: default;
	}

	/* ---- Content ---- */
	.admin-content {
		flex: 1 0 auto; /* fill the body height so the bg covers the whole content area */
		padding: 2rem 3rem;
		background: #e2e8f0;
	}

	/* ---- Responsive: collapse the rail to a top strip on small screens ---- */
	@media (max-width: 820px) {
		.admin-shell {
			grid-template-columns: 1fr;
		}
		.admin-rail {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.4rem;
			padding: 0.8rem 1rem;
		}
		.rail-brand {
			padding: 0 0.5rem;
			flex: 1 1 100%;
		}
		.rail-nav {
			flex-direction: row;
			flex-wrap: wrap;
			flex: 1 1 100%;
		}
		.rail-label {
			display: none;
		}
		.rail-link {
			padding: 0.6rem 0.7rem;
		}
		.admin-topbar {
			padding: 1rem;
			gap: 0.8rem;
		}
		.user-name {
			display: none;
		}
		.admin-content {
			padding: 1.25rem 1rem;
		}
	}
</style>

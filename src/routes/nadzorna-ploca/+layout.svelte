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
	import { getCurrentAdmin } from '$lib/teamStore.svelte';

	// Live current-admin record from the shared store (updates when the profile is edited).
	const currentAdmin = $derived(getCurrentAdmin());

	import GridIcon from '$lib/components/icons/GridIcon.svelte';
	import HomeIcon from '$lib/components/icons/HomeIcon.svelte';
	import NewsIcon from '$lib/components/icons/NewsIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import TrophyIcon from '$lib/components/icons/TrophyIcon.svelte';
	import HandshakeIcon from '$lib/components/icons/HandshakeIcon.svelte';
	import InquiryIcon from '$lib/components/icons/InquiryIcon.svelte';
	import AdministrationIcon from '$lib/components/icons/AdministrationIcon.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import BellIcon from '$lib/components/icons/BellIcon.svelte';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';
	import LogoutIcon from '$lib/components/icons/LogoutIcon.svelte';
	import NoticeItem from '$lib/components/NoticeItem.svelte';
	import RailLink from '$lib/components/RailLink.svelte';
	import RailGroup from '$lib/components/RailGroup.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';
	import type { Notice } from '$lib/notices';

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
	//
	// Cloudflare-style nav: a content section is a PARENT with a `children` submenu
	// — clicking it toggles the submenu in place (it has no page of its own); the
	// sub-options are the actual page links. Items WITHOUT `children` (Početno,
	// Upiti, Administracija) are plain links that navigate directly. The child
	// routes are placeholders until each editor is built (they 404 for now).
	//   objavljeno = "manage published", nacrti = drafts, novo/novi = create new.
	const NAV = [
		{ label: 'Početno', href: '/nadzorna-ploca', icon: HomeIcon },
		{
			label: 'Vijesti',
			icon: NewsIcon,
			children: [
				{ label: 'Objavljene vijesti', href: '/nadzorna-ploca/vijesti/objavljeno' },
				{ label: 'Nacrti', href: '/nadzorna-ploca/vijesti/nacrti' },
				{ label: 'Novi članak', href: '/nadzorna-ploca/vijesti/novi' }
			]
		},
		{
			label: 'Raspored',
			icon: CalendarIcon,
			children: [
				{ label: 'Objavljeni događaji', href: '/nadzorna-ploca/raspored/objavljeno' },
				{ label: 'Novi događaj', href: '/nadzorna-ploca/raspored/novi' }
			]
		},
		{
			label: 'Momčad',
			icon: PersonIcon,
			children: [
				{ label: 'Objavljeni streličari', href: '/nadzorna-ploca/momcad/objavljeno' },
				{ label: 'Novi streličar', href: '/nadzorna-ploca/momcad/novi' }
			]
		},
		{
			label: 'Postignuća',
			icon: TrophyIcon,
			children: [
				{ label: 'Objavljena postignuća', href: '/nadzorna-ploca/postignuca/objavljeno' },
				{ label: 'Novo postignuće', href: '/nadzorna-ploca/postignuca/novo' }
			]
		},
		{
			label: 'Sponzori',
			icon: HandshakeIcon,
			children: [
				{ label: 'Objavljeni sponzori', href: '/nadzorna-ploca/sponzori/objavljeno' },
				{ label: 'Novi sponzor', href: '/nadzorna-ploca/sponzori/novi' }
			]
		},
		{ label: 'Upiti', href: '/nadzorna-ploca/upiti', icon: InquiryIcon },
		{ label: 'Administracija', href: '/nadzorna-ploca/administracija', icon: AdministrationIcon }
	];

	// Active when the path equals the item exactly, or (for non-index items) is
	// nested under it. The Home item ('/nadzorna-ploca') must match EXACTLY, else
	// it would stay active on every nested section.
	const isActive = (href: string) =>
		page.url.pathname === href ||
		(href !== '/nadzorna-ploca' && page.url.pathname.startsWith(href + '/'));

	// Sidebar collapse (item 14): the blue rail slides fully off-canvas and the
	// content takes the full width. A half-stick-out chevron button toggles it and
	// stays reachable at the screen's left edge while collapsed.
	let railCollapsed = $state(false);
	function toggleRail() {
		railCollapsed = !railCollapsed;
	}

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

</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

<svelte:head>
	<title>Admin · VSK</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="admin-shell bg-white-smoke" class:rail-collapsed={railCollapsed}>
	<!-- Blue icon rail -->
	<aside class="admin-rail bg-blue-dress">
		<!-- Non-clickable title: everything in the dashboard originates from here. -->
		<div class="rail-brand display-f align-items-center gap-0-7">
			<span class="rail-brand-icon">
				<GridIcon size={36} />
			</span>
			<span class="rail-brand-text">Nadzorna ploča</span>
		</div>

		<nav class="rail-nav column-nowrap shadow-none" aria-label="Glavni izbornik">
			{#each NAV as item (item.label)}
				{#if item.children}
					<RailGroup
						label={item.label}
						icon={item.icon}
						items={item.children}
						compact={railCollapsed}
					/>
				{:else}
					<RailLink
						href={item.href}
						label={item.label}
						icon={item.icon}
						active={isActive(item.href)}
						compact={railCollapsed}
					/>
				{/if}
			{/each}
		</nav>
	</aside>

	<!-- Half-stick-out toggle: collapses the rail to an icons-only strip and back.
	     Sits half-out on the rail's right edge; follows the edge as it narrows. -->
	<button
		class="rail-toggle"
		type="button"
		onclick={toggleRail}
		aria-label={railCollapsed ? 'Otvori izbornik' : 'Zatvori izbornik'}
		aria-expanded={!railCollapsed}
	>
		<ChevronIcon direction={railCollapsed ? 'right' : 'left'} size={26} />
	</button>

	<div class="admin-body column-nowrap">
		<!-- Top bar: search pill + notifications + user -->
		<header class="admin-topbar display-f align-items-center justify-content-space-between gap-1-5">
			<form class="search-pill display-f align-items-stretch" role="search" onsubmit={(e) => e.preventDefault()}>
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

			<div class="topbar-right display-f align-items-center gap-1-4">
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
							<div class="notif-head display-f align-items-baseline">
								<span class="notif-title">Novo</span>
								<span class="notif-count">({noticeCount})</span>
							</div>
							<div class="notif-list column-nowrap gap-0-6">
								{#each notifications as n (n.id)}
									<NoticeItem notice={n} onNavigate={() => (noticesOpen = false)} />
								{:else}
									<p class="notif-empty">Nema novih obavijesti.</p>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				<div class="topbar-user display-f align-items-center">
					<!-- Clicking the user chip opens the admin profile settings page. -->
					<a class="user-chip display-f align-items-center" href="/nadzorna-ploca/profil" title="Profil i postavke">
						<Avatar color={currentAdmin.color} role={currentAdmin.role} size={2.5} />
						<span class="user-name">{currentAdmin.displayName}</span>
					</a>
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
			<Toast />
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
		transition: grid-template-columns 0.25s ease;
	}
	/* Collapsed (item 14): rail column narrows to an icons-only strip (not hidden). */
	.admin-shell.rail-collapsed {
		grid-template-columns: 5rem 1fr;
	}

	/* ---- Blue icon rail ---- */
	.admin-rail {
		display: flex;
		flex-direction: column;
		color: #fff;
		padding: 1.5rem 1rem;
		gap: 0.4rem;
		overflow: hidden; /* clip labels as the column narrows */
	}
	/* Collapsed: centre the icons + tighten padding for the narrow strip. */
	.rail-collapsed .admin-rail {
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		align-items: center;
	}
	.rail-collapsed .rail-brand-text {
		display: none;
	}

	/* Half-stick-out toggle button: pinned to the rail's right edge, vertically
	   centred; follows the edge (280px open → 5rem collapsed) so it never overlaps
	   the content and stays reachable in both states. */
	.rail-toggle {
		position: fixed;
		top: 50%;
		left: 280px;
		transform: translate(-50%, -50%); /* half-out over the rail edge */
		z-index: 50;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		border: 1px solid #d7dee8;
		border-radius: 50%;
		background: #fff;
		color: #102e66;
		cursor: pointer;
		box-shadow: 0 2px 10px rgba(16, 46, 102, 0.18);
		transition:
			left 0.25s ease,
			transform 0.25s ease,
			background-color 0.15s ease;
	}
	.rail-toggle:hover {
		background: #eef1f3;
	}
	/* Collapsed: follow the narrowed rail edge (5rem), still half-out. */
	.rail-collapsed .rail-toggle {
		left: 5rem;
	}
	/* layout (display-f align-items-center justify-content-center gap-0-7) via utilities. */
	.rail-brand {
		font-weight: 700;
		font-size: 1.35rem;
		white-space: nowrap; /* keep "Nadzorna ploča" on one row */
		/* Match the nav items' horizontal padding (.rail-link = 0.8rem 0.9rem) so the
		   brand icon + text start at the SAME left line as the options below and the
		   row extends to the same right edge. */
		padding: 0 0.9rem 1.5rem;
	}
	/* Bigger brand mark, fully CONTAINED in its box (no overflow). The box's LEFT edge
	   aligns with the nav icons (same .rail-brand padding as .rail-link), so the row
	   starts at the same vertical line; the row spans full width so it ends there too. */
	.rail-brand-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		flex: 0 0 auto;
	}
	.rail-brand-icon :global(svg) {
		display: block;
	}
	/* column-nowrap + shadow-none via utilities (the latter overrides the library's
	   global <nav> box-shadow so the sidebar reads as one solid colour). */
	.rail-nav {
		gap: 0.15rem;
		flex: 1 0 auto;
	}
	/* ---- Body (topbar + content) ---- column-nowrap via utility. */
	.admin-body {
		min-width: 0;
	}

	/* ---- Top bar ---- */
	/* White strip so the search/user chrome reads as a distinct surface above the
	   grey content area below. Layout via utilities (display-f align-items-center
	   justify-content-space-between gap-1-5). */
	.admin-topbar {
		padding: 0.7rem 3rem;
		background: #ffffff;
	}

	/* Search: YouTube-style. Input + button share ONE pill; the button is a
	   distinct block at the right end with a slightly DARKER fill than the input,
	   the magnifier centred in it. The pill has no right padding so the button sits
	   flush to the rounded edge. */
	/* display-f align-items-stretch via utilities (button = full pill height). */
	.search-pill {
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

	/* display-f align-items-center gap-1-4 via utilities. */
	.topbar-right {
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
	/* display-f align-items-baseline via utilities; gap 0.35 is off-scale. */
	.notif-head {
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
	/* Scrollable list: ~6 items tall, scroll on overflow. Layout via utilities
	   (column-nowrap gap-0-6). */
	.notif-list {
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
	.notif-empty {
		margin: 0;
		padding: 1rem 1.1rem 1.25rem;
		font-size: 0.88rem;
		color: #5b6577;
	}
	.topbar-bell:hover {
		background: rgba(16, 46, 102, 0.06);
	}
	/* display-f align-items-center via utilities; gap 0.65 off-scale. */
	.topbar-user {
		gap: 0.65rem;
	}
	/* Clickable user chip -> profile settings. Layout via utilities; gap 0.55 off-scale. */
	.user-chip {
		gap: 0.55rem;
		padding: 0.25rem 0.5rem 0.25rem 0.25rem;
		border-radius: 999px;
		text-decoration: none;
		color: inherit;
	}
	.user-name {
		font-weight: 700;
		font-size: 1.02rem;
		color: #102e66;
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
		position: relative; /* anchor for the top-left toast stack */
		flex: 1 0 auto; /* fill the body height so the bg covers the whole content area */
		padding: 2rem 9.5rem 2rem 3rem; /* wider right gap to the screen edge */
		background: #e2e8f0;
	}

	/* ---- Responsive: collapse the rail to a top strip on small screens ---- */
	@media (max-width: 820px) {
		.admin-shell,
		.admin-shell.rail-collapsed {
			grid-template-columns: 1fr;
		}
		/* The collapse toggle is a desktop-only affordance; the top-strip layout
		   handles small screens on its own. Neutralise any collapsed overrides. */
		.rail-toggle {
			display: none;
		}
		.rail-collapsed .admin-rail {
			align-items: center;
			padding: 0.8rem 1rem;
		}
		.rail-collapsed .rail-brand-text {
			display: inline;
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

	@media (prefers-reduced-motion: reduce) {
		.admin-shell,
		.admin-rail,
		.rail-toggle {
			transition: none;
		}
	}
</style>

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
	import { scale, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { logout } from '$lib/auth';
	import { getCurrentAdmin } from '$lib/teamStore.svelte';
	import {
		initSeen,
		hasNew as sectionHasNew,
		subHasNew,
		markSeen,
		sectionOf,
		type SectionKey
	} from '$lib/newSections.svelte';

	// Live current-admin record from the shared store (updates when the profile is edited).
	const currentAdmin = $derived(getCurrentAdmin());

	// Per-admin "new section" tracking: seed the seen-set for the current admin, and clear
	// a section's gold dot once THIS admin navigates into it.
	$effect(() => {
		initSeen(currentAdmin.id);
	});
	$effect(() => {
		const section = sectionOf(page.url.pathname);
		if (section) markSeen(section);
	});
	// The section key for a NAV item (from its own href or its first child's href).
	function navSection(item: (typeof NAV)[number]): SectionKey | null {
		return sectionOf(item.href ?? item.children?.[0]?.href ?? '');
	}

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
	import MenuIcon from '$lib/components/icons/MenuIcon.svelte';
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

	// Top-bar search query; the × clear button shows only when there's text. Submitting
	// the search takes the admin to the Pomoć (help / Q&A) page, pre-filtered by the query.
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement | null>(null);
	function clearSearch() {
		searchQuery = '';
		searchInput?.focus();
	}
	function submitSearch(e: SubmitEvent) {
		e.preventDefault();
		const q = searchQuery.trim();
		// Standard search behaviour: an empty query does nothing (no navigation).
		if (!q) return;
		goto(`/nadzorna-ploca/pomoc?q=${encodeURIComponent(q)}`);
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
		{ id: 'n1', title: 'Nova vijest objavljena', detail: 'zekke87 objavio je članak "Dvije sestre, dvije srebrne medalje".', when: 'prije 2 h', href: '/nadzorna-ploca/vijesti' },
		{ id: 'n2', title: 'Novi događaj u rasporedu', detail: 'Dodano natjecanje "CEC 2. kolo" (4. srpnja).', when: 'prije 5 h', href: '/nadzorna-ploca/raspored' },
		{ id: 'n3', title: 'Uređen profil streličara', detail: 'Joškica Pupić ažurirao je biografiju za Elu Drožđek.', when: 'jučer', href: '/nadzorna-ploca/momcad' },
		{ id: 'n4', title: 'Novi upit za sponzorstvo', detail: 'Pristigao je upit od tvrtke Termoplast d.o.o.', when: 'jučer', href: '/nadzorna-ploca/upiti' },
		{ id: 'n5', title: 'Dodano postignuće', detail: 'Novi naslov dodan u kategoriji "Svjetski naslovi".', when: 'prije 2 dana', href: '/nadzorna-ploca/postignuca' },
		{ id: 'n6', title: 'Novi sponzor dodan', detail: 'zekke87 dodao je partnera "Gradnja Nova d.o.o." na popis sponzora.', when: 'prije 3 dana', href: '/nadzorna-ploca/sponzori' }
	];
	let noticesOpen = $state(false);
	const noticeCount = $derived(notifications.length);
	// The bell's red dot means "there are new notifications". It clears once the user
	// OPENS the panel (they've now seen there are notifications), so it doesn't keep
	// nagging on every visit.
	let seenNotices = $state(false);
	// The "Novo (N)" count is a first-time nudge: once the user has opened and then
	// CLOSED the panel, they've seen them all, so on reopen we drop the "(N)" and show
	// just "Novo".
	let noticesClosedOnce = $state(false);
	const hasNew = $derived(noticeCount > 0 && !seenNotices);
	const showNoticeCount = $derived(!noticesClosedOnce);

	function openNotices() {
		noticesOpen = true;
		seenNotices = true; // opening acknowledges the red dot
	}
	function closeNotices() {
		if (noticesOpen) noticesClosedOnce = true; // first close hides the "(N)" on reopen
		noticesOpen = false;
	}
	function toggleNotices() {
		if (noticesOpen) closeNotices();
		else openNotices();
	}
	// Lock the page from scrolling behind an OPEN overlay on mobile (the notifications sheet
	// or the hamburger menu). Toggles a body class; the CSS sets overflow:hidden. Guarded to
	// the browser (no document during SSR).
	$effect(() => {
		if (typeof document === 'undefined') return;
		const lock = noticesOpen || menuOpen;
		document.body.classList.toggle('overlay-open', lock);
		return () => document.body.classList.remove('overlay-open');
	});
	// Respect the OS "reduce motion" setting — skip the open/close animation then.
	const reduceMotion =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	const noticeAnim = reduceMotion
		? { start: 1, duration: 0 }
		: { start: 0.95, duration: 160, easing: cubicOut };
	// Close the dropdown on an outside click or Escape (both count as the user having
	// closed it → the "(N)" count drops on reopen).
	function onWindowClick(e: MouseEvent) {
		if (!noticesOpen) return;
		const t = e.target as HTMLElement;
		if (!t.closest('.notif')) closeNotices();
	}
	function onWindowKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeNotices();
			closeMenu();
		}
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
				{ label: 'Svi događaji', href: '/nadzorna-ploca/raspored/svi' },
				{ label: 'Nacrti', href: '/nadzorna-ploca/raspored/nacrti' },
				{ label: 'Razina', href: '/nadzorna-ploca/raspored/kategorije' },
				{ label: 'Novi događaj', href: '/nadzorna-ploca/raspored/novi' }
			]
		},
		{
			label: 'Momčad',
			icon: PersonIcon,
			children: [
				{ label: 'Svi streličari', href: '/nadzorna-ploca/momcad/svi' },
				{ label: 'Nacrti', href: '/nadzorna-ploca/momcad/nacrti' },
				{ label: 'Novi streličar', href: '/nadzorna-ploca/momcad/novi' }
			]
		},
		{
			label: 'Postignuća',
			icon: TrophyIcon,
			children: [
				{ label: 'Sva postignuća', href: '/nadzorna-ploca/postignuca/sva' },
				{ label: 'Novo postignuće', href: '/nadzorna-ploca/postignuca/novo' }
			]
		},
		{
			label: 'Sponzori',
			icon: HandshakeIcon,
			children: [
				{ label: 'Svi sponzori', href: '/nadzorna-ploca/sponzori/svi' },
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

	// A group's SECTION ROOT is the folder its child pages live in, e.g. the Postignuća
	// children (/nadzorna-ploca/postignuca/sva, …/novo) share /nadzorna-ploca/postignuca.
	// Deriving it from the first child (drop the last segment) lets us recognise routes
	// that belong to the section but aren't one of the listed sub-options — most notably
	// the edit pages (/nadzorna-ploca/postignuca/uredi/[id]).
	const groupSectionRoot = (item: (typeof NAV)[number]): string | null => {
		const first = item.children?.[0]?.href;
		if (!first) return null;
		return first.slice(0, first.lastIndexOf('/'));
	};

	// Accordion state for the expandable groups. Multiple groups may be open at once;
	// `openGroups` is the set of open group labels. Which group contains the ACTIVE
	// route (the one that owns the current page) — matched on the section root so an
	// edit page (…/uredi/[id]) keeps its parent submenu open even though it isn't one
	// of the listed sub-options.
	const activeGroupLabel = $derived(
		NAV.find((item) => {
			const root = groupSectionRoot(item);
			return root ? page.url.pathname.startsWith(root + '/') : false;
		})?.label ?? null
	);
	let openGroups = $state<Set<string>>(new Set());
	// On an ACTUAL route change (a navigating item was clicked — a sub-option or a
	// plain link), close every OTHER submenu and keep only the group that owns the
	// new route open. Guard on `lastActiveGroup` so this reacts to navigation only,
	// NOT to manual parent toggles — otherwise opening a second group would snap shut.
	// Between navigations the set is free: the user can open any number of groups, and
	// opening one never closes the active group (the reset happens on navigation only).
	let lastActiveGroup = $state<string | null>(null);
	$effect(() => {
		if (activeGroupLabel !== lastActiveGroup) {
			lastActiveGroup = activeGroupLabel;
			// Reset to just the active group (or nothing, for a plain-link route).
			openGroups = new Set(activeGroupLabel ? [activeGroupLabel] : []);
		}
	});
	// Toggle a single group open/closed, independently of the others. The active
	// group is not special here — clicking its own parent may collapse it (it stays
	// the "you are here" anchor); it reopens on the next navigation into it.
	function toggleGroup(label: string) {
		const next = new Set(openGroups);
		if (next.has(label)) next.delete(label);
		else next.add(label);
		openGroups = next;
	}

	// Sidebar collapse (item 14): the blue rail slides fully off-canvas and the
	// content takes the full width. A half-stick-out chevron button toggles it and
	// stays reachable at the screen's left edge while collapsed.
	let railCollapsed = $state(false);
	function toggleRail() {
		railCollapsed = !railCollapsed;
	}

	// ── Mobile hamburger menu (≤900px) ──────────────────────────────────────────
	// Below 900px the blue rail is replaced by a full-screen overlay menu opened from a
	// hamburger in the top bar. The search bar moves to the TOP of this menu and logout to
	// the BOTTOM; the top bar itself keeps only hamburger + bell + avatar. The menu closes
	// on navigation (a route change), on Escape, and on the × / backdrop.
	let menuOpen = $state(false);
	function openMenu() {
		menuOpen = true;
	}
	function closeMenu() {
		menuOpen = false;
	}
	// Close the overlay whenever the route changes (any nav pick inside it navigates).
	$effect(() => {
		// Touch the pathname so this re-runs on navigation, then close.
		void page.url.pathname;
		menuOpen = false;
	});

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
						open={openGroups.has(item.label)}
						hasNew={navSection(item) ? sectionHasNew(navSection(item)!) : false}
						{subHasNew}
						onToggle={() => toggleGroup(item.label)}
					/>
				{:else}
					<RailLink
						href={item.href}
						label={item.label}
						icon={item.icon}
						active={isActive(item.href)}
						compact={railCollapsed}
						hasNew={navSection(item) ? sectionHasNew(navSection(item)!) : false}
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
			<!-- Hamburger: opens the full-screen menu. Only shown ≤900px (CSS). -->
			<button
				class="topbar-hamburger"
				type="button"
				onclick={openMenu}
				aria-label="Otvori izbornik"
				aria-expanded={menuOpen}
			>
				<MenuIcon size={28} />
			</button>

			<form class="search-pill display-f align-items-stretch" role="search" onsubmit={submitSearch}>
				<input
					class="search-input"
					type="search"
					placeholder="Pretraži pomoć…"
					aria-label="Pretraži pomoć"
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
								{#if showNoticeCount}
									<span class="notif-count">({noticeCount})</span>
								{/if}
							</div>
							<div class="notif-list column-nowrap gap-0-6 custom-scrollbar">
								{#each notifications as n (n.id)}
									<NoticeItem notice={n} onNavigate={closeNotices} />
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

<!-- ── Mobile full-screen menu (≤900px) ────────────────────────────────────────
     A full-viewport overlay opened by the top-bar hamburger. Search sits at the top,
     the section nav in the middle (reusing the same RailLink/RailGroup), and logout at
     the bottom. Kept in the DOM tree only while open. Blue to match the desktop rail. -->
{#if menuOpen}
	<div
		class="mobile-menu bg-blue-dress column-nowrap"
		role="dialog"
		aria-modal="true"
		aria-label="Izbornik"
		transition:fly={{ x: '-100%', duration: 260, easing: cubicOut, opacity: 1 }}
	>
		<div class="mm-head display-f align-items-center justify-content-space-between">
			<div class="rail-brand mm-brand display-f align-items-center gap-0-7">
				<span class="rail-brand-icon"><GridIcon size={32} /></span>
				<span class="rail-brand-text">Nadzorna ploča</span>
			</div>
			<button class="mm-close" type="button" onclick={closeMenu} aria-label="Zatvori izbornik">
				<CloseIcon size={28} />
			</button>
		</div>

		<!-- Search moved into the menu (top). -->
		<form class="search-pill mm-search display-f align-items-stretch" role="search" onsubmit={submitSearch}>
			<input
				class="search-input"
				type="search"
				placeholder="Pretraži pomoć…"
				aria-label="Pretraži pomoć"
				bind:value={searchQuery}
			/>
			{#if searchQuery}
				<button class="search-clear" type="button" aria-label="Očisti pretragu" onclick={clearSearch}>
					<CloseIcon size={24} />
				</button>
			{/if}
			<button class="search-btn" type="submit" aria-label="Pretraži">
				<SearchIcon size={26} />
			</button>
		</form>

		<nav class="mm-nav column-nowrap shadow-none custom-scrollbar" aria-label="Glavni izbornik">
			{#each NAV as item (item.label)}
				{#if item.children}
					<RailGroup
						label={item.label}
						icon={item.icon}
						items={item.children}
						open={openGroups.has(item.label)}
						hasNew={navSection(item) ? sectionHasNew(navSection(item)!) : false}
						{subHasNew}
						onToggle={() => toggleGroup(item.label)}
					/>
				{:else}
					<RailLink
						href={item.href}
						label={item.label}
						icon={item.icon}
						active={isActive(item.href)}
						hasNew={navSection(item) ? sectionHasNew(navSection(item)!) : false}
					/>
				{/if}
			{/each}
		</nav>

		<!-- Logout at the bottom of the menu. -->
		<button class="mm-logout display-f align-items-center gap-0-7" type="button" onclick={handleLogout} disabled={loggingOut}>
			<LogoutIcon size={24} />
			<span>Odjava</span>
		</button>
	</div>
{/if}

<style>
	/* Layout shell — rail + body. Colours that map to the library palette use
	   utility classes in the markup (bg-blue-dress, bg-white-smoke, …); the
	   structural CSS lives here. */
	.admin-shell {
		display: grid;
		grid-template-columns: 280px 1fr;
		/* Fixed to the viewport so the PAGE never scrolls — only designated inner divs
		   (Hitno, the article table, a tall textarea, …) scroll. Bounding the shell here
		   (base layout) makes every page share the same frame + bottom gap, so it never
		   needs per-page height tuning. */
		height: 100dvh;
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
	/* ---- Body (topbar + content) ---- column-nowrap via utility. Bounded to the shell
	   height so .admin-content fills the space below the top bar (min-height:0 lets the
	   content area shrink and delegate overflow to its inner scroll divs). */
	.admin-body {
		min-width: 0;
		min-height: 0;
	}

	/* ---- Top bar ---- */
	/* White strip so the search/user chrome reads as a distinct surface above the
	   grey content area below. Layout via utilities (display-f align-items-center
	   justify-content-space-between gap-1-5). */
	.admin-topbar {
		padding: 0.7rem 3rem;
		background: #ffffff;
	}

	/* Hamburger: desktop-hidden; revealed ≤900px (see the responsive block). */
	.topbar-hamburger {
		display: none;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		padding: 0.4rem;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: #102e66;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}
	.topbar-hamburger:hover {
		background: rgba(16, 46, 102, 0.08);
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
	/* Red dot (#19): shown when there are new notifications. A pure 10px disc with
	   border-radius 50% — the white ring is a box-shadow (sits OUTSIDE the shape), not a
	   border: a border on a tiny element antialiases into a rounded-square look. */
	.notif-dot {
		position: absolute;
		top: 0.15rem;
		right: 0.15rem;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #e60023; /* state-red */
		box-shadow: 0 0 0 2px #fff;
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
	   (column-nowrap gap-0-6). Scrollbar styling comes from the shared
	   `.custom-scrollbar` class (library). */
	.notif-list {
		padding: 1rem;
		max-height: 31.3rem; /* shows exactly 5 items; the 6th+ are fully clipped out of view (scroll to reach) */
		overflow-y: auto;
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
	/* The shared padded frame for EVERY page. The page never scrolls: this area is
	   bounded to the remaining viewport height and clips overflow — each page delegates
	   its overflow to a designated inner scroll div. The 2rem bottom padding is the
	   shared bottom gap all pages inherit (no per-page tuning). */
	.admin-content {
		position: relative; /* anchor for the top-left toast stack */
		flex: 1 1 auto; /* fill the body height below the top bar */
		min-height: 0; /* allow inner scroll children to bound to this height */
		overflow: hidden; /* page doesn't scroll; inner divs do */
		display: flex;
		flex-direction: column;
		padding: 2rem 9.5rem 2rem 3rem; /* wider right gap to the screen edge */
		background: #e2e8f0;
	}
	/* The page content wrapper fills the content frame so a page's own scroll div can
	   bound to the available height. Direct page children (the <section>) stretch. */
	.admin-content > :global(section) {
		min-height: 0;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
	}

	/* ── Mobile full-screen menu overlay (≤900px) ─────────────────────────────────
	   A full-viewport blue panel opened by the top-bar hamburger. Structure: brand + ×,
	   then the search pill, the scrollable section nav, and logout pinned at the bottom. */
	.mobile-menu {
		position: fixed;
		inset: 0;
		z-index: 100;
		color: #fff;
		padding: 1rem 1.1rem calc(1rem + env(safe-area-inset-bottom));
		gap: 0.6rem;
		/* Use the small-viewport unit so mobile browser chrome doesn't clip the bottom. */
		height: 100dvh;
	}
	.mm-head {
		flex: 0 0 auto;
		padding: 0.25rem 0.25rem 0.5rem;
	}
	.mm-brand {
		padding: 0;
		font-weight: 700;
		font-size: 1.3rem;
		white-space: nowrap;
	}
	.mm-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.14);
		color: #fff;
		cursor: pointer;
		flex: 0 0 auto;
	}
	.mm-close:hover {
		background: rgba(255, 255, 255, 0.24);
	}
	/* Search pill inside the menu: same .search-pill, but roomier — taller, more left
	   padding on the input and a wider search button so it isn't cramped. */
	.mm-search {
		flex: 0 0 auto;
		max-width: none;
		margin: 0.25rem 0 0.5rem;
		min-height: 3.1rem;
		padding-left: 1.5rem;
	}
	.mm-search :global(.search-input) {
		font-size: 1.05rem;
	}
	.mm-search :global(.search-btn) {
		width: 4.2rem;
	}
	/* Scrollable nav fills the space between search and logout. */
	.mm-nav {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		gap: 0.15rem;
		padding-right: 0.25rem;
	}
	/* Logout row pinned at the bottom. */
	.mm-logout {
		flex: 0 0 auto;
		width: 100%;
		padding: 0.9rem 0.9rem;
		border: none;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
		font-family: inherit;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}
	.mm-logout:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.22);
	}
	.mm-logout:disabled {
		opacity: 0.6;
		cursor: default;
	}

	/* ---- Responsive: ≤900px → hide the desktop rail, use the hamburger overlay ---- */
	@media (max-width: 900px) {
		/* Lock page scroll behind an open overlay (notifications sheet / hamburger menu) so
		   scrolling the overlay doesn't bleed into the page behind it. */
		:global(body.overlay-open) {
			overflow: hidden;
		}
		/* Single column: the blue rail is gone, content is full-width. */
		.admin-shell,
		.admin-shell.rail-collapsed {
			grid-template-columns: 1fr;
		}
		/* Mobile scroll model: DON'T pin the shell to a fixed 100dvh and clip (that's the
		   desktop "inner divs scroll" model). On phones a fixed dvh fights the browser's
		   hide/show address bar → white gap + snap-back. Instead let the shell grow with its
		   content and the PAGE (body) scroll naturally. */
		.admin-shell {
			height: auto;
			min-height: 100dvh;
		}
		.admin-body {
			min-height: 0;
		}
		.admin-content {
			overflow: visible; /* body scrolls; don't clip the page */
			min-height: 0;
		}
		/* Any per-page section that bounded itself to scroll internally (e.g. profil) should
		   flow naturally now, so the whole page scrolls as one. */
		.admin-content > :global(section) {
			overflow: visible;
			min-height: 0;
		}
		.admin-rail,
		.rail-toggle {
			display: none;
		}
		/* Reveal the hamburger; tighten the top bar. */
		.topbar-hamburger {
			display: inline-flex;
		}
		.admin-topbar {
			padding: 0.7rem 1rem;
			gap: 0.8rem;
		}
		/* On mobile the top-bar search moves INTO the menu; hide the top-bar copy. */
		.admin-topbar .search-pill {
			display: none;
		}
		/* Compact right cluster: keep bell + avatar; drop the name + the top-bar logout
		   (logout lives at the bottom of the menu). */
		.user-name,
		.topbar-logout {
			display: none;
		}
		.topbar-right {
			gap: 0.6rem;
		}
		/* Bigger, clearer "new notifications" dot on the bell (was too small on phones). Keeps
		   the circular pill radius + content-box from the base rule. */
		.notif-dot {
			top: 0.15rem;
			right: 0.15rem;
			width: 11px;
			height: 11px;
		}
		/* Notifications panel: on phones the narrow bell-anchored dropdown (30rem, hugging the
		   right edge) is awkward. Make it a near-full-width sheet fixed just below the top bar,
		   inset from both edges, height-capped to the viewport so the list scrolls inside. */
		.notif-panel {
			position: fixed;
			top: 3.75rem; /* just under the top bar */
			left: 0.75rem;
			right: 0.75rem;
			width: auto;
			max-width: none;
			transform-origin: top right;
		}
		/* Slightly tighter header + smaller title on the sheet. */
		.notif-head {
			padding: 1.1rem 1.25rem 0.9rem;
		}
		.notif-title {
			font-size: 1.35rem;
		}
		.notif-count {
			font-size: 1.15rem;
		}
		/* Show ~4 notices, then scroll. overscroll-behavior:contain stops the scroll from
		   chaining to the page behind once the list hits its top/bottom. */
		.notif-list {
			max-height: 25rem; /* ~4 items */
			overflow-y: auto;
			overscroll-behavior: contain;
			flex: 0 1 auto;
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

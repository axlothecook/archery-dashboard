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
	import { logout } from '$lib/auth';

	import GridIcon from '$lib/components/icons/GridIcon.svelte';
	import NewsIcon from '$lib/components/icons/NewsIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import TrophyIcon from '$lib/components/icons/TrophyIcon.svelte';
	import HandshakeIcon from '$lib/components/icons/HandshakeIcon.svelte';
	import MailIcon from '$lib/components/icons/MailIcon.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import BellIcon from '$lib/components/icons/BellIcon.svelte';

	let { data, children } = $props();

	// Dashboard sections (built incrementally; hrefs may 404 until their editor
	// exists). Each pairs a real admin area with a reusable icon component.
	const NAV = [
		{ label: 'Nadzorna ploča', href: '/admin/nadzorna-ploca', icon: GridIcon },
		{ label: 'Vijesti', href: '/admin/vijesti', icon: NewsIcon },
		{ label: 'Raspored', href: '/admin/raspored', icon: CalendarIcon },
		{ label: 'Momčad', href: '/admin/momcad', icon: PersonIcon },
		{ label: 'Postignuća', href: '/admin/postignuca', icon: TrophyIcon },
		{ label: 'Sponzori', href: '/admin/sponzori', icon: HandshakeIcon },
		{ label: 'Upiti', href: '/admin/upiti', icon: MailIcon }
	];

	// Active when the current path equals the item (exact) or is nested under it.
	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(href + '/');

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

<svelte:head>
	<title>Admin · VSK</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="admin-shell bg-white-smoke">
	<!-- Blue icon rail -->
	<aside class="admin-rail bg-blue-dress">
		<div class="rail-brand">
			<GridIcon size={26} />
			<span class="rail-brand-text">Dashboard</span>
		</div>

		<nav class="rail-nav" aria-label="Glavni izbornik">
			{#each NAV as item (item.href)}
				<a href={item.href} class="rail-link" class:active={isActive(item.href)}>
					<span class="rail-icon"><item.icon size={22} /></span>
					<span class="rail-label">{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="rail-foot">
			<button class="rail-link rail-logout" onclick={handleLogout} disabled={loggingOut}>
				<span class="rail-label">{loggingOut ? 'Odjava…' : 'Odjava'}</span>
			</button>
		</div>
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
				/>
				<button class="search-btn" type="submit" aria-label="Pretraži">
					<SearchIcon size={20} />
				</button>
			</form>

			<div class="topbar-right">
				<button class="topbar-bell" aria-label="Obavijesti">
					<BellIcon size={22} />
				</button>
				<div class="topbar-user">
					<span class="user-avatar bg-blue-dress-light-5">{initials || 'A'}</span>
					<span class="user-name">{data.admin.workName}</span>
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
		grid-template-columns: 248px 1fr;
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
		gap: 0.7rem;
		font-weight: 700;
		font-size: 1.35rem;
		padding: 0 0.5rem 1.5rem;
	}
	.rail-nav {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		flex: 1 0 auto;
	}
	.rail-link {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.75rem 0.85rem;
		border-radius: 10px;
		color: #fff;
		text-decoration: none;
		font-size: 1.02rem;
		font-weight: 500;
		font-family: inherit;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}
	.rail-icon {
		display: inline-flex;
		width: 22px;
		justify-content: center;
		opacity: 0.92;
	}
	.rail-link:hover {
		background: rgba(255, 255, 255, 0.16);
	}
	.rail-link.active {
		background: #fff;
		color: #187ff5; /* blue-dress — chip reads as "active" against the blue rail */
		font-weight: 600;
	}
	.rail-foot {
		margin-top: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.22);
	}
	.rail-logout {
		width: 100%;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
	}
	.rail-logout:disabled {
		opacity: 0.6;
		cursor: default;
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
		padding: 1.4rem 2rem;
		background: #ffffff;
	}

	/* Search: input + button share ONE pill container; the button sits inside,
	   right-aligned, and the whole thing keeps the rounded-pill look. */
	.search-pill {
		display: flex;
		align-items: center;
		flex: 1 1 auto;
		max-width: 720px;
		background: #e2e8f0;
		border-radius: 999px;
		padding: 0.35rem 0.6rem 0.35rem 1.2rem;
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
	}
	.search-input::placeholder {
		color: #9aa3b2;
	}
	/* No coloured fill — just a thin left border separating it from the input. */
	.search-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.4rem;
		height: 2.4rem;
		border: none;
		border-left: 1px solid rgba(16, 46, 102, 0.18);
		border-radius: 0;
		padding-left: 0.6rem;
		margin-left: 0.4rem;
		background: transparent;
		color: #102e66;
		cursor: pointer;
		flex: 0 0 auto;
		transition: color 0.15s ease;
	}
	.search-btn:hover {
		color: #187ff5; /* blue-dress on hover */
	}

	.topbar-right {
		display: flex;
		align-items: center;
		gap: 1.4rem;
		flex: 0 0 auto;
	}
	.topbar-bell {
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

	/* ---- Content ---- */
	.admin-content {
		padding: 0 2rem 2rem;
		overflow-y: auto;
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
		.rail-logout .rail-label {
			display: inline;
		}
		.rail-foot {
			margin: 0;
			padding: 0;
			border: none;
		}
		.admin-topbar {
			padding: 1rem;
			gap: 0.8rem;
		}
		.user-name {
			display: none;
		}
		.admin-content {
			padding: 0 1rem 1.25rem;
		}
	}
</style>

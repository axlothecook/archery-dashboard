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
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import MailAltIcon from '$lib/components/icons/MailAltIcon.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';
	import TaskSquareIcon from '$lib/components/icons/TaskSquareIcon.svelte';
	import TeamIcon from '$lib/components/icons/TeamIcon.svelte';
	import TeamMember from '$lib/components/TeamMember.svelte';
	import UrgentItem from '$lib/components/UrgentItem.svelte';
	import SchedulePanel from '$lib/components/SchedulePanel.svelte';
	import TasksPanel from '$lib/components/TasksPanel.svelte';
	import MailPanel from '$lib/components/MailPanel.svelte';
	import { team, getCurrentAdmin } from '$lib/teamStore.svelte';
	import type { Urgent } from '$lib/urgent';

	// Component refs so the outside heading rows can drive the panels.
	let tasksPanel = $state<TasksPanel>();
	let schedule = $state<SchedulePanel>();
	// Week-nav bounds from the schedule panel: only the current month is browsable,
	// so the corresponding arrow is hidden at the month's first/last week.
	let canPrevWeek = $state(true);
	let canNextWeek = $state(true);

	// ── Greeting header (item 16) ────────────────────────────────────────────────
	// Croatian date line + time-of-day greeting + the signed-in admin's name, mirrored
	// from the reference dashboard. Computed once on mount from the current time.
	const now = new Date();
	const HR_DAYS = [
		'Nedjelja',
		'Ponedjeljak',
		'Utorak',
		'Srijeda',
		'Četvrtak',
		'Petak',
		'Subota'
	];
	const HR_MONTHS = [
		'siječnja',
		'veljače',
		'ožujka',
		'travnja',
		'svibnja',
		'lipnja',
		'srpnja',
		'kolovoza',
		'rujna',
		'listopada',
		'studenoga',
		'prosinca'
	];
	// Month shown Capitalized (user preference). e.g. "Četvrtak, 2. Srpnja 2026."
	const monthName = HR_MONTHS[now.getMonth()];
	const monthCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
	const dateLine = `${HR_DAYS[now.getDay()]}, ${now.getDate()}. ${monthCap} ${now.getFullYear()}.`;

	// Time-of-day greeting. Bands follow Unicode CLDR's Croatian day periods
	// (authoritative): jutro 5–11, dan 12–17, večer 18–21, noć 22–4. `getHours()`
	// is the device's LOCAL hour (0–23). Exclusive upper edges → no gaps (the old
	// `<12 / 18+` logic left 17:00–18:00 unassigned). Each band randomly picks one
	// of two gender-neutral phrases (Croatian gender-agrees on participles and the
	// admin's gender isn't stored, so all options avoid gendered forms). Croatian
	// has NO native *hello* for the small hours ("Laku noć" is a farewell only, per
	// HJP), so the night band pairs the safe evening hello with a playful "Noćna
	// sova?" (= night owl?). `{name}` is the admin's display name.
	const adminName = $derived(getCurrentAdmin().displayName);
	const h = now.getHours();
	function greetingPool(name: string): string[] {
		if (h >= 5 && h < 12) return [`Dobro jutro, ${name}`, `Vrijeme za kavu, ${name}?`];
		if (h >= 12 && h < 18) return [`Dobar dan, ${name}`, `Drago nam je vidjeti te, ${name}`];
		if (h >= 18 && h < 22) return [`Dobra večer, ${name}`, `Kakav je bio dan, ${name}?`];
		return [`Dobra večer, ${name}`, `Noćna sova, ${name}?`]; // night (22–04)
	}
	// Pick one at load. Math.random is fine at runtime (this is app code, not a
	// resumable workflow script).
	const greeting = $derived.by(() => {
		const pool = greetingPool(adminName);
		return pool[Math.floor(Math.random() * pool.length)];
	});

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
	<!-- Main column: greeting (item 16) + tasks table (21) + schedule (20) -->
	<section class="dash-main">
		<!-- Greeting: date + time-of-day greeting + admin name. -->
		<header class="greeting">
			<p class="greeting-date text-jet-grey fz-1-1">{dateLine}</p>
			<h1 class="greeting-title text-deep-sapphire fz-2-5">{greeting}</h1>
		</header>
		<!-- Tasks table (item 21): heading + "Dodaj zadatak" sit OUTSIDE the panel, on
		     one row at opposite ends (like Hitno/Tim headings). -->
		<div class="dash-heading-row display-f align-items-center justify-content-space-between">
			<h2 class="dash-heading display-f align-items-center gap-0-5">
				<span class="head-ico"><TaskSquareIcon size={22} /></span>
				Zadaci
			</h2>
			<button class="tasks-add cursor-pointer display-f align-items-center gap-0-4" type="button" onclick={() => tasksPanel?.openAdd()}>
				<AddIcon size={18} />
				Dodaj zadatak
			</button>
		</div>
		<TasksPanel bind:this={tasksPanel} />

		<!-- Schedule (item 20) + incoming mail, side by side (each half the width). -->
		<div class="lower-row grid grid-cols-2 gap-2">
			<div>
				<div class="dash-heading-row display-f align-items-center justify-content-space-between">
					<h2 class="dash-heading display-f align-items-center gap-0-5">
						<span class="head-ico"><CalendarIcon size={22} /></span>
						Raspored
					</h2>
					<div class="display-f align-items-center gap-0-5">
						<button
							class="week-arrow cursor-pointer"
							class:is-hidden={!canPrevWeek}
							type="button"
							aria-label="Prethodni tjedan"
							onclick={() => schedule?.prevWeek()}
						>
							<ChevronIcon direction="left" size={20} />
						</button>
						<button
							class="week-arrow cursor-pointer"
							class:is-hidden={!canNextWeek}
							type="button"
							aria-label="Sljedeći tjedan"
							onclick={() => schedule?.nextWeek()}
						>
							<ChevronIcon direction="right" size={20} />
						</button>
					</div>
				</div>
				<SchedulePanel bind:this={schedule} bind:canPrev={canPrevWeek} bind:canNext={canNextWeek} />
			</div>
			<div>
				<div class="dash-heading-row display-f align-items-center">
					<h2 class="dash-heading display-f align-items-center gap-0-5">
						<span class="head-ico"><MailAltIcon size={22} /></span>
						Dolazna pošta
					</h2>
				</div>
				<MailPanel />
			</div>
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

		<h2 class="dash-heading mt display-f align-items-center gap-0-5">
			<span class="head-ico"><TeamIcon size={22} /></span>
			Tim
		</h2>
		<div class="panel bg-white team-list column-nowrap gap-1-1">
			{#each team as t (t.id)}
				<TeamMember member={t} />
			{/each}
		</div>
	</aside>
</div>

<style>
	/* Greeting header (item 16): colour + font-size via utilities; spacing scoped. */
	/* Top gap = the content area's 2rem top padding + this small margin (a touch more
	   breathing room below the topbar); bottom gap = 2rem down to the cards. */
	.greeting {
		margin-top: 0.6rem;
		margin-bottom: 2rem;
	}
	.greeting-date {
		margin: 0 0 0.45rem;
	}
	.greeting-title {
		margin: 0;
		font-weight: 700;
		line-height: 1.2;
	}

	/* Layout (grid gap-2 align-items-start) via utility classes; only the
	   asymmetric fractional track (content ~75% / Hitno-Tim ~25%) stays scoped. */
	.dash {
		grid-template-columns: 3fr 1fr;
	}
	/* Extra breathing room between the right (Hitno/Tim) column and the screen edge
	   (the fractional track absorbs the margin). The top margin drops "Hitno" down so
	   it lines up with the greeting TITLE line (past the date), not the date. */
	.dash-side {
		/* Greeting's own margin-top (0.6rem) + the date line's height incl. its
		   margin-bottom (1.55rem), so "Hitno" stays aligned with the greeting TITLE. */
		margin-top: 2.15rem;
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
	/* Heading row: title on the left, an action (Dodaj zadatak / week arrows) on the
	   right — the heading's own bottom margin spaces it from the panel below. The
	   min-height (= the 2rem action buttons) keeps rows with and without an action
	   the same height, so the title→panel gap is equal across panels. */
	.dash-heading-row {
		min-height: 2rem;
		margin-bottom: 1rem;
	}
	.dash-heading-row .dash-heading {
		margin-bottom: 0;
	}
	.head-ico {
		display: inline-flex;
		align-items: center;
		color: #102e66;
	}

	/* "Dodaj zadatak" (now outside the panel). */
	.tasks-add {
		padding: 0.5rem 0.9rem;
		border: 0;
		border-radius: 8px;
		background: #102e66;
		color: #fff;
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
	}
	.tasks-add:hover {
		background: #0c2350;
	}

	/* Week-nav arrows (outside the schedule panel). */
	.week-arrow {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid #d7dee8;
		border-radius: 50%;
		background: #fff;
		color: #102e66;
		transition: background-color 0.15s ease;
	}
	.week-arrow:hover {
		background: #eef1f3;
	}
	/* At the month's first/last week the corresponding arrow is hidden (keeps its
	   slot so the other arrow doesn't shift). */
	.week-arrow.is-hidden {
		visibility: hidden;
		pointer-events: none;
	}

	/* Lower row: schedule + mail side by side, each half the tasks width. Extra top
	   gap separates it from the tasks panel above. */
	.lower-row {
		margin-top: 2.5rem;
		align-items: start;
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

	/* ---- Team list (column-nowrap gap-1-1 via utilities; rows are <TeamMember>) ----
	   min-height so the Tim panel's bottom lines up with the Raspored + Dolazna pošta
	   panels below-left (which are 20rem tall but start higher). */
	.team-list {
		min-height: 17.3rem;
	}

	/* ---- Responsive ---- */
	@media (max-width: 1100px) {
		.dash {
			grid-template-columns: 1fr;
		}
		.dash-side {
			margin-right: 0; /* single column: no asymmetric right margin */
		}
	}
</style>

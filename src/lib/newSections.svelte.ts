// Per-admin "there's something new here" tracking for the sidebar dots.
//
// A sidebar category shows a slow-blinking GOLD dot when its section has new
// content that THIS admin hasn't looked at yet. Opening a section clears its dot
// FOR THIS SESSION. The seen-set is intentionally in-memory only (NOT persisted):
// it resets on every fresh page load / login, so the demo dots reappear each session
// and clear again as the admin visits each section. For now the set of
// sections-with-new is DEMO data (see NEW_SECTIONS below) — no backend.
//
// TODO (on adoption): replace the demo NEW_SECTIONS with a real backend check
// ("section has content newer than this admin's lastSeen"), persisted per-admin
// server-side so it works across devices. See the if-adopted features list.

// Section keys = the sidebar category slugs (the first path segment under
// /nadzorna-ploca). Everything except "pocetno" can carry a dot.
export type SectionKey =
	| 'vijesti'
	| 'raspored'
	| 'momcad'
	| 'postignuca'
	| 'sponzori'
	| 'upiti'
	| 'administracija';

// DEMO: which sections currently have "new" content. In a real build this comes
// from the backend (newest item per section vs this admin's lastSeen). Kept in sync
// with the placeholder notifications on the Početno page so the demo reads coherently.
const NEW_SECTIONS: SectionKey[] = ['vijesti', 'raspored', 'momcad', 'upiti', 'sponzori'];

// DEMO: for a section that has a SUBMENU, which specific sub-option href carries the
// new content. When the parent group's gold dot shows and the admin expands it, the dot
// moves onto this exact sub-option so they see where the new item lives. A section not
// listed here (or a plain link with no submenu) just shows the dot on the parent.
// (Real build: derive per sub-view from the backend.) Keys are SectionKeys with a submenu.
const NEW_SUBSECTION_HREF: Partial<Record<SectionKey, string>> = {
	vijesti: '/nadzorna-ploca/vijesti/objavljeno',
	raspored: '/nadzorna-ploca/raspored/svi',
	momcad: '/nadzorna-ploca/momcad/svi',
	sponzori: '/nadzorna-ploca/sponzori/svi'
};

// Reactive seen-set for the active admin — IN-MEMORY only (resets each page load /
// session), so the demo gold dots come back every fresh session.
let seen = $state<Set<SectionKey>>(new Set());
let activeAdminId = $state('');

/** Point the store at the current admin. Starts each session with a CLEAR seen-set
 *  (dots reappear on a fresh load); switching admin also resets it. */
export function initSeen(adminId: string) {
	if (adminId === activeAdminId) return;
	activeAdminId = adminId;
	seen = new Set();
}

/** True when a section has new content this admin hasn't opened yet. */
export function hasNew(section: SectionKey): boolean {
	return NEW_SECTIONS.includes(section) && !seen.has(section);
}

/** True when THIS submenu sub-option is the one carrying the section's new content and the
 *  section is still unseen — so an expanded group shows the gold dot on the exact sub-view. */
export function subHasNew(href: string): boolean {
	const section = sectionOf(href);
	if (!section || !hasNew(section)) return false;
	return NEW_SUBSECTION_HREF[section] === href;
}

/** Mark a section seen for the active admin (clears its dot for this session). */
export function markSeen(section: SectionKey) {
	if (!NEW_SECTIONS.includes(section) || seen.has(section)) return;
	const next = new Set(seen);
	next.add(section);
	seen = next;
}

/** The section key a dashboard path belongs to (first segment under the shell). */
export function sectionOf(pathname: string): SectionKey | null {
	const m = pathname.match(/^\/nadzorna-ploca\/([^/]+)/);
	const key = m?.[1] as SectionKey | undefined;
	const known: SectionKey[] = [
		'vijesti',
		'raspored',
		'momcad',
		'postignuca',
		'sponzori',
		'upiti',
		'administracija'
	];
	return key && known.includes(key) ? key : null;
}

// Per-admin "there's something new here" tracking for the sidebar dots.
//
// A sidebar category shows a slow-blinking GOLD dot when its section has new
// content that THIS admin hasn't looked at yet. "Seen" is per-admin: if admin A
// opens a section the dot clears for A, but admin B still sees it until B opens it
// too. For now the set of sections-with-new is DEMO data (see NEW_SECTIONS below),
// and the per-admin seen state lives in localStorage keyed by admin id — no backend.
//
// TODO (on adoption): replace the demo NEW_SECTIONS with a real backend check
// ("section has content newer than this admin's lastSeen"), persisted per-admin
// server-side so it works across devices. See the if-adopted features list.

import { browser } from '$app/environment';

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

const storageKey = (adminId: string) => `vsk:seen-sections:${adminId}`;

function loadSeen(adminId: string): Set<SectionKey> {
	if (!browser || !adminId) return new Set();
	try {
		const raw = localStorage.getItem(storageKey(adminId));
		return new Set(raw ? (JSON.parse(raw) as SectionKey[]) : []);
	} catch {
		return new Set();
	}
}

function saveSeen(adminId: string, seen: Set<SectionKey>) {
	if (!browser || !adminId) return;
	try {
		localStorage.setItem(storageKey(adminId), JSON.stringify([...seen]));
	} catch {
		// storage full / disabled — non-fatal; the dot just won't persist as seen.
	}
}

// Reactive seen-set for the active admin. A bump counter forces re-derivation in
// consumers when the set changes (Svelte 5 rune-friendly).
let seen = $state<Set<SectionKey>>(new Set());
let activeAdminId = $state('');

/** Point the store at the current admin (call when the admin id is known). */
export function initSeen(adminId: string) {
	if (adminId === activeAdminId) return;
	activeAdminId = adminId;
	seen = loadSeen(adminId);
}

/** True when a section has new content this admin hasn't opened yet. */
export function hasNew(section: SectionKey): boolean {
	return NEW_SECTIONS.includes(section) && !seen.has(section);
}

/** Mark a section seen for the active admin (clears its dot, persists). */
export function markSeen(section: SectionKey) {
	if (!NEW_SECTIONS.includes(section) || seen.has(section)) return;
	const next = new Set(seen);
	next.add(section);
	seen = next;
	saveSeen(activeAdminId, next);
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

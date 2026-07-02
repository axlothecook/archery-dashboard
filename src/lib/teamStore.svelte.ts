// Single shared, reactive source of truth for the dashboard's team + current admin
// PLACEHOLDER data. Because it uses Svelte 5 `$state`, any edit here is reflected
// everywhere the data is shown at once — the Tim list, the top-bar user chip, and
// the profile page all read from this one object. Editing the profile mutates the
// matching team member in place, so the Tim row + chip update live.
//
// Still in-memory (resets on reload) — no backend yet. TODO(adoption): seed from
// GET /admin/team + /auth/me and persist edits via PATCH /profile.
import { roleLetter, type Member } from '$lib/team';

export { roleLetter, type Member };

// The team. m1 is ALSO the signed-in admin shown across the chrome (see
// currentAdminId). Fields except the avatar image are user-entered at account
// creation; the avatar is a colour circle + role letter for now.
export const team = $state<Member[]>([
	{
		id: 'm1',
		displayName: 'Joškica Pupić',
		realName: 'Joškica Pupić',
		role: 'admin',
		email: 'joskica.pupic@vsk.hr',
		phone: '+385 91 234 5678',
		color: 'blue'
	},
	{
		id: 'm2',
		displayName: 'zekke87',
		realName: 'Branimir Miklošić',
		role: 'admin',
		email: 'zekke87@vsk.hr',
		phone: '+385 98 765 4321',
		color: 'purple'
	},
	{
		id: 'm3',
		displayName: 'axlothecook',
		realName: 'Ruby Alliston',
		role: 'developer',
		email: 'axlothecook@vsk.hr',
		phone: '+31 6 1112 2334',
		color: 'green'
	}
]);

// Which team member is the signed-in admin (the one the profile page edits and the
// top-bar chip shows). We deliberately show an ADMIN, not the dev login.
export const CURRENT_ADMIN_ID = 'm1';

// Live reference to the current admin's record within `team` (same object, so
// mutating it updates the Tim list too). Getter keeps it reactive for callers.
export function getCurrentAdmin(): Member {
	return team.find((m) => m.id === CURRENT_ADMIN_ID) ?? team[0];
}

// Apply edited account fields to the current admin in place → reflected everywhere.
// `role` is intentionally not editable (admins don't self-change their role).
export function updateCurrentAdmin(patch: Partial<Omit<Member, 'id' | 'role' | 'color'>>) {
	const admin = getCurrentAdmin();
	Object.assign(admin, patch);
}

// ── Team management (item 24, "Administracija") ──────────────────────────────
// Create / remove staff accounts. Placeholder (in-memory) — TODO(adoption): wire
// to POST/DELETE /admin/team. Avatar colour rotates through the palette keys.
const COLORS: Member['color'][] = ['blue', 'purple', 'green'];
let nextNum = team.length;

export function addMember(m: Omit<Member, 'id' | 'color'>) {
	nextNum += 1;
	team.push({ ...m, id: `m${nextNum}`, color: COLORS[team.length % COLORS.length] });
}

export function removeMember(id: string) {
	const i = team.findIndex((m) => m.id === id);
	if (i !== -1) team.splice(i, 1);
}

// Dashboard-side types + fetch helpers for the Postignuća section. Shapes mirror the
// backend admin DTOs (Archery-club-backend/src/mappers/achievement.ts) from
// GET /admin/achievements. Real data — same DB the public site reads.
import { adminRequest } from '$lib/auth';

export type AchievementScope = 'individual' | 'team' | 'club';
export type AchievementLevel = 'world' | 'european' | 'state' | 'other';
export type AchievementType = 'title' | 'record' | 'other';
export type AchievementMedal = 'gold' | 'silver' | 'bronze';

// Croatian labels for the select options + table badges.
export const SCOPE_LABEL: Record<AchievementScope, string> = {
	individual: 'Pojedinačno',
	team: 'Ekipno',
	club: 'Klupsko'
};
export const LEVEL_LABEL: Record<AchievementLevel, string> = {
	world: 'Svjetsko',
	european: 'Europsko',
	state: 'Državno',
	other: 'Ostalo'
};
export const TYPE_LABEL: Record<AchievementType, string> = {
	title: 'Naslov',
	record: 'Rekord',
	other: 'Plasman'
};
export const MEDAL_LABEL: Record<AchievementMedal, string> = {
	gold: 'Zlato',
	silver: 'Srebro',
	bronze: 'Bronca'
};

// One row in the Sva postignuća table.
export type AchievementAdminRow = {
	id: string;
	year: number;
	scope: AchievementScope;
	level: AchievementLevel;
	type: AchievementType;
	medal: AchievementMedal | null;
	image: { url: string; alt: string } | null;
	title: string;
	archerNames: string[];
};

// The full editable achievement (GET /admin/achievements/:id) for the edit form.
export type AchievementEditData = {
	id: string;
	year: number;
	scope: AchievementScope;
	level: AchievementLevel;
	type: AchievementType;
	medal: AchievementMedal | null;
	imageUrl: string | null;
	imageAlt: string | null;
	archerIds: string[];
	title: string;
};

export type CreateAchievementInput = {
	year: number;
	archerIds: string[];
	scope: AchievementScope;
	level: AchievementLevel;
	type: AchievementType;
	medal: AchievementMedal | null;
	imageUrl: string | null;
	imageAlt: string | null;
	title: string;
};

export function fetchAchievements(
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<AchievementAdminRow[]> {
	return adminRequest<AchievementAdminRow[]>('/admin/achievements', { fetch, headers });
}

export function fetchAchievement(
	id: string,
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<AchievementEditData> {
	return adminRequest<AchievementEditData>(`/admin/achievements/${id}`, { fetch, headers });
}

export function createAchievement(
	input: CreateAchievementInput,
	fetch?: typeof globalThis.fetch
): Promise<{ id: string }> {
	return adminRequest('/admin/achievements', { method: 'POST', body: input, fetch });
}

export function updateAchievement(
	id: string,
	patch: Partial<CreateAchievementInput>,
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest(`/admin/achievements/${id}`, { method: 'PATCH', body: patch, fetch });
}

export function deleteAchievement(id: string, fetch?: typeof globalThis.fetch): Promise<{ ok: true }> {
	return adminRequest(`/admin/achievements/${id}`, { method: 'DELETE', fetch });
}

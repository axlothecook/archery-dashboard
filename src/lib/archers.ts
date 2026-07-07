// Dashboard-side types + fetch helpers for the Momčad (archers) section. Shapes
// mirror the backend admin DTOs (Archery-club-backend/src/mappers/archer.ts) from
// GET /admin/archers (+ /:id). Real data — the same DB the public site reads.
import { adminRequest } from '$lib/auth';

// ── Enums (mirror the backend zod enums) ────────────────────────────────────
export type Bow = 'recurve' | 'compound' | 'barebow';
export type Role = 'archer' | 'coach';
export type Gender = 'male' | 'female';
export type ArcherStatus = 'draft' | 'published';
export type PerformanceScope = 'domestic' | 'global';
export type PerformanceType = 'outdoor' | 'indoor' | 'field' | '3d';
/** Sections an admin can force-hide on the public profile. */
export type HiddenSection = 'bio' | 'stats' | 'performance';

export type ImageRef = { url: string; alt: string };

// ── Croatian labels ─────────────────────────────────────────────────────────
export const BOW_LABEL: Record<Bow, string> = {
	recurve: 'Klasični (recurve)',
	compound: 'Složeni (compound)',
	barebow: 'Goli luk (barebow)'
};
export const ROLE_LABEL: Record<Role, string> = {
	archer: 'Streličar',
	coach: 'Trener'
};
export const GENDER_LABEL: Record<Gender, string> = {
	male: 'Muško',
	female: 'Žensko'
};
export const STATUS_LABEL: Record<ArcherStatus, string> = {
	draft: 'Nacrt',
	published: 'Objavljeno'
};
export const PERF_SCOPE_LABEL: Record<PerformanceScope, string> = {
	domestic: 'Domaće',
	global: 'Međunarodno'
};
export const PERF_TYPE_LABEL: Record<PerformanceType, string> = {
	outdoor: 'Vanjsko',
	indoor: 'Dvoransko',
	field: 'Field',
	'3d': '3D'
};
export const HIDDEN_SECTION_LABEL: Record<HiddenSection, string> = {
	bio: 'Biografija',
	stats: 'Statistika',
	performance: 'Nastupi'
};

// ── Nested row shapes ───────────────────────────────────────────────────────
export type CareerStatInput = {
	id?: string;
	year: number;
	discipline: string;
	averageScore: number | null;
	wins: number;
	losses: number;
	highestScore: number | null;
};

export type PerformanceInput = {
	id?: string;
	date: string; // 'MM/YYYY'
	name: string;
	scope: PerformanceScope;
	type: PerformanceType;
	categories: string[];
	meters: string | null;
	placing: string | null;
	points: number | null;
};

// ── Admin list row (Svi streličari / Nacrti tables) ─────────────────────────
export type ArcherAdminRow = {
	id: string;
	slug: string;
	name: string;
	roles: Role[];
	bowType: Bow[];
	gender: Gender | null;
	competitionCategories: string[];
	order: number;
	status: ArcherStatus;
	hidden: boolean;
	cardPhoto: ImageRef | null;
};

// ── Full editable archer (GET /admin/archers/:id) ───────────────────────────
export type ArcherEditData = {
	id: string;
	slug: string;
	firstName: string;
	lastName: string;
	roles: Role[];
	bowType: Bow[];
	gender: Gender | null;
	competitionCategories: string[];
	order: number;
	cardPhotoUrl: string | null;
	cardPhotoAlt: string | null;
	profilePhotoUrl: string | null;
	profilePhotoAlt: string | null;
	worldArcheryId: string | null;
	birthDate: string | null; // ISO date (yyyy-mm-dd)
	hiddenSections: string[];
	coachIds: string[];
	status: ArcherStatus;
	hidden: boolean;
	bio: string;
	careerStats: Required<CareerStatInput>[];
	performance: Required<PerformanceInput>[];
};

// ── Create / update body (mirror the backend create/update zod bodies) ──────
export type CreateArcherInput = {
	slug?: string;
	firstName: string;
	lastName: string;
	roles: Role[];
	bowType: Bow[];
	gender: Gender | null;
	competitionCategories: string[];
	order: number;
	cardPhotoUrl: string | null;
	cardPhotoAlt: string | null;
	profilePhotoUrl: string | null;
	profilePhotoAlt: string | null;
	worldArcheryId: string | null;
	birthDate: string | null; // ISO; coerced to Date server-side
	hiddenSections: string[];
	coachIds: string[];
	status: ArcherStatus;
	hidden: boolean;
	bio: string;
	careerStats: CareerStatInput[];
	performance: PerformanceInput[];
};

// ── Fetch helpers ───────────────────────────────────────────────────────────
export function fetchArchers(
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<ArcherAdminRow[]> {
	return adminRequest<ArcherAdminRow[]>('/admin/archers', { fetch, headers });
}

export function fetchArcher(
	id: string,
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<ArcherEditData> {
	return adminRequest<ArcherEditData>(`/admin/archers/${id}`, { fetch, headers });
}

export function createArcher(
	input: CreateArcherInput,
	fetch?: typeof globalThis.fetch
): Promise<{ id: string; slug: string }> {
	return adminRequest('/admin/archers', { method: 'POST', body: input, fetch });
}

export function updateArcher(
	id: string,
	patch: Partial<CreateArcherInput>,
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest(`/admin/archers/${id}`, { method: 'PATCH', body: patch, fetch });
}

export function deleteArcher(id: string, fetch?: typeof globalThis.fetch): Promise<{ ok: true }> {
	return adminRequest(`/admin/archers/${id}`, { method: 'DELETE', fetch });
}

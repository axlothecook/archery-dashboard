// Dashboard-side types + fetch helpers for the Raspored (events) section.
// Mirrors src/lib/articles.ts. Shapes mirror the backend admin DTOs
// (Archery-club-backend/src/mappers/club-event.ts) from GET /admin/events and
// GET /admin/event-levels. Real data — same DB the public calendar reads.
import { adminRequest } from '$lib/auth';

export type Discipline = 'outdoor' | 'indoor' | 'field' | '3d';
export type EventStatus = 'draft' | 'published';

export type EventLevelRef = { id: string; name: string; color: string };

// One row in the Svi događaji table.
export type EventAdminRow = {
	id: string;
	name: string;
	discipline: Discipline;
	dateFrom: string; // ISO
	dateTo: string | null; // ISO
	status: EventStatus;
	hidden: boolean;
	isCancelled: boolean;
	image: { url: string; alt: string } | null;
	level: EventLevelRef | null;
	attendeeCount: number;
	hasUnlistedClubAttendee: boolean;
};

// A level from GET /admin/event-levels (Kategorije CRUD + the event-form picker).
export type EventLevelAdminRow = {
	id: string;
	name: string;
	color: string;
	order: number;
	eventCount: number;
};

// Croatian labels for the discipline badge.
export const DISCIPLINE_LABEL: Record<Discipline, string> = {
	outdoor: 'Vanjsko',
	indoor: 'Dvoransko',
	field: 'Field',
	'3d': '3D'
};

// ── Events ───────────────────────────────────────────────────────────────────
export function fetchEvents(
	status: EventStatus | undefined,
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<EventAdminRow[]> {
	const q = status ? `?status=${status}` : '';
	return adminRequest<EventAdminRow[]>(`/admin/events${q}`, { fetch, headers });
}

export type CreateEventInput = {
	discipline: Discipline;
	format: string | null;
	dateFrom: string; // ISO
	dateTo: string | null; // ISO
	imageUrl: string | null;
	imageAlt: string | null;
	sourceUrl: string | null;
	isCancelled: boolean;
	status: EventStatus;
	hidden: boolean;
	location: string | null;
	organizer: string | null;
	levelId: string | null;
	attendingArcherIds: string[];
	hasUnlistedClubAttendee: boolean;
	name: string;
};

export function createEvent(
	input: CreateEventInput,
	fetch?: typeof globalThis.fetch
): Promise<{ id: string }> {
	return adminRequest('/admin/events', { method: 'POST', body: input, fetch });
}

export function deleteEvent(id: string, fetch?: typeof globalThis.fetch): Promise<{ ok: true }> {
	return adminRequest(`/admin/events/${id}`, { method: 'DELETE', fetch });
}

// ── Event levels (Kategorije razina) ─────────────────────────────────────────
export function fetchEventLevels(
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<EventLevelAdminRow[]> {
	return adminRequest<EventLevelAdminRow[]>('/admin/event-levels', { fetch, headers });
}

export function createEventLevel(
	input: { name: string; color: string; order: number },
	fetch?: typeof globalThis.fetch
): Promise<{ id: string }> {
	return adminRequest('/admin/event-levels', { method: 'POST', body: input, fetch });
}

export function updateEventLevel(
	id: string,
	input: Partial<{ name: string; color: string; order: number }>,
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest(`/admin/event-levels/${id}`, { method: 'PATCH', body: input, fetch });
}

export function deleteEventLevel(id: string, fetch?: typeof globalThis.fetch): Promise<{ ok: true }> {
	return adminRequest(`/admin/event-levels/${id}`, { method: 'DELETE', fetch });
}

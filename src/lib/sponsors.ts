// Dashboard-side types + fetch helpers for the Sponzori section. Shapes mirror the
// backend admin DTOs (Archery-club-backend/src/mappers/sponsor.ts) from
// GET /admin/sponsors. Real data — same DB the public site reads.
import { adminRequest } from '$lib/auth';

// One row in the Svi sponzori table (also the full editable shape for the edit form —
// it carries every editable field).
export type SponsorAdminRow = {
	id: string;
	name: string;
	logoUrl: string;
	logoAlt: string;
	website: string | null;
	description: string;
};

export type CreateSponsorInput = {
	name: string;
	logoUrl: string;
	logoAlt: string;
	website: string | null;
	description: string;
};

export function fetchSponsors(
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<SponsorAdminRow[]> {
	return adminRequest<SponsorAdminRow[]>('/admin/sponsors', { fetch, headers });
}

export function fetchSponsor(
	id: string,
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<SponsorAdminRow> {
	return adminRequest<SponsorAdminRow>(`/admin/sponsors/${id}`, { fetch, headers });
}

export function createSponsor(
	input: CreateSponsorInput,
	fetch?: typeof globalThis.fetch
): Promise<{ id: string }> {
	return adminRequest('/admin/sponsors', { method: 'POST', body: input, fetch });
}

export function updateSponsor(
	id: string,
	patch: Partial<CreateSponsorInput>,
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest(`/admin/sponsors/${id}`, { method: 'PATCH', body: patch, fetch });
}

export function deleteSponsor(id: string, fetch?: typeof globalThis.fetch): Promise<{ ok: true }> {
	return adminRequest(`/admin/sponsors/${id}`, { method: 'DELETE', fetch });
}

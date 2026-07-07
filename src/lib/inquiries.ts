// Dashboard-side types + fetch helpers for the Upiti section. Three inbox types
// (membership / sponsor / donation) mirror the backend Prisma models; each has a
// GET list, a PATCH status, and a POST reply. Real data — same DB the public forms
// write to. Backend: Archery-club-backend/src/routes/admin/inquiries.ts.
import { adminRequest } from '$lib/auth';

export type InquiryStatus = 'new' | 'read' | 'archived';
export type InquiryKind = 'membership' | 'sponsor' | 'donation';

export const STATUS_LABEL: Record<InquiryStatus, string> = {
	new: 'Novo',
	read: 'Pročitano',
	archived: 'Arhivirano'
};
export const KIND_LABEL: Record<InquiryKind, string> = {
	membership: 'Učlanjenje',
	sponsor: 'Sponzorstvo',
	donation: 'Donacija'
};

// Fields shared by every inbox row (workflow + envelope).
type InquiryBase = {
	id: string;
	email: string;
	phone: string | null;
	message: string | null;
	consentAccepted: boolean;
	status: InquiryStatus;
	responded: boolean;
	submittedAt: string; // ISO
};

export type MembershipSubmission = InquiryBase & {
	salutation: string | null;
	fullName: string;
	birthDate: string | null; // ISO
	experience: string | null;
	forMinor: boolean;
	minorDetails: string | null;
};

export type SponsorInquiry = InquiryBase & {
	companyName: string;
	contactName: string;
	sponsorshipInterest: string | null;
};

export type DonationInquiry = InquiryBase & {
	donorName: string;
};

// ── Fetch helpers (one path per inbox type) ───────────────────────────────────
export function fetchMembershipInquiries(
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<MembershipSubmission[]> {
	return adminRequest<MembershipSubmission[]>('/admin/inquiries/membership', { fetch, headers });
}
export function fetchSponsorInquiries(
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<SponsorInquiry[]> {
	return adminRequest<SponsorInquiry[]>('/admin/inquiries/sponsor', { fetch, headers });
}
export function fetchDonationInquiries(
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<DonationInquiry[]> {
	return adminRequest<DonationInquiry[]>('/admin/inquiries/donation', { fetch, headers });
}

// PATCH /admin/inquiries/<kind>/:id — set the workflow status.
export function updateInquiryStatus(
	kind: InquiryKind,
	id: string,
	status: InquiryStatus,
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest(`/admin/inquiries/${kind}/${id}`, { method: 'PATCH', body: { status }, fetch });
}

// POST /admin/inquiries/<kind>/:id/reply — email the submitter + mark responded.
export function replyToInquiry(
	kind: InquiryKind,
	id: string,
	body: { subject: string; text: string },
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest(`/admin/inquiries/${kind}/${id}/reply`, { method: 'POST', body, fetch });
}

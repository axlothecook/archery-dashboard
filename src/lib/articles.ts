// Dashboard-side types + fetch helpers for the Vijesti (articles) section.
// The list shape mirrors the backend's admin-only ArticleAdminRow DTO (see
// Archery-club-backend/src/mappers/article.ts) returned by GET /admin/articles.
// Real data — the same DB the public site reads (drafts included for admins).
import { adminRequest } from '$lib/auth';

export type ArticleMediaType = 'event' | 'gallery' | 'external-link' | 'video-only';
export type ArticleStatus = 'draft' | 'published';

// One row in the Objavljene vijesti / Nacrti tables.
export type ArticleAdminRow = {
	id: string;
	slug: string;
	title: string;
	mediaType: ArticleMediaType;
	status: ArticleStatus;
	hidden: boolean;
	source: 'facebook' | 'manual';
	posterImage: { url: string; alt: string };
	publishedAt: string | null; // ISO
	updatedAt: string; // ISO
	hasPendingDraft: boolean;
	adminEdited: boolean;
};

// Croatian labels for the media-type badge.
export const MEDIA_TYPE_LABEL: Record<ArticleMediaType, string> = {
	event: 'Događaj',
	gallery: 'Galerija',
	'external-link': 'Vanjski link',
	'video-only': 'Video'
};

// GET /admin/articles?status= — list articles for the dashboard. Pass a status to
// filter (published / draft), or omit for all. Uses the load `fetch` + forwarded
// cookie during SSR (like the other admin loads). Returns [] on a soft failure so
// the page renders an empty/error state rather than crashing the whole section.
export function fetchArticles(
	status: ArticleStatus | undefined,
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<ArticleAdminRow[]> {
	const q = status ? `?status=${status}` : '';
	return adminRequest<ArticleAdminRow[]>(`/admin/articles${q}`, { fetch, headers });
}

// Payload for creating an article (POST /admin/articles). Matches the backend
// createBody: HR source text + media + optional gallery/video/external + mentions.
export type ArticleImageInput = { url: string; alt: string; order: number };
export type CreateArticleInput = {
	slug?: string;
	mediaType: ArticleMediaType;
	posterImageUrl: string;
	posterImageAlt: string;
	images: ArticleImageInput[];
	videoUrl: string | null;
	videoPosterUrl: string | null;
	externalUrl: string | null;
	externalSourceName: string | null;
	status: ArticleStatus;
	hidden: boolean;
	mentionedArcherIds: string[];
	title: string;
	body: string;
	excerpt: string;
};

export function createArticle(
	input: CreateArticleInput,
	fetch?: typeof globalThis.fetch
): Promise<{ id: string; slug: string }> {
	return adminRequest('/admin/articles', { method: 'POST', body: input, fetch });
}

// The full editable article (GET /admin/articles/:id) for the edit form.
export type ArticleEditData = CreateArticleInput & { id: string; slug: string };

export function fetchArticle(
	id: string,
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<ArticleEditData> {
	return adminRequest<ArticleEditData>(`/admin/articles/${id}`, { fetch, headers });
}

// PATCH /admin/articles/:id — update fields (all optional server-side).
export function updateArticle(
	id: string,
	patch: Partial<CreateArticleInput>,
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest(`/admin/articles/${id}`, { method: 'PATCH', body: patch, fetch });
}

export function deleteArticle(id: string, fetch?: typeof globalThis.fetch): Promise<{ ok: true }> {
	return adminRequest(`/admin/articles/${id}`, { method: 'DELETE', fetch });
}

// A published archer that can be tagged as "mentioned" on an article.
export type ArcherOption = { id: string; name: string };

// GET /admin/archers/options — published archers for the mentioned-archers picker.
export function fetchArcherOptions(
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<ArcherOption[]> {
	return adminRequest<ArcherOption[]>('/admin/archers/options', { fetch, headers });
}

// POST /admin/client-errors — "report a problem" sink. Fire-and-forget from the UI
// when a widget fails to load its data (the widget still degrades gracefully). Never
// throws to the caller — a failed report must not cascade into a second failure.
export async function reportClientError(
	context: string,
	message: string,
	url?: string,
	fetch?: typeof globalThis.fetch
): Promise<void> {
	try {
		await adminRequest('/admin/client-errors', {
			method: 'POST',
			body: { context, message, url: url ?? null },
			fetch
		});
	} catch {
		// swallow — reporting is best-effort; don't let it surface another error.
	}
}

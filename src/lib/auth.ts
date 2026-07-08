// Auth + admin API client for the dashboard.
//
// Separate from the public `api.ts` (which is GET-only, no credentials) because
// the dashboard needs the session COOKIE on every request (`credentials:
// 'include'`) plus POST/PUT/DELETE with JSON bodies. The session cookie is
// HttpOnly + SameSite=Lax + Secure (__Host-session) — set by the backend on
// login; the browser sends it automatically same-origin, and SSR loads forward
// it explicitly (see the /nadzorna-ploca +layout.server.ts).
//
// Same base URL as the public client (PUBLIC_API_BASE_URL, runtime env). In prod
// this is the absolute same-origin `https://<host>/api`; in dev it defaults to
// the local backend on :3100.

import { env } from '$env/dynamic/public';

const BASE_URL = env.PUBLIC_API_BASE_URL ?? 'http://localhost:3100';

export class AuthError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
		this.name = 'AuthError';
	}
}

export type AdminUser = {
	id: string;
	workName: string;
	email: string;
	role: string;
};

type RequestOptions = {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: unknown;
	/** SvelteKit's load `fetch` (so SSR requests are tracked); defaults to global. */
	fetch?: typeof globalThis.fetch;
	/** Extra headers — e.g. forwarding the Cookie header during SSR. */
	headers?: Record<string, string>;
};

function buildUrl(path: string): string {
	return new URL(path.replace(/^\//, ''), BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/').toString();
}

// Core request helper: always credentialed, JSON in/out, throws AuthError on
// non-2xx (the backend's error middleware returns { message }). Returns the
// parsed JSON typed as T, or undefined for empty (204) responses.
export async function adminRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
	const f = opts.fetch ?? globalThis.fetch;
	const method = opts.method ?? 'GET';
	const headers: Record<string, string> = { ...opts.headers };
	let body: BodyInit | undefined;
	if (opts.body !== undefined) {
		headers['Content-Type'] = 'application/json';
		body = JSON.stringify(opts.body);
	}

	let res: Response;
	try {
		res = await f(buildUrl(path), { method, headers, body, credentials: 'include' });
	} catch {
		throw new AuthError(0, `Network error reaching ${path}`);
	}

	if (!res.ok) {
		let message = `${res.status} ${res.statusText}`;
		try {
			const errBody = (await res.json()) as { message?: string };
			if (errBody?.message) message = errBody.message;
		} catch {
			// non-JSON error body — keep the status line
		}
		throw new AuthError(res.status, message);
	}

	if (res.status === 204) return undefined as T;
	return (await res.json()) as T;
}

// POST /admin/upload — multipart file upload to R2. Cannot use adminRequest (which
// forces application/json); FormData needs the browser to set its own multipart
// boundary. Field `file` + text field `entityType` (must be an allowed entity, e.g.
// 'article'). Returns the permanent hosted image URL. Credentialed (session cookie).
// Throws AuthError with the backend's message on failure (bad type / too large / not
// configured), so the UI can surface it inline.
export async function uploadImage(
	file: File,
	entityType: string = 'article',
	fetch?: typeof globalThis.fetch
): Promise<string> {
	const f = fetch ?? globalThis.fetch;
	const form = new FormData();
	form.append('file', file);
	form.append('entityType', entityType);

	let res: Response;
	try {
		// NB: do NOT set Content-Type — the browser adds the multipart boundary.
		res = await f(buildUrl('/admin/upload'), { method: 'POST', body: form, credentials: 'include' });
	} catch {
		throw new AuthError(0, 'Mrežna pogreška pri prijenosu slike.');
	}
	if (!res.ok) {
		let message = `${res.status} ${res.statusText}`;
		try {
			const errBody = (await res.json()) as { error?: { message?: string }; message?: string };
			message = errBody?.error?.message ?? errBody?.message ?? message;
		} catch {
			// keep the status line
		}
		throw new AuthError(res.status, message);
	}
	const data = (await res.json()) as { url: string };
	return data.url;
}

// POST /auth/login { email, password } → the admin on success; throws AuthError
// (401) on bad credentials. Sets the session cookie as a side effect.
export function login(
	email: string,
	password: string,
	fetch?: typeof globalThis.fetch
): Promise<{ id: string; workName: string; role: string }> {
	return adminRequest('/auth/login', { method: 'POST', body: { email, password }, fetch });
}

// POST /auth/logout — destroy the session + clear the cookie.
export function logout(fetch?: typeof globalThis.fetch): Promise<{ ok: true }> {
	return adminRequest('/auth/logout', { method: 'POST', fetch });
}

// POST /auth/accept-invite { token, password } — set the password from an invite
// token (activates a pending admin). Throws AuthError on an invalid/expired/used token.
export function acceptInvite(
	token: string,
	password: string,
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest('/auth/accept-invite', { method: 'POST', body: { token, password }, fetch });
}

// POST /auth/forgot-password { email } — request a reset link. ALWAYS resolves ok
// (the backend never reveals whether the account exists — no enumeration).
export function forgotPassword(
	email: string,
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest('/auth/forgot-password', { method: 'POST', body: { email }, fetch });
}

// POST /auth/reset-password { token, password } — set a new password from a reset
// token (also revokes all sessions). Throws AuthError on an invalid/expired token.
export function resetPassword(
	token: string,
	password: string,
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest('/auth/reset-password', { method: 'POST', body: { token, password }, fetch });
}

// POST /auth/change-password { currentPassword, newPassword } — the signed-in admin
// changes their own password. Throws AuthError: 401 if the current password is wrong,
// 400 if the new one is too short / fields missing. Revokes the admin's OTHER sessions
// server-side (the caller's own stays valid).
export function changePassword(
	currentPassword: string,
	newPassword: string,
	fetch?: typeof globalThis.fetch
): Promise<{ ok: true }> {
	return adminRequest('/auth/change-password', {
		method: 'POST',
		body: { currentPassword, newPassword },
		fetch
	});
}

// GET /auth/me — the current admin, or null if we can't confirm a valid session.
// Used by the /nadzorna-ploca guard. `headers` lets the SSR load forward the browser's
// Cookie. Returns null (→ guard redirects to /prijava) for BOTH a 401 (no/expired
// session) AND a network error / unreachable API (status 0): if we can't verify
// the user is authenticated, treat them as not — sending them to login is the
// safe, sensible fallback rather than a 500. Genuine server errors (5xx) still
// throw so they surface as real failures, not a silent login bounce.
export async function me(
	fetch?: typeof globalThis.fetch,
	headers?: Record<string, string>
): Promise<AdminUser | null> {
	try {
		return await adminRequest<AdminUser>('/auth/me', { fetch, headers });
	} catch (err) {
		if (err instanceof AuthError && (err.status === 401 || err.status === 0)) return null;
		throw err;
	}
}

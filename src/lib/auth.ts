// Auth + admin API client for the dashboard.
//
// Separate from the public `api.ts` (which is GET-only, no credentials) because
// the dashboard needs the session COOKIE on every request (`credentials:
// 'include'`) plus POST/PUT/DELETE with JSON bodies. The session cookie is
// HttpOnly + SameSite=Lax + Secure (__Host-session) — set by the backend on
// login; the browser sends it automatically same-origin, and SSR loads forward
// it explicitly (see the /admin +layout.server.ts).
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

// GET /auth/me — the current admin, or null if we can't confirm a valid session.
// Used by the /admin guard. `headers` lets the SSR load forward the browser's
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

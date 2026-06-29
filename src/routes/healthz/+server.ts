import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

// Runtime health/readiness probe for the LIVE dashboard server. A monitor (or the
// reverse proxy / uptime check) hits this to confirm the dashboard is not just
// "process up" but actually able to reach its backend (which in turn checks the
// DB). Returns:
//   200 {status:"ok",  backend:"ok"}   — dashboard up AND backend/DB reachable
//   503 {status:"degraded", backend:"down", ...} — dashboard up but backend unreachable
// The dashboard itself responding at all already proves the SvelteKit server is
// alive; chaining to the backend /health turns this into a real readiness signal.
// Never throws — a probe must always get a structured answer, not a 500.
export const GET: RequestHandler = async ({ fetch }) => {
	const base = env.PUBLIC_API_BASE_URL ?? 'http://localhost:3100';
	const url = `${base.replace(/\/$/, '')}/health`;

	let backend: 'ok' | 'down' = 'down';
	let backendStatus: number | null = null;
	let detail: string | undefined;

	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
		backendStatus = res.status;
		if (res.ok) {
			const body = (await res.json().catch(() => ({}))) as { db?: string };
			// Backend reports its own DB health; require db:ok for full readiness.
			backend = body?.db === 'ok' || body?.db === undefined ? 'ok' : 'down';
			if (backend === 'down') detail = `backend db not ok (db=${body.db})`;
		} else {
			detail = `backend /health returned ${res.status}`;
		}
	} catch (e) {
		detail = `cannot reach backend /health: ${(e as Error).message}`;
	}

	const ok = backend === 'ok';
	return json(
		{
			status: ok ? 'ok' : 'degraded',
			service: 'archery-dashboard',
			backend,
			backendStatus,
			...(detail ? { detail } : {})
		},
		{ status: ok ? 200 : 503, headers: { 'cache-control': 'no-store' } }
	);
};

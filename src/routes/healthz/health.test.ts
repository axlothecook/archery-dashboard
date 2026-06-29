import { describe, it, expect, vi } from 'vitest';

// The health endpoint reads PUBLIC_API_BASE_URL from $env/dynamic/public — mock it
// so the test is hermetic (no real env needed).
vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_API_BASE_URL: 'http://backend.test/api' } }));

import { GET } from './+server';

// Build a minimal RequestEvent stub with a controllable fetch.
const event = (fetchImpl: typeof fetch) => ({ fetch: fetchImpl }) as never;

describe('/healthz runtime health probe', () => {
	it('200 ok when the backend /health reports db ok', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ status: 'ok', db: 'ok' }), { status: 200 })
		);
		const res = await GET(event(fetchMock));
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toMatchObject({ status: 'ok', backend: 'ok' });
		// it actually probed the backend /health
		expect(fetchMock).toHaveBeenCalledWith('http://backend.test/api/health', expect.anything());
	});

	it('503 degraded when the backend is unreachable (does NOT throw)', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
		// The whole point: a probe must get a structured 503, never an exception.
		const res = await GET(event(fetchMock));
		expect(res.status).toBe(503);
		const body = await res.json();
		expect(body.status).toBe('degraded');
		expect(body.backend).toBe('down');
		expect(body.detail).toContain('cannot reach backend');
	});

	it('503 degraded when the backend DB is not ok', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ status: 'ok', db: 'down' }), { status: 200 })
		);
		const res = await GET(event(fetchMock));
		expect(res.status).toBe(503);
		const body = await res.json();
		expect(body.backend).toBe('down');
	});

	it('503 degraded when backend /health returns a non-2xx', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response('err', { status: 500 }));
		const res = await GET(event(fetchMock));
		expect(res.status).toBe(503);
		const body = await res.json();
		expect(body.backendStatus).toBe(500);
	});
});

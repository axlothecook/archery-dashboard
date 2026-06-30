import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auth client so we control what /auth/me returns without a real
// backend. The guard calls me(fetch, headers) and redirects when it's null.
const meMock = vi.fn();
vi.mock('$lib/auth', () => ({
	me: (...args: unknown[]) => meMock(...args)
}));

import { load } from './+layout.server';

// Minimal LayoutServerLoadEvent stub: the guard only uses `fetch` and
// `request.headers.get('cookie')`.
const event = (cookie?: string) =>
	({
		fetch: (() => {}) as unknown,
		request: { headers: { get: (k: string) => (k === 'cookie' ? (cookie ?? null) : null) } }
	}) as never;

beforeEach(() => meMock.mockReset());

describe('/nadzorna-ploca guard (+layout.server load)', () => {
	it('redirects to /prijava (303) when not authenticated', async () => {
		meMock.mockResolvedValue(null);
		// SvelteKit's redirect() throws a { status, location } object.
		await expect(load(event())).rejects.toMatchObject({ status: 303, location: '/prijava' });
	});

	it('returns the admin when authenticated', async () => {
		const admin = { id: '1', workName: 'Tester', email: 't@vsk.hr', role: 'developer' };
		meMock.mockResolvedValue(admin);
		const data = await load(event('__Host-session=abc'));
		expect(data).toEqual({ admin });
	});

	it('forwards the incoming Cookie header to me() (SSR cookie pass-through)', async () => {
		meMock.mockResolvedValue({ id: '1', workName: 'T', email: 't@vsk.hr', role: 'developer' });
		await load(event('__Host-session=abc'));
		// second arg is the headers object carrying the cookie
		expect(meMock).toHaveBeenCalledWith(expect.anything(), { cookie: '__Host-session=abc' });
	});

	it('omits headers when there is no incoming cookie', async () => {
		meMock.mockResolvedValue({ id: '1', workName: 'T', email: 't@vsk.hr', role: 'developer' });
		await load(event());
		expect(meMock).toHaveBeenCalledWith(expect.anything(), undefined);
	});
});

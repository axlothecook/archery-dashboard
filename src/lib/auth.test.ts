import { describe, it, expect, vi } from 'vitest';
import { me, login, AuthError } from './auth';

// A fake fetch that returns a Response-like object with the given status/json.
function fakeFetch(status: number, body: unknown): typeof globalThis.fetch {
	return (async () => ({
		ok: status >= 200 && status < 300,
		status,
		statusText: 'x',
		json: async () => body
	})) as unknown as typeof globalThis.fetch;
}
// A fetch that rejects (simulates an unreachable API).
const downFetch = (async () => {
	throw new Error('ECONNREFUSED');
}) as unknown as typeof globalThis.fetch;

const admin = { id: '1', workName: 'T', email: 't@vsk.hr', role: 'developer' };

describe('me()', () => {
	it('returns the admin on 200', async () => {
		expect(await me(fakeFetch(200, admin))).toEqual(admin);
	});

	it('returns null on 401 (no/expired session) → guard sends to /prijava', async () => {
		expect(await me(fakeFetch(401, { message: 'unauthorized' }))).toBeNull();
	});

	it('returns null when the API is unreachable (network error) → safe login bounce, not a 500', async () => {
		expect(await me(downFetch)).toBeNull();
	});

	it('THROWS on a genuine server error (500) so it surfaces, not a silent login bounce', async () => {
		await expect(me(fakeFetch(500, { message: 'boom' }))).rejects.toBeInstanceOf(AuthError);
	});
});

describe('login()', () => {
	it('POSTs credentials and returns the admin', async () => {
		const f = vi.fn(fakeFetch(200, { id: '1', workName: 'T', role: 'developer' }));
		const res = await login('t@vsk.hr', 'pw', f as unknown as typeof globalThis.fetch);
		expect(res).toMatchObject({ id: '1', role: 'developer' });
		// sent as POST with credentials included
		const init = f.mock.calls[0]?.[1] as RequestInit;
		expect(init.method).toBe('POST');
		expect(init.credentials).toBe('include');
		expect(JSON.parse(init.body as string)).toEqual({ email: 't@vsk.hr', password: 'pw' });
	});

	it('throws AuthError(401) on bad credentials', async () => {
		await expect(
			login('t@vsk.hr', 'wrong', fakeFetch(401, { message: 'Invalid credentials' }))
		).rejects.toMatchObject({ status: 401 });
	});
});

import { redirect } from '@sveltejs/kit';
import { me } from '$lib/auth';
import type { LayoutServerLoad } from './$types';

// Guard for the whole /nadzorna-ploca/* area. Runs server-side on every admin navigation:
// asks the backend "who am I" (/auth/me) with the browser's session cookie
// forwarded, and redirects to /prijava if unauthenticated (401 → me() returns
// null). Returns the admin so child pages/components can show who's logged in.
//
// Cookie forwarding: in prod the API is same-origin (/api) so SvelteKit's
// `fetch` carries the cookie automatically; in dev the API is a different origin
// (:3100 vs :5173), so we forward the incoming Cookie header explicitly. Doing
// both is harmless and makes the guard work in every environment.
export const load: LayoutServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const admin = await me(fetch, cookie ? { cookie } : undefined);

	if (!admin) {
		throw redirect(303, '/prijava');
	}

	return { admin };
};

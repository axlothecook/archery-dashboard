import { fetchSponsors } from '$lib/sponsors';
import type { PageServerLoad } from './$types';

// All sponsors for the Sponzori → Svi sponzori list. Forward the cookie for auth;
// soft-fail to an empty list so the page renders a state, not a 500.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const sponsors = await fetchSponsors(fetch, cookie ? { cookie } : undefined);
		return { sponsors, loadError: false };
	} catch {
		return { sponsors: [], loadError: true };
	}
};

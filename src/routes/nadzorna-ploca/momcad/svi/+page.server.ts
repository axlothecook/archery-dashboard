import { fetchArchers } from '$lib/archers';
import type { PageServerLoad } from './$types';

// All archers for the Momčad → Svi streličari list. Forward the cookie for auth;
// soft-fail to an empty list so the page renders a state, not a 500. The page
// itself filters out drafts (those live under Nacrti).
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const archers = await fetchArchers(fetch, cookie ? { cookie } : undefined);
		return { archers, loadError: false };
	} catch {
		return { archers: [], loadError: true };
	}
};

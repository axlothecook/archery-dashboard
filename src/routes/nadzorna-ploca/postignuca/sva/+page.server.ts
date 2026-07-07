import { fetchAchievements } from '$lib/achievements';
import type { PageServerLoad } from './$types';

// All achievements for the Postignuća → Sva postignuća list. Forward the cookie for
// auth; soft-fail to an empty list so the page renders a state, not a 500.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const achievements = await fetchAchievements(fetch, cookie ? { cookie } : undefined);
		return { achievements, loadError: false };
	} catch {
		return { achievements: [], loadError: true };
	}
};

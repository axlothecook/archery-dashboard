import { fetchEventLevels } from '$lib/events';
import type { PageServerLoad } from './$types';

// Event levels (calendar legend categories) for the Kategorije razina CRUD page.
// Forward the cookie for auth; soft-fail to an empty list so the page renders.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const levels = await fetchEventLevels(fetch, cookie ? { cookie } : undefined);
		return { levels, loadError: false };
	} catch {
		return { levels: [], loadError: true };
	}
};

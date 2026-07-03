import { fetchEvents } from '$lib/events';
import type { PageServerLoad } from './$types';

// All events (published + drafts) for the Raspored → Svi događaji list. Forward the
// cookie for auth; soft-fail to an empty list so the page renders a state, not a 500.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const events = await fetchEvents(undefined, fetch, cookie ? { cookie } : undefined);
		return { events, loadError: false };
	} catch {
		return { events: [], loadError: true };
	}
};

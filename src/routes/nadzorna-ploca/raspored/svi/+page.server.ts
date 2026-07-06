import { fetchEvents } from '$lib/events';
import type { PageServerLoad } from './$types';

// Published events for the Raspored → Svi događaji list (drafts live on the Nacrti
// subpage, mirroring Vijesti). Forward the cookie for auth; soft-fail to an empty
// list so the page renders a state, not a 500.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const events = await fetchEvents('published', fetch, cookie ? { cookie } : undefined);
		return { events, loadError: false };
	} catch {
		return { events: [], loadError: true };
	}
};

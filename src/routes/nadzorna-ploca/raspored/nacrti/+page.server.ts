import { fetchEvents } from '$lib/events';
import type { PageServerLoad } from './$types';

// Real DRAFT events (backend status: draft) — the public calendar never shows these,
// so this admin list is the only place to see + finish them. Mirrors the Vijesti
// Nacrti page. Forward the cookie for auth; soft-fail to an empty list so the page
// renders a state, not a 500.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const events = await fetchEvents('draft', fetch, cookie ? { cookie } : undefined);
		return { events, loadError: false };
	} catch {
		return { events: [], loadError: true };
	}
};

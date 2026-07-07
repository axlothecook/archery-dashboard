import { fetchSponsor } from '$lib/sponsors';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Load the sponsor to edit (GET /admin/sponsors/:id). A missing/failed load is a real
// error (nothing to edit) → 404.
export const load: PageServerLoad = async ({ params, fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : undefined;
	try {
		const sponsor = await fetchSponsor(params.id, fetch, headers);
		return { sponsor };
	} catch {
		throw error(404, 'Sponzor nije pronađen.');
	}
};

import { fetchArcher, fetchArchers } from '$lib/archers';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The individual archer VIEW page (GET /admin/archers/:id) — read-only, with an
// Uredi button. Also loads the roster so coach IDs resolve to names. A missing
// archer is a real 404; a failed roster fetch soft-fails to [] (coach chips just
// show the id fallback then).
export const load: PageServerLoad = async ({ params, fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : undefined;
	try {
		const [archer, roster] = await Promise.all([
			fetchArcher(params.id, fetch, headers),
			fetchArchers(fetch, headers).catch(() => [])
		]);
		return { archer, roster };
	} catch {
		throw error(404, 'Streličar nije pronađen.');
	}
};

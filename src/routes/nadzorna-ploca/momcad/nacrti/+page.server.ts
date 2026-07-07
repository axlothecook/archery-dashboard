import { fetchArchers } from '$lib/archers';
import type { PageServerLoad } from './$types';

// Draft archers for the Momčad → Nacrti list. Same source as Svi streličari; the
// page filters to status === 'draft'. Soft-fail to an empty list.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const archers = await fetchArchers(fetch, cookie ? { cookie } : undefined);
		return { archers, loadError: false };
	} catch {
		return { archers: [], loadError: true };
	}
};

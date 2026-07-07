import { fetchAchievement } from '$lib/achievements';
import { fetchArcherOptions, type ArcherOption } from '$lib/articles';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Load the achievement to edit (GET /admin/achievements/:id) + the archer options for
// the credited-archers picker. A missing/failed achievement load is a real error → 404;
// the archer options soft-fail independently.
export const load: PageServerLoad = async ({ params, fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : undefined;

	let achievement;
	try {
		achievement = await fetchAchievement(params.id, fetch, headers);
	} catch {
		throw error(404, 'Postignuće nije pronađeno.');
	}

	let archerOptions: ArcherOption[];
	let archerLoadError: boolean;
	let archerErrorDetail: string;
	try {
		archerOptions = await fetchArcherOptions(fetch, headers);
		archerLoadError = false;
		archerErrorDetail = '';
	} catch (e) {
		archerOptions = [];
		archerLoadError = true;
		archerErrorDetail = e instanceof Error ? e.message : 'unknown error';
	}

	return { achievement, archerOptions, archerLoadError, archerErrorDetail };
};

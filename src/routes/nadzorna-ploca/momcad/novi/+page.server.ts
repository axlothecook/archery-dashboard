import { fetchArcherOptions, type ArcherOption } from '$lib/articles';
import type { PageServerLoad } from './$types';

// Load the published-archer options for the coaches picker. Soft-fails so the form
// still works (the picker shows its "report a problem" warning).
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : undefined;
	try {
		const coachOptions = await fetchArcherOptions(fetch, headers);
		return { coachOptions, coachLoadError: false, coachErrorDetail: '' };
	} catch (e) {
		return {
			coachOptions: [] as ArcherOption[],
			coachLoadError: true,
			coachErrorDetail: e instanceof Error ? e.message : 'unknown error'
		};
	}
};

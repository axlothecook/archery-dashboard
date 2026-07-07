import { fetchArcher } from '$lib/archers';
import { fetchArcherOptions, type ArcherOption } from '$lib/articles';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Load the archer to edit (GET /admin/archers/:id) + the coaches picker options. A
// missing archer is a real 404; the options soft-fail so the form still works.
export const load: PageServerLoad = async ({ params, fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : undefined;
	let archer;
	try {
		archer = await fetchArcher(params.id, fetch, headers);
	} catch {
		throw error(404, 'Streličar nije pronađen.');
	}
	try {
		const coachOptions = await fetchArcherOptions(fetch, headers);
		return { archer, coachOptions, coachLoadError: false, coachErrorDetail: '' };
	} catch (e) {
		return {
			archer,
			coachOptions: [] as ArcherOption[],
			coachLoadError: true,
			coachErrorDetail: e instanceof Error ? e.message : 'unknown error'
		};
	}
};

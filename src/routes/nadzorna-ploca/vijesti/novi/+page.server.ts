import { fetchArcherOptions } from '$lib/articles';
import type { PageServerLoad } from './$types';

// Load the published-archer options for the mentioned-archers picker. Soft-fail:
// on error the page still renders and the picker shows a "report a problem" warning
// (and reports the failure) — the create form must never be blocked by this.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const archerOptions = await fetchArcherOptions(fetch, cookie ? { cookie } : undefined);
		return { archerOptions, archerLoadError: false, archerErrorDetail: '' };
	} catch (e) {
		return {
			archerOptions: [],
			archerLoadError: true,
			archerErrorDetail: e instanceof Error ? e.message : 'unknown error'
		};
	}
};

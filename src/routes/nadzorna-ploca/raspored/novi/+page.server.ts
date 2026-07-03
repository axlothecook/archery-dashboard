import { fetchEventLevels } from '$lib/events';
import { fetchArcherOptions, type ArcherOption } from '$lib/articles';
import type { PageServerLoad } from './$types';

// Load the event-level options (single-select) + published-archer options (attending
// multi-select) for the create form. Each soft-fails independently: a failed archer
// load shows the picker's "report a problem" warning; a failed level load leaves the
// level select empty — the form still works either way.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : undefined;

	const levels = await fetchEventLevels(fetch, headers).catch(() => null);
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

	return {
		levels: levels ?? [],
		levelLoadError: levels === null,
		archerOptions,
		archerLoadError,
		archerErrorDetail
	};
};

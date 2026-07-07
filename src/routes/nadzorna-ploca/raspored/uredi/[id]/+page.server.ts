import { fetchEvent, fetchEventLevels } from '$lib/events';
import { fetchArcherOptions, type ArcherOption } from '$lib/articles';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Load the event to edit (GET /admin/events/:id) + the level options (single-select)
// and published-archer options (attending multi-select). A missing/failed event load is
// a real error (nothing to edit) → 404. Levels + archers soft-fail independently so the
// form still renders (mirrors the Novi događaj + Uredi članak loads).
export const load: PageServerLoad = async ({ params, fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : undefined;

	let event;
	try {
		event = await fetchEvent(params.id, fetch, headers);
	} catch {
		throw error(404, 'Događaj nije pronađen.');
	}

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
		event,
		levels: levels ?? [],
		levelLoadError: levels === null,
		archerOptions,
		archerLoadError,
		archerErrorDetail
	};
};

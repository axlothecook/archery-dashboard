import { fetchArticle, fetchArcherOptions, type ArcherOption } from '$lib/articles';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Load the article to edit + the archer options for the mentioned-archers picker.
// A missing/failed article load is a real error (there's nothing to edit) → 404/500.
// The archer options soft-fail independently (the picker shows its warning).
export const load: PageServerLoad = async ({ params, fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : undefined;

	let article;
	try {
		article = await fetchArticle(params.id, fetch, headers);
	} catch {
		throw error(404, 'Članak nije pronađen.');
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

	return { article, archerOptions, archerLoadError, archerErrorDetail };
};

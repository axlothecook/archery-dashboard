import { fetchArticles } from '$lib/articles';
import type { PageServerLoad } from './$types';

// Real DRAFT articles (backend status: draft) — the public feed never shows these,
// so this admin list is the only place to see + finish them. Forward the cookie for
// auth; soft-fail to an empty list so the page renders a state, not a 500.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const articles = await fetchArticles('draft', fetch, cookie ? { cookie } : undefined);
		return { articles, loadError: false };
	} catch {
		return { articles: [], loadError: true };
	}
};

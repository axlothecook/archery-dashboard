import { fetchArticles } from '$lib/articles';
import type { PageServerLoad } from './$types';

// Real published articles (same DB the public site reads). Forward the browser's
// Cookie during SSR so the admin request is authenticated (like the layout guard).
// Soft-fail to an empty list + an error flag so the page renders a state, not a 500.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	try {
		const articles = await fetchArticles('published', fetch, cookie ? { cookie } : undefined);
		return { articles, loadError: false };
	} catch {
		return { articles: [], loadError: true };
	}
};

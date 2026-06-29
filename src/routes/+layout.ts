import type { LayoutLoad } from './$types';

// Expose the cookie-resolved locale (from +layout.server.ts) to every page via
// page.data.locale. The dashboard doesn't fetch site-wide content the way the
// public site does — it only needs the active locale for the login chrome.
export const load: LayoutLoad = async ({ data }) => {
	return { locale: data.locale };
};

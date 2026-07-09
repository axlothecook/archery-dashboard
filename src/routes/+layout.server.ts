import { DEFAULT_LOCALE } from '$lib/locale';
import type { LayoutServerLoad } from './$types';

// The dashboard is admin-only and HR-first, with NO language switcher of its own.
// It shares an origin with the public site, so reading the public `locale` cookie
// here made the dashboard flip to English whenever an admin had last viewed the
// public site in EN (the reported "auth pages in English" bug). We therefore pin
// the dashboard to Croatian always, ignoring that cookie. If the dashboard ever
// gains its own switcher, resolve from a dashboard-scoped cookie instead.
export const load: LayoutServerLoad = () => {
	return { locale: DEFAULT_LOCALE };
};

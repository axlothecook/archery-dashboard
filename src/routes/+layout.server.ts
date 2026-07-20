import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, resolveLocale, type Locale } from '$lib/locale';
import type { LayoutServerLoad } from './$types';

// The auth pages follow the language the visitor last used on the public site
// (the shared same-origin `locale` cookie), falling back to the browser's
// Accept-Language, then Croatian. Reversal of the earlier "pin to hr" decision:
// that fix served the club-admin era; now the site is a public demo and the
// login page should greet visitors in their language (user decision 2026-07-20).
// The dashboard shell itself stays Croatian either way.
function fromAcceptLanguage(header: string | null): Locale | null {
	if (!header) return null;
	// "en-GB,en;q=0.9,hr;q=0.8" → ["en-GB", "en", "hr"] in stated order.
	for (const part of header.split(',')) {
		const tag = part.split(';')[0]!.trim().toLowerCase();
		const base = tag.split('-')[0]!;
		if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) return base as Locale;
	}
	return null;
}

export const load: LayoutServerLoad = ({ cookies, request }) => {
	const cookie = cookies.get(LOCALE_COOKIE);
	if (cookie) return { locale: resolveLocale(cookie) };
	return { locale: fromAcceptLanguage(request.headers.get('accept-language')) ?? DEFAULT_LOCALE };
};

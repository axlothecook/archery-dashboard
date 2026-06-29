// Lightweight i18n for the admin dashboard. Same `t(locale, key)` API as the
// public site, but trimmed to only the keys the dashboard actually uses (login
// chrome + club name). The dashboard is HR-first; EN values mirror the public
// site so a future locale switcher works identically.
import { DEFAULT_LOCALE, type Locale } from '$lib/locale';

type Dict = Record<string, string>;

const hr: Dict = {
	clubName: 'Varaždinski streličarski klub',
	'auth.title': 'Prijava',
	'auth.email': 'Email',
	'auth.password': 'Lozinka',
	'auth.submit': 'Prijavi se',
	'auth.submitting': 'Prijava…',
	'auth.help': 'Trebate pomoć pri prijavi?',
	'auth.helpLink': 'Kontaktirajte nas',
	'auth.error': 'Pogrešan email ili lozinka.',
	'auth.errorGeneric': 'Prijava nije uspjela. Pokušajte ponovno.',
	'auth.imageAlt': 'Streličarstvo'
};

const en: Dict = {
	clubName: 'Varaždin Archery Club',
	'auth.title': 'Log In',
	'auth.email': 'Email',
	'auth.password': 'Password',
	'auth.submit': 'Log In',
	'auth.submitting': 'Logging in…',
	'auth.help': 'Need assistance logging in?',
	'auth.helpLink': 'Contact Us',
	'auth.error': 'Incorrect email or password.',
	'auth.errorGeneric': 'Login failed. Please try again.',
	'auth.imageAlt': 'Archery'
};

const DICTS: Record<Locale, Dict> = { hr, en };

// Translate a key for a locale. Falls back: requested locale → hr → the key itself
// (so a missing key is visible in dev, never a blank string in prod).
export function t(locale: Locale | string | undefined, key: string): string {
	const loc = (locale as Locale) in DICTS ? (locale as Locale) : DEFAULT_LOCALE;
	return DICTS[loc]?.[key] ?? DICTS[DEFAULT_LOCALE]?.[key] ?? key;
}

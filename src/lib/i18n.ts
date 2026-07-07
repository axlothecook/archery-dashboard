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
	'auth.imageAlt': 'Streličarstvo',
	'auth.forgotLink': 'Zaboravili ste lozinku?',
	'auth.backToLogin': 'Natrag na prijavu',
	// Forgot-password (request a reset link)
	'forgot.title': 'Zaboravljena lozinka',
	'forgot.intro': 'Unesite svoj email. Ako postoji račun, poslat ćemo vam poveznicu za postavljanje nove lozinke.',
	'forgot.submit': 'Pošalji poveznicu',
	'forgot.submitting': 'Slanje…',
	'forgot.sent': 'Ako postoji račun s tom adresom, poslali smo poveznicu za oporavak lozinke. Provjerite email (i mapu neželjene pošte).',
	// Reset password (set new password from a reset token)
	'reset.title': 'Nova lozinka',
	'reset.intro': 'Postavite novu lozinku za svoj račun.',
	'reset.password': 'Nova lozinka',
	'reset.confirm': 'Potvrdite lozinku',
	'reset.submit': 'Spremi lozinku',
	'reset.submitting': 'Spremanje…',
	'reset.done': 'Lozinka je promijenjena. Sada se možete prijaviti.',
	'reset.goLogin': 'Idi na prijavu',
	// Accept invite (activate account by setting a password)
	'invite.title': 'Aktivirajte račun',
	'invite.intro': 'Pozvani ste u nadzornu ploču. Postavite lozinku da aktivirate svoj račun.',
	'invite.submit': 'Aktiviraj račun',
	'invite.submitting': 'Aktivacija…',
	'invite.done': 'Račun je aktiviran. Sada se možete prijaviti.',
	// Shared validation / errors for the reset+invite forms
	'pw.tooShort': 'Lozinka mora imati najmanje 12 znakova.',
	'pw.mismatch': 'Lozinke se ne podudaraju.',
	'pw.badToken': 'Poveznica je nevažeća ili je istekla. Zatražite novu.',
	'pw.noToken': 'Nedostaje token. Otvorite poveznicu iz emaila.',
	'pw.genericError': 'Nešto je pošlo po zlu. Pokušajte ponovno.'
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
	'auth.imageAlt': 'Archery',
	'auth.forgotLink': 'Forgot your password?',
	'auth.backToLogin': 'Back to login',
	'forgot.title': 'Forgot password',
	'forgot.intro': 'Enter your email. If an account exists, we’ll send you a link to set a new password.',
	'forgot.submit': 'Send reset link',
	'forgot.submitting': 'Sending…',
	'forgot.sent': 'If an account with that address exists, we’ve sent a password-recovery link. Check your email (and spam folder).',
	'reset.title': 'New password',
	'reset.intro': 'Set a new password for your account.',
	'reset.password': 'New password',
	'reset.confirm': 'Confirm password',
	'reset.submit': 'Save password',
	'reset.submitting': 'Saving…',
	'reset.done': 'Your password has been changed. You can now log in.',
	'reset.goLogin': 'Go to login',
	'invite.title': 'Activate account',
	'invite.intro': 'You’ve been invited to the dashboard. Set a password to activate your account.',
	'invite.submit': 'Activate account',
	'invite.submitting': 'Activating…',
	'invite.done': 'Your account is active. You can now log in.',
	'pw.tooShort': 'Password must be at least 12 characters.',
	'pw.mismatch': 'Passwords do not match.',
	'pw.badToken': 'This link is invalid or has expired. Request a new one.',
	'pw.noToken': 'Missing token. Open the link from your email.',
	'pw.genericError': 'Something went wrong. Please try again.'
};

const DICTS: Record<Locale, Dict> = { hr, en };

// Translate a key for a locale. Falls back: requested locale → hr → the key itself
// (so a missing key is visible in dev, never a blank string in prod).
export function t(locale: Locale | string | undefined, key: string): string {
	const loc = (locale as Locale) in DICTS ? (locale as Locale) : DEFAULT_LOCALE;
	return DICTS[loc]?.[key] ?? DICTS[DEFAULT_LOCALE]?.[key] ?? key;
}

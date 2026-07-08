// Shared field validation for the Profil forms (Podaci računa + Promjena lozinke).
// Pure functions so both the page markup and unit tests use the exact same rules.
//
// Each validator returns a FieldResult: 'empty' (nothing typed yet), 'ok' (valid), or
// 'bad' with a Croatian message to show inline beneath the field. The page decides WHEN
// to surface each state (e.g. 'empty' only after a submit attempt; 'bad' live).

export type FieldResult = { state: 'empty' | 'ok' | 'bad'; message?: string };

const ok: FieldResult = { state: 'ok' };
const empty: FieldResult = { state: 'empty' };
const bad = (message: string): FieldResult => ({ state: 'bad', message });

// Text fields (Korisničko ime, Ime i prezime): shared 1–20 length window.
export const TEXT_MIN = 1;
export const TEXT_MAX = 20;
// Passwords: 12–20 (backend min is 12; the 20 max is a client+server agreed cap).
export const PW_MIN = 12;
export const PW_MAX = 20;
export const EMAIL_MAX = 254; // RFC 5321 practical cap.

// Letters incl. Croatian diacritics, plus space, hyphen and apostrophe (Ana-Marija, D'Angelo).
const NAME_RE = /^[A-Za-zČčĆćĐđŠšŽž' -]+$/;
// Korisničko ime: letters (incl. Croatian čćđšž), digits, space, _ and - . No dot, no
// other symbols.
const USERNAME_RE = /^[A-Za-zČčĆćĐđŠšŽž0-9_ -]+$/;
// Email: chars before @, chars after @, a dot in the domain, and no whitespace anywhere.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Telefon: must start with + and contain exactly 12 digits. Spaces are allowed for
// readability (e.g. +385 91 234 5678) and ignored — only the + and digit count matter.
const PHONE_ALLOWED_RE = /^\+[\d ]+$/; // only +, digits and spaces
function phoneDigits(v: string): string {
	return v.replace(/[^\d]/g, "");
}

// Korisničko ime — required, 1–20, letters/digits/space/._- (no other symbols).
export function validateUsername(v: string): FieldResult {
	if (v.trim().length === 0) return empty;
	if (v.length > TEXT_MAX) return bad(`Najviše ${TEXT_MAX} znakova`);
	if (!USERNAME_RE.test(v)) return bad('Dozvoljena su samo slova, brojevi, razmak te znakovi _ i -');
	return ok;
}

// Ime i prezime — required, 1–20, letters + space + - + ' only.
export function validateName(v: string): FieldResult {
	if (v.trim().length === 0) return empty;
	if (v.length > TEXT_MAX) return bad(`Najviše ${TEXT_MAX} znakova`);
	if (!NAME_RE.test(v)) return bad('Dozvoljena su samo slova, razmak, - i ’');
	return ok;
}

// Email — required, standard shape (@ with text either side + dotted domain), no spaces.
export function validateEmail(v: string): FieldResult {
	if (v.length === 0) return empty;
	if (/\s/.test(v)) return bad('Email ne smije sadržavati razmake');
	if (v.length > EMAIL_MAX) return bad(`Najviše ${EMAIL_MAX} znakova`);
	if (!EMAIL_RE.test(v)) return bad('Unesite ispravan email (npr. ime@primjer.com)');
	return ok;
}

// Telefon — required, starts with + and has exactly 12 digits (spaces allowed/ignored).
export function validatePhone(v: string): FieldResult {
	if (v.length === 0) return empty;
	const msg = 'Broj mora biti u obliku +385 91 234 5678 i sadržavati 12 znamenki';
	if (!v.startsWith('+') || !PHONE_ALLOWED_RE.test(v)) return bad(msg);
	if (phoneDigits(v).length !== 12) return bad(msg);
	return ok;
}

// New password — required, 12–20 chars (no character restriction on passwords).
export function validateNewPassword(v: string): FieldResult {
	if (v.length === 0) return empty;
	if (v.length < PW_MIN) return bad(`Lozinka mora imati najmanje ${PW_MIN} znakova`);
	if (v.length > PW_MAX) return bad(`Lozinka može imati najviše ${PW_MAX} znakova`);
	return ok;
}

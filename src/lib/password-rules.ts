// Shared client-side password policy for the accept-invite + reset-password forms.
// Mirrors the backend rule (auth.ts): length 12–20, printable ASCII only, no spaces
// or control/non-ASCII characters. Returns an i18n KEY (or null when valid) so the
// caller renders the localized message. Keep in lockstep with the backend limits.

export const MIN_PASSWORD = 12;
export const MAX_PASSWORD = 20;

// Printable ASCII excluding space (0x21–0x7E): letters, digits, common symbols.
const ALLOWED = /^[\x21-\x7E]+$/;

// Validate the primary password. Returns an i18n key for the first failing rule,
// or null when the password satisfies every rule. Order: length before charset so
// the most common mistake (too short) surfaces first.
export function passwordError(pw: string): string | null {
	if (pw.length < MIN_PASSWORD) return 'pw.tooShort';
	if (pw.length > MAX_PASSWORD) return 'pw.tooLong';
	if (!ALLOWED.test(pw)) return 'pw.badChars';
	return null;
}

// Validate the confirm field against the password. Only meaningful once confirm is
// non-empty; returns 'pw.mismatch' when they differ, else null.
export function confirmError(pw: string, confirm: string): string | null {
	if (confirm.length === 0) return null;
	return pw === confirm ? null : 'pw.mismatch';
}

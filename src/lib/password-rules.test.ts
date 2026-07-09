import { describe, it, expect } from 'vitest';
import { passwordError, confirmError, MIN_PASSWORD, MAX_PASSWORD } from './password-rules';

// The client-side password policy for accept-invite + reset-password. Must stay in
// lockstep with the backend (auth.ts assertPasswordPolicy): length 12-20, printable
// ASCII only, no spaces. Each function returns an i18n KEY (or null when valid).

describe('passwordError', () => {
	it(`< ${MIN_PASSWORD} chars → pw.tooShort`, () => {
		expect(passwordError('a'.repeat(MIN_PASSWORD - 1))).toBe('pw.tooShort');
		expect(passwordError('')).toBe('pw.tooShort');
	});

	it(`exactly ${MIN_PASSWORD} chars → valid (null)`, () => {
		expect(passwordError('a'.repeat(MIN_PASSWORD))).toBeNull();
	});

	it(`exactly ${MAX_PASSWORD} chars → valid (null)`, () => {
		expect(passwordError('a'.repeat(MAX_PASSWORD))).toBeNull();
	});

	it(`> ${MAX_PASSWORD} chars → pw.tooLong`, () => {
		expect(passwordError('a'.repeat(MAX_PASSWORD + 1))).toBe('pw.tooLong');
	});

	it('a space → pw.badChars', () => {
		expect(passwordError('has a space12')).toBe('pw.badChars');
	});

	it('a non-ASCII char (Croatian ć) → pw.badChars', () => {
		expect(passwordError('lozinkać12345')).toBe('pw.badChars');
	});

	it('a control char (tab) → pw.badChars', () => {
		expect(passwordError('tab\there1234')).toBe('pw.badChars');
	});

	it('printable ASCII symbols → valid (null)', () => {
		expect(passwordError('P@ssw0rd!#$%^')).toBeNull();
	});

	it('length is checked BEFORE charset (order matters)', () => {
		// a too-short password that ALSO has a bad char reports tooShort first
		expect(passwordError('a b')).toBe('pw.tooShort');
	});
});

describe('confirmError', () => {
	it('empty confirm → null (not flagged until typed)', () => {
		expect(confirmError('anything', '')).toBeNull();
	});

	it('matching → null', () => {
		expect(confirmError('correct-pass-1', 'correct-pass-1')).toBeNull();
	});

	it('mismatch → pw.mismatch', () => {
		expect(confirmError('correct-pass-1', 'different-pass')).toBe('pw.mismatch');
	});
});

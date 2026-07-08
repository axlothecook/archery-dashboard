import { describe, it, expect } from 'vitest';
import {
	validateUsername,
	validateName,
	validateEmail,
	validatePhone,
	validateNewPassword,
	TEXT_MAX,
	PW_MIN,
	PW_MAX
} from './profileValidation';

describe('validateUsername', () => {
	it('empty → empty', () => expect(validateUsername('').state).toBe('empty'));
	it('valid letters/digits + _ - → ok', () => {
		expect(validateUsername('ax_lo-the-cook').state).toBe('ok');
	});
	it('allows Croatian diacritics (Joškica Pupić)', () =>
		expect(validateUsername('Joškica Pupić').state).toBe('ok'));
	it('allows whitespace', () => expect(validateUsername('ax lo').state).toBe('ok'));
	it('rejects a dot', () => expect(validateUsername('ax.lo').state).toBe('bad'));
	it('rejects forbidden signs', () => expect(validateUsername('ax@lo').state).toBe('bad'));
	it(`rejects > ${TEXT_MAX} chars`, () =>
		expect(validateUsername('a'.repeat(TEXT_MAX + 1)).state).toBe('bad'));
	it(`allows exactly ${TEXT_MAX}`, () =>
		expect(validateUsername('a'.repeat(TEXT_MAX)).state).toBe('ok'));
});

describe('validateName', () => {
	it('empty/whitespace → empty', () => {
		expect(validateName('').state).toBe('empty');
		expect(validateName('   ').state).toBe('empty');
	});
	it('letters + space + - + apostrophe → ok', () => {
		expect(validateName('Ana-Marija Kovačić').state).toBe('ok');
		expect(validateName("D'Angelo").state).toBe('ok');
		expect(validateName('Štime Žižić').state).toBe('ok');
	});
	it('rejects digits/symbols', () => {
		expect(validateName('John2').state).toBe('bad');
		expect(validateName('John@').state).toBe('bad');
	});
	it(`rejects > ${TEXT_MAX} chars`, () =>
		expect(validateName('a'.repeat(TEXT_MAX + 1)).state).toBe('bad'));
});

describe('validateEmail', () => {
	it('empty → empty', () => expect(validateEmail('').state).toBe('empty'));
	it('standard form → ok', () => expect(validateEmail('ime@primjer.com').state).toBe('ok'));
	it('rejects missing @', () => expect(validateEmail('imeprimjer.com').state).toBe('bad'));
	it('rejects nothing before @', () => expect(validateEmail('@primjer.com').state).toBe('bad'));
	it('rejects nothing after @', () => expect(validateEmail('ime@').state).toBe('bad'));
	it('rejects no dot in domain', () => expect(validateEmail('ime@primjer').state).toBe('bad'));
	it('rejects whitespace', () => expect(validateEmail('ime @primjer.com').state).toBe('bad'));
});

describe('validatePhone', () => {
	it('empty → empty', () => expect(validatePhone('').state).toBe('empty'));
	it('+ then 12 digits → ok', () => expect(validatePhone('+385912345678').state).toBe('ok'));
	it('spaces allowed (+385 91 234 5678) → ok', () =>
		expect(validatePhone('+385 91 234 5678').state).toBe('ok'));
	it('rejects missing +', () => expect(validatePhone('385912345678').state).toBe('bad'));
	it('rejects 11 digits', () => expect(validatePhone('+38591234567').state).toBe('bad'));
	it('rejects 13 digits', () => expect(validatePhone('+3859123456789').state).toBe('bad'));
	it('rejects non-digit/space chars', () =>
		expect(validatePhone('+385-91-234-5678').state).toBe('bad'));
});

describe('validateNewPassword', () => {
	it('empty → empty', () => expect(validateNewPassword('').state).toBe('empty'));
	it(`< ${PW_MIN} → bad`, () => expect(validateNewPassword('a'.repeat(PW_MIN - 1)).state).toBe('bad'));
	it(`exactly ${PW_MIN} → ok`, () => expect(validateNewPassword('a'.repeat(PW_MIN)).state).toBe('ok'));
	it(`exactly ${PW_MAX} → ok`, () => expect(validateNewPassword('a'.repeat(PW_MAX)).state).toBe('ok'));
	it(`> ${PW_MAX} → bad`, () => expect(validateNewPassword('a'.repeat(PW_MAX + 1)).state).toBe('bad'));
});

import { describe, it, expect, beforeEach } from 'vitest';
import { initSeen, hasNew, subHasNew, markSeen, sectionOf } from './newSections.svelte';

// The sidebar gold-dot logic: which sections have "new" content, per-session seen
// tracking (in-memory, resets each session), and propagating the dot onto the exact
// submenu sub-option. Uses Svelte 5 $state, so this file is `.svelte.test.ts`.

// A fresh session per test: initSeen with a new admin id clears the seen-set.
let admin = 0;
beforeEach(() => {
	initSeen(`admin-${admin++}`);
});

describe('sectionOf', () => {
	it('extracts the section from a dashboard path', () => {
		expect(sectionOf('/nadzorna-ploca/vijesti')).toBe('vijesti');
		expect(sectionOf('/nadzorna-ploca/raspored/svi')).toBe('raspored');
		expect(sectionOf('/nadzorna-ploca/momcad/uredi/123')).toBe('momcad');
	});
	it('returns null for the shell root or unknown segments', () => {
		expect(sectionOf('/nadzorna-ploca')).toBeNull();
		expect(sectionOf('/nadzorna-ploca/pocetno')).toBeNull(); // not a dot-carrying section
		expect(sectionOf('/some/other/path')).toBeNull();
	});
});

describe('hasNew', () => {
	it('true for a demo "new" section that is unseen', () => {
		expect(hasNew('vijesti')).toBe(true);
		expect(hasNew('upiti')).toBe(true);
	});
	it('false for a section not in the demo NEW set', () => {
		expect(hasNew('postignuca')).toBe(false);
		expect(hasNew('administracija')).toBe(false);
	});
	it('clears once the section is marked seen', () => {
		expect(hasNew('raspored')).toBe(true);
		markSeen('raspored');
		expect(hasNew('raspored')).toBe(false);
	});
	it('marking one section does not clear another', () => {
		markSeen('vijesti');
		expect(hasNew('vijesti')).toBe(false);
		expect(hasNew('sponzori')).toBe(true);
	});
});

describe('initSeen resets the seen-set (new session / admin switch)', () => {
	it('a fresh admin id restores all dots', () => {
		markSeen('vijesti');
		expect(hasNew('vijesti')).toBe(false);
		initSeen('a-different-admin');
		expect(hasNew('vijesti')).toBe(true); // back on a fresh session
	});
});

describe('subHasNew', () => {
	it('true only for the designated sub-option href of an unseen new section', () => {
		expect(subHasNew('/nadzorna-ploca/vijesti/objavljeno')).toBe(true);
		expect(subHasNew('/nadzorna-ploca/raspored/svi')).toBe(true);
	});
	it('false for a different sub-option of the same section', () => {
		expect(subHasNew('/nadzorna-ploca/vijesti/nacrti')).toBe(false);
		expect(subHasNew('/nadzorna-ploca/vijesti/novi')).toBe(false);
	});
	it('false once the parent section is seen', () => {
		expect(subHasNew('/nadzorna-ploca/momcad/svi')).toBe(true);
		markSeen('momcad');
		expect(subHasNew('/nadzorna-ploca/momcad/svi')).toBe(false);
	});
	it('false for a section with no submenu mapping', () => {
		expect(subHasNew('/nadzorna-ploca/upiti')).toBe(false); // upiti is a plain link, no sub-href
	});
});

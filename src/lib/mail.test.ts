import { describe, it, expect } from 'vitest';
import { toMailRows, relativeTime } from './mail';

// The "Dolazna pošta" preview mapping: the three Upiti inboxes → Mail rows, newest
// first, with a Croatian relative-time label. `now` is passed in so SSR + hydration
// agree (no clock drift). These are pure functions — no DOM/fetch needed.

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('relativeTime', () => {
	const now = Date.parse('2026-07-10T12:00:00Z');
	const ago = (ms: number) => new Date(now - ms).toISOString();

	it('< 1 min → "upravo sad"', () => {
		expect(relativeTime(ago(30_000), now)).toBe('upravo sad');
	});
	it('minutes → "prije N min"', () => {
		expect(relativeTime(ago(5 * MIN), now)).toBe('prije 5 min');
	});
	it('hours → "prije N h"', () => {
		expect(relativeTime(ago(3 * HOUR), now)).toBe('prije 3 h');
	});
	it('1 day → "jučer"', () => {
		expect(relativeTime(ago(DAY), now)).toBe('jučer');
	});
	it('several days → "prije N dana"', () => {
		expect(relativeTime(ago(3 * DAY), now)).toBe('prije 3 dana');
	});
	it('one week → "prije 1 tjedan" (singular)', () => {
		expect(relativeTime(ago(8 * DAY), now)).toBe('prije 1 tjedan');
	});
	it('multiple weeks → "prije N tjedna" (plural)', () => {
		expect(relativeTime(ago(21 * DAY), now)).toBe('prije 3 tjedna');
	});
	it('over ~5 weeks → falls back to a hr-HR date (not a relative label)', () => {
		const label = relativeTime(ago(60 * DAY), now);
		expect(label).not.toMatch(/prije|jučer|upravo/);
		expect(label).toMatch(/\d/); // a formatted date
	});
});

describe('toMailRows', () => {
	const now = Date.parse('2026-07-10T12:00:00Z');
	const rows = [
		{ id: 'a', kind: 'membership' as const, sender: 'Marija', submittedAt: '2026-07-10T09:00:00Z', unread: true },
		{ id: 'b', kind: 'sponsor' as const, sender: 'Tvrtka d.o.o.', submittedAt: '2026-07-10T11:30:00Z', unread: false },
		{ id: 'c', kind: 'donation' as const, sender: 'Ana', submittedAt: '2026-07-10T05:00:00Z', unread: true }
	];

	it('sorts newest-first by submittedAt', () => {
		const out = toMailRows(rows, now);
		expect(out.map((m) => m.sender)).toEqual(['Tvrtka d.o.o.', 'Marija', 'Ana']);
	});

	it('maps each kind to its Croatian MailType', () => {
		const out = toMailRows(rows, now);
		const byId = Object.fromEntries(out.map((m) => [m.id, m.type]));
		expect(byId['membership:a']).toBe('učlanjenje');
		expect(byId['sponsor:b']).toBe('sponzorstvo');
		expect(byId['donation:c']).toBe('donacija');
	});

	it('prefixes the id with the kind (stable, collision-free across inboxes)', () => {
		const out = toMailRows(rows, now);
		expect(out.map((m) => m.id)).toContain('membership:a');
	});

	it('carries the unread flag through', () => {
		const out = toMailRows(rows, now);
		expect(out.find((m) => m.id === 'membership:a')!.unread).toBe(true);
		expect(out.find((m) => m.id === 'sponsor:b')!.unread).toBe(false);
	});

	it('does not mutate the input array', () => {
		const input = [...rows];
		const order = input.map((r) => r.id);
		toMailRows(input, now);
		expect(input.map((r) => r.id)).toEqual(order);
	});

	it('empty input → empty output', () => {
		expect(toMailRows([], now)).toEqual([]);
	});
});

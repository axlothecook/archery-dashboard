// Shape + placeholder data for the weekly schedule panel (item 20). Each day holds
// a mix of scheduled EVENTS (competitions/training) and planned POSTS (news to
// publish). Placeholder until adoption — TODO: seed from GET /admin/schedule.
export type ScheduleKind = 'event' | 'post';

export type ScheduleItem = {
	id: string;
	kind: ScheduleKind;
	title: string;
	/** e.g. "18:00 – 20:00" or a single time "10:00" */
	time: string;
	/** avatar colour key of the responsible member (reuses the Tim palette) */
	color: 'blue' | 'purple' | 'green';
};

// Croatian weekday short labels, Monday-first (matches Croatian week convention).
export const HR_WEEKDAYS_SHORT = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

// Placeholder items keyed by weekday index (0 = Monday … 6 = Sunday). Only a few
// days have entries, to show the empty state too.
export const WEEK_ITEMS: ScheduleItem[][] = [
	// Pon
	[
		{ id: 'e1', kind: 'event', title: 'Trening seniori', time: '18:00 – 20:00', color: 'blue' }
	],
	// Uto
	[
		{ id: 'p1', kind: 'post', title: 'Objava: najava CEC 2. kola', time: '10:00', color: 'purple' },
		{ id: 'e2', kind: 'event', title: 'Trening juniori', time: '17:00 – 19:00', color: 'green' }
	],
	// Sri
	[],
	// Čet
	[
		{ id: 'e3', kind: 'event', title: 'Natjecanje: Oluja 2026', time: '09:00 – 15:00', color: 'blue' },
		{ id: 'p2', kind: 'post', title: 'Objava: rezultati vikenda', time: '12:00', color: 'purple' }
	],
	// Pet
	[
		{ id: 'e4', kind: 'event', title: 'Trening seniori', time: '18:00 – 20:00', color: 'blue' }
	],
	// Sub
	[
		{ id: 'e5', kind: 'event', title: 'Varaždin Open', time: '10:00 – 18:00', color: 'green' }
	],
	// Ned
	[]
];

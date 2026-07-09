// Shape for the "Dolazna pošta" (incoming mail) panel on Početno. Each row shows the
// sender, the inquiry type, and when it arrived. This is now REAL data: the Početno
// server load fetches the three Upiti inboxes and maps them to Mail rows (newest first)
// so the preview matches the Upiti section exactly. See toMailRows() below + +page.server.ts.
export type MailType = 'sponzorstvo' | 'učlanjenje' | 'donacija' | 'natjecanje' | 'ostalo';

export type Mail = {
	id: string;
	sender: string;
	type: MailType;
	time: string; // human "prije 2 h" style label (precomputed on the server)
	unread: boolean;
};

// The subset of an Upiti inbox row the preview needs — the three fetchers return richer
// objects, but Početno only needs a sender name, kind, arrival time and unread flag.
type InquiryLike = {
	id: string;
	kind: 'membership' | 'sponsor' | 'donation';
	sender: string;
	submittedAt: string; // ISO
	unread: boolean;
};

const KIND_TO_MAIL_TYPE: Record<InquiryLike['kind'], MailType> = {
	membership: 'učlanjenje',
	sponsor: 'sponzorstvo',
	donation: 'donacija'
};

// Croatian relative-time label ("prije 2 h", "jučer", "prije 3 dana") from an ISO date.
// `now` is passed in (from the server load) so the same value is used on SSR + hydration.
export function relativeTime(iso: string, now: number): string {
	const diffMs = now - new Date(iso).getTime();
	const min = Math.floor(diffMs / 60000);
	if (min < 1) return 'upravo sad';
	if (min < 60) return `prije ${min} min`;
	const h = Math.floor(min / 60);
	if (h < 24) return `prije ${h} h`;
	const d = Math.floor(h / 24);
	if (d === 1) return 'jučer';
	if (d < 7) return `prije ${d} dana`;
	const w = Math.floor(d / 7);
	if (w < 5) return `prije ${w} ${w === 1 ? 'tjedan' : 'tjedna'}`;
	return new Date(iso).toLocaleDateString('hr-HR');
}

// Map the three fetched inboxes into newest-first Mail rows for the preview. Sort by
// submittedAt desc so the freshest inquiry is on top, matching the Upiti list.
export function toMailRows(inquiries: InquiryLike[], now: number): Mail[] {
	return [...inquiries]
		.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
		.map((q) => ({
			id: `${q.kind}:${q.id}`,
			sender: q.sender,
			type: KIND_TO_MAIL_TYPE[q.kind],
			time: relativeTime(q.submittedAt, now),
			unread: q.unread
		}));
}

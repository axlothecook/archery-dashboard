import {
	fetchMembershipInquiries,
	fetchSponsorInquiries,
	fetchDonationInquiries
} from '$lib/inquiries';
import { toMailRows } from '$lib/mail';
import type { PageServerLoad } from './$types';

// Decide the greeting's random variant ONCE, on the server. The greeting band has
// two interchangeable phrases and we pick one at random; if that pick ran during
// render it would roll a DIFFERENT phrase on the server than on the client during
// hydration, and the client's phrase would replace the server's after hydration —
// the visible "budge" on refresh (e.g. "Dobra večer" → "Kakav je bio dan").
//
// Computing it in this server load fixes it: the value is serialized into the page
// and the client hydrates with the SAME index, so it never re-rolls. `greetVariant`
// is 0 or 1 (each band has exactly two phrases).
export const load: PageServerLoad = async ({ fetch, request }) => {
	const greetVariant = Math.random() < 0.5 ? 0 : 1;

	// "Dolazna pošta" preview = the SAME real inquiries as the Upiti section (newest first).
	// Each inbox soft-fails to [] so a broken one doesn't blank the whole Početno page.
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : undefined;
	const [membership, sponsor, donation] = await Promise.all([
		fetchMembershipInquiries(fetch, headers).catch(() => []),
		fetchSponsorInquiries(fetch, headers).catch(() => []),
		fetchDonationInquiries(fetch, headers).catch(() => [])
	]);

	// `now` is stamped here (server) and passed through so the relative-time labels match
	// on SSR + hydration (no refresh budge). Map each inbox row to the preview shape;
	// "unread" mirrors the Upiti "Novo" state (status === 'new').
	const now = Date.now();
	const mail = toMailRows(
		[
			...membership.map((m) => ({ id: m.id, kind: 'membership' as const, sender: m.fullName, submittedAt: m.submittedAt, unread: m.status === 'new' })),
			...sponsor.map((s) => ({ id: s.id, kind: 'sponsor' as const, sender: s.companyName, submittedAt: s.submittedAt, unread: s.status === 'new' })),
			...donation.map((d) => ({ id: d.id, kind: 'donation' as const, sender: d.donorName, submittedAt: d.submittedAt, unread: d.status === 'new' }))
		],
		now
	);

	return { greetVariant, mail };
};

import {
	fetchMembershipInquiries,
	fetchSponsorInquiries,
	fetchDonationInquiries,
	type MembershipSubmission,
	type SponsorInquiry,
	type DonationInquiry
} from '$lib/inquiries';
import type { PageServerLoad } from './$types';

// Load all three inquiry inboxes (membership / sponsor / donation) for the Upiti page.
// Each soft-fails independently to an empty list so one broken inbox doesn't 500 the page.
export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : undefined;

	const membership = await fetchMembershipInquiries(fetch, headers).catch(() => null);
	const sponsor = await fetchSponsorInquiries(fetch, headers).catch(() => null);
	const donation = await fetchDonationInquiries(fetch, headers).catch(() => null);

	return {
		membership: (membership ?? []) as MembershipSubmission[],
		sponsor: (sponsor ?? []) as SponsorInquiry[],
		donation: (donation ?? []) as DonationInquiry[],
		loadError: membership === null || sponsor === null || donation === null
	};
};

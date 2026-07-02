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
export const load: PageServerLoad = async () => {
	return { greetVariant: Math.random() < 0.5 ? 0 : 1 };
};

import { redirect } from '@sveltejs/kit';

// /admin is the post-login landing, but the dashboard lives at
// /admin/nadzorna-ploca. Forward there so login (which goes to /admin) lands on
// the real dashboard and there is no empty /admin index.
export const load = () => {
	throw redirect(307, '/admin/nadzorna-ploca');
};

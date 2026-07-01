// Placeholder profile for the currently-signed-in admin shown in the dashboard
// demo. We deliberately show an ADMIN (not the real dev login behind data.admin)
// so the UI demonstrates the admin experience. Wire this to the real /auth/me
// account on adoption. Fields except the avatar image are user-entered at account
// creation; the avatar is a colour circle + role letter for now (TODO on adoption:
// real image upload).
export type AdminProfile = {
	displayName: string;
	realName: string;
	role: 'admin' | 'developer';
	email: string;
	phone: string;
	/** avatar colour key — matches the Tim avatar colours */
	color: 'blue' | 'purple' | 'green';
};

export const currentAdmin: AdminProfile = {
	displayName: 'Joškica Pupić',
	realName: 'Josip Pupić',
	role: 'admin',
	email: 'joskica.pupic@vsk.hr',
	phone: '+385 91 234 5678',
	color: 'blue'
};

// Role letter for the avatar (A = admin, D = developer).
export const roleLetter = (role: AdminProfile['role']) => (role === 'developer' ? 'D' : 'A');

// Shared shape for a dashboard team member. Fields except the avatar image are
// user-entered at account creation; the avatar is a colour circle with a role
// letter for now (TODO on adoption: real image-upload field). Used by the Tim
// list on the landing page and the reusable <TeamMember> row/popover component.
export type Member = {
	id: string;
	displayName: string;
	realName: string;
	role: 'admin' | 'developer';
	email: string;
	phone: string;
	/** explicit avatar colour key: 'purple' | 'green' | 'blue' */
	color: 'purple' | 'green' | 'blue';
};

// Role letter shown inside the avatar circle (A = admin, D = developer).
export const roleLetter = (role: Member['role']) => (role === 'developer' ? 'D' : 'A');

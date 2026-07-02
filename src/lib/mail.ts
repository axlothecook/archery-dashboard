// Shape + placeholder data for the "Dolazna pošta" (incoming mail) panel. Each row
// shows only the sender, the inquiry type, and when it arrived (no body preview).
// No backend yet — TODO(adoption): wire to the club inbox.
export type MailType = 'sponzorstvo' | 'učlanjenje' | 'natjecanje' | 'ostalo';

export type Mail = {
	id: string;
	sender: string;
	type: MailType;
	time: string;
	unread: boolean;
};

export const MAILS: Mail[] = [
	// New (made-up) sponsor prospect — Lasercopy is already an existing sponsor.
	{ id: 'm1', sender: 'Varaždin Optika d.o.o.', type: 'sponzorstvo', time: 'prije 1 h', unread: true },
	{ id: 'm2', sender: 'Ivan Horvat', type: 'učlanjenje', time: 'prije 3 h', unread: true },
	{ id: 'm3', sender: 'HSS Savez', type: 'natjecanje', time: 'jučer', unread: false }
];

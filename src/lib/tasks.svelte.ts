// Shared reactive tasks store (item 21). The tasks table on the dashboard reads
// and mutates this; because it's Svelte 5 `$state`, the in-progress count and the
// table update live. Placeholder data until adoption — TODO: seed from and persist
// to GET/POST /admin/tasks.
export type TaskStatus = 'in_progress' | 'pending' | 'done';

export type Task = {
	id: string;
	title: string;
	/** assignee: a team member's display name (name only, per the design) */
	assignee: string;
	/** due date as an ISO yyyy-mm-dd string; formatted for display in the table */
	due: string;
	status: TaskStatus;
	/** approved by the head admin (Joškica); only the head admin may toggle this */
	approved: boolean;
};

// Croatian status labels (stored value stays the enum).
export const STATUS_LABEL: Record<TaskStatus, string> = {
	in_progress: 'U tijeku',
	pending: 'Na čekanju',
	done: 'Završeno'
};

// The head admin who may approve tasks. Matches the current placeholder admin.
export const HEAD_ADMIN = 'Joškica Pupić';

export const tasks = $state<Task[]>([
	{
		id: 't1',
		title: 'Objaviti članak o pobjedi na Varaždin Openu',
		assignee: 'zekke87',
		due: '2026-07-04',
		status: 'in_progress',
		approved: false
	},
	{
		id: 't2',
		title: 'Dovršiti nacrt članka "Najava sezone" i objaviti ga',
		assignee: 'axlothecook',
		due: '2026-07-06',
		status: 'pending',
		approved: false
	},
	{
		id: 't3',
		title: 'Ažurirati biografiju za Amandu Mlinarić',
		assignee: 'Joškica Pupić',
		due: '2026-07-02',
		status: 'in_progress',
		approved: true
	},
	{
		id: 't4',
		title: 'Dovršiti raspored za srpanj',
		assignee: 'zekke87',
		due: '2026-06-30',
		status: 'done',
		approved: true
	}
]);

let nextId = tasks.length;

export function addTask(t: Omit<Task, 'id' | 'approved'>) {
	tasks.push({ ...t, id: `t${++nextId}`, approved: false });
}

export function updateTask(id: string, patch: Partial<Omit<Task, 'id'>>) {
	const task = tasks.find((x) => x.id === id);
	if (task) Object.assign(task, patch);
}

export function deleteTask(id: string) {
	const i = tasks.findIndex((x) => x.id === id);
	if (i !== -1) tasks.splice(i, 1);
}

export function setApproved(id: string, value: boolean) {
	const task = tasks.find((x) => x.id === id);
	if (task) task.approved = value;
}

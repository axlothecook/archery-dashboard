<script lang="ts">
	// One task row in the tasks table (item 21). Repeats per task, so it's its own
	// component. Cells: Zadatak / Dodijeljeno / Rok / Status / Završetak odobren / edit.
	// "Završetak odobren" only applies to FINISHED tasks (status = done): the green
	// tick DELETES the task (finish approved → confirm first), the red X keeps it
	// (not approved to finish). For non-finished tasks both are greyed + not-allowed.
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import { STATUS_LABEL, type Task } from '$lib/tasks.svelte';

	let {
		task,
		canApprove,
		onEdit,
		onApproveFinish,
		onRejectFinish
	}: {
		task: Task;
		canApprove: boolean;
		onEdit: (t: Task) => void;
		onApproveFinish: (id: string) => void; // tick → delete (approved to finish)
		onRejectFinish: (id: string) => void; // X → keep, not approved
	} = $props();

	// Approve controls only act on finished tasks; and only the head admin may use them.
	const enabled = $derived(canApprove && task.status === 'done');

	function fmtDue(iso: string): string {
		if (!iso) return '-';
		const [y, m, d] = iso.split('-');
		return `${Number(d)}.${Number(m)}.${y}.`;
	}

	// Overdue: the deadline is today or in the past → shown red (any status).
	const overdue = $derived.by(() => {
		if (!task.due) return false;
		const t = new Date();
		const todayIso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
		return task.due <= todayIso;
	});

	// The name cell is capped at the first task's width; if THIS title is longer it
	// overflows and we fade the right edge (mask). Only apply the fade when it's
	// actually overflowing, so short titles aren't faded at their tail.
	let nameCell: HTMLTableCellElement | undefined = $state();
	let overflowing = $state(false);
	$effect(() => {
		void task.title; // re-check when the title changes
		if (nameCell) overflowing = nameCell.scrollWidth > nameCell.clientWidth + 1;
	});
</script>

<tr>
	<td class="tasks-name fw-600" class:faded={overflowing} bind:this={nameCell}>{task.title}</td>
	<td>{task.assignee}</td>
	<td class="tasks-due" class:overdue class:text-jet-grey={!overdue}>{fmtDue(task.due)}</td>
	<td>
		<span class="tasks-status fw-600 tasks-status--{task.status}">{STATUS_LABEL[task.status]}</span>
	</td>
	<td>
		<!-- Finished tasks only: tick = approve finish (delete, w/ confirm), X = keep.
		     Non-finished: both greyed + not-allowed. No backgrounds; SVGs are coloured. -->
		<div class="tasks-appr display-f align-items-center">
			<button
				class="tasks-appr-btn tasks-appr-btn--yes display-f align-items-center justify-content-center"
				class:enabled
				type="button"
				disabled={!enabled}
				aria-label="Odobri završetak (obriši zadatak)"
				title={enabled ? 'Odobri završetak (briše zadatak)' : 'Dostupno samo za završene zadatke'}
				onclick={() => onApproveFinish(task.id)}
			>
				<CheckIcon size={22} />
			</button>
			<span class="tasks-appr-divider" aria-hidden="true"></span>
			<button
				class="tasks-appr-btn tasks-appr-btn--no display-f align-items-center justify-content-center"
				class:enabled
				type="button"
				disabled={!enabled}
				aria-label="Odbij završetak (zadatak ostaje)"
				title={enabled ? 'Nije odobreno (zadatak ostaje)' : 'Dostupno samo za završene zadatke'}
				onclick={() => onRejectFinish(task.id)}
			>
				<CloseIcon size={22} />
			</button>
		</div>
	</td>
	<td class="tasks-edit-cell">
		<button class="tasks-act cursor-pointer display-f" type="button" aria-label="Uredi" title="Uredi" onclick={() => onEdit(task)}>
			<EditIcon size={18} />
		</button>
	</td>
</tr>

<style>
	td {
		padding: 0.75rem;
		color: #102e66;
		border-bottom: 1px solid #f3f5f8;
		vertical-align: middle;
	}
	/* Task-name cell: fixed max width = the first task's single-line width (~21.25rem,
	   measured). Longer titles stay on ONE line and, instead of a "…" ellipsis, FADE
	   to transparent at the right edge (a mask gradient) — since the panel behind is
	   white, the text fades to white. */
	.tasks-name {
		max-width: 21.25rem;
		white-space: nowrap;
		overflow: hidden;
	}
	/* Only fade when the title actually overflows the capped width (set via JS). */
	.tasks-name.faded {
		-webkit-mask-image: linear-gradient(to right, #000 82%, transparent 100%);
		mask-image: linear-gradient(to right, #000 82%, transparent 100%);
	}
	.tasks-due {
		white-space: nowrap;
	}
	/* Deadline today or passed → red. */
	.tasks-due.overdue {
		color: #d32752;
		font-weight: 600;
	}

	/* Status: BLACK text on a pill-shaped coloured background. */
	.tasks-status {
		display: inline-block;
		padding: 0.25rem 0.8rem;
		border-radius: 999px;
		font-size: 0.92rem;
		color: #1b1b1b;
		white-space: nowrap;
	}
	.tasks-status--in_progress {
		background: #cfe0fb;
	}
	.tasks-status--pending {
		background: #fde7d8;
	}
	.tasks-status--done {
		background: #d4f3df;
	}

	/* Approve controls: coloured SVGs, no background, both lit at once when enabled;
	   greyed + not-allowed for non-finished tasks. Thin grey divider between them. */
	.tasks-appr {
		gap: 0.5rem;
	}
	.tasks-appr-btn {
		width: 1.9rem;
		height: 1.9rem;
		padding: 0;
		border: 0;
		background: none;
		color: #c2c8d2; /* greyed by default */
		cursor: not-allowed;
	}
	.tasks-appr-btn--yes.enabled {
		color: #10683a;
		cursor: pointer;
	}
	.tasks-appr-btn--no.enabled {
		color: #a4133c;
		cursor: pointer;
	}
	.tasks-appr-divider {
		width: 1px;
		height: 1.2rem;
		background: #d7dee8;
	}

	/* Pencil sits close to the approve controls (narrow cell, no extra left space). */
	.tasks-edit-cell {
		width: 1%;
		padding-left: 0.25rem;
	}
	.tasks-act {
		align-items: center;
		border: 0;
		background: none;
		padding: 0.25rem;
		color: #5b6577;
		transition: color 0.15s ease;
	}
	.tasks-act:hover {
		color: #187ff5;
	}
</style>

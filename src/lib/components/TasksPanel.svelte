<script lang="ts">
	// Tasks panel (item 21): a table of tasks (Zadatak / Dodijeljeno / Rok / Status /
	// Odobreno / Akcije) with an in-progress count in the header and a "Dodaj zadatak"
	// button that opens a modal to add (or edit) a task. Reads/mutates the shared
	// reactive `tasks` store, so the table + count update live. Each row is the
	// reusable <TaskRow> component. "Odobreno" is toggleable only by the head admin.
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';
	import TextSizeIcon from '$lib/components/icons/TextSizeIcon.svelte';
	import PeopleIcon from '$lib/components/icons/PeopleIcon.svelte';
	import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
	import StatusIcon from '$lib/components/icons/StatusIcon.svelte';
	import ApproveIcon from '$lib/components/icons/ApproveIcon.svelte';
	import TaskRow from '$lib/components/TaskRow.svelte';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import {
		tasks,
		addTask,
		updateTask,
		deleteTask,
		setApproved,
		STATUS_LABEL,
		HEAD_ADMIN,
		type Task,
		type TaskStatus
	} from '$lib/tasks.svelte';
	import { team, getCurrentAdmin } from '$lib/teamStore.svelte';

	// Only the head admin may approve; the current placeholder admin is the head admin.
	const isHeadAdmin = $derived(getCurrentAdmin().displayName === HEAD_ADMIN);

	// Dropdown option lists for the modal.
	const assigneeOptions = $derived(team.map((m) => ({ value: m.displayName, label: m.displayName })));
	const statusOptions: { value: string; label: string }[] = [
		{ value: 'pending', label: STATUS_LABEL.pending },
		{ value: 'in_progress', label: STATUS_LABEL.in_progress },
		{ value: 'done', label: STATUS_LABEL.done }
	];

	// ── Add / edit modal ─────────────────────────────────────────────────────────
	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let fTitle = $state('');
	let fAssignee = $state('');
	// Rok is entered as dd/mm/yyyy (EU) text; stored as ISO yyyy-mm-dd.
	let fDue = $state('');
	// String-typed for the DashSelect binding; cast back to TaskStatus on submit.
	let fStatus = $state<string>('pending');
	const anim = { duration: 150, start: 0.97, opacity: 0, easing: cubicOut };

	// ISO (yyyy-mm-dd) ⇄ EU (dd/mm/yyyy) helpers for the Rok text field.
	function isoToEu(iso: string): string {
		if (!iso) return '';
		const [y, m, d] = iso.split('-');
		return `${d}/${m}/${y}`;
	}
	function euToIso(eu: string): string {
		const m = eu.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
		if (!m) return '';
		const [, d, mo, y] = m;
		return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
	}

	// Exported so the page can trigger "Dodaj zadatak" from the heading row (which
	// sits OUTSIDE this panel).
	export function openAdd() {
		editingId = null;
		fTitle = '';
		fAssignee = team[0]?.displayName ?? '';
		fDue = '';
		fStatus = 'pending';
		modalOpen = true;
	}
	function openEdit(t: Task) {
		editingId = t.id;
		fTitle = t.title;
		fAssignee = t.assignee;
		fDue = isoToEu(t.due);
		fStatus = t.status;
		modalOpen = true;
	}
	function closeModal() {
		modalOpen = false;
	}
	function submitModal(e: SubmitEvent) {
		e.preventDefault();
		if (!fTitle.trim()) return;
		const status = fStatus as TaskStatus;
		const dueIso = euToIso(fDue); // '' if blank/invalid
		if (editingId) {
			updateTask(editingId, { title: fTitle, assignee: fAssignee, due: dueIso, status });
		} else {
			addTask({ title: fTitle, assignee: fAssignee, due: dueIso, status });
		}
		modalOpen = false;
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') modalOpen = false;
	}

	// Završetak odobren (finished tasks only). Tick = approve finishing → delete the
	// task (confirm first). X = not approved → keep it, mark unapproved.
	function approveFinish(id: string) {
		const t = tasks.find((x) => x.id === id);
		const ok = confirm(`Odobriti završetak i obrisati zadatak "${t?.title ?? ''}"?`);
		if (ok) deleteTask(id);
	}
	function rejectFinish(id: string) {
		setApproved(id, false);
	}
</script>

<svelte:window onkeydown={onKey} />

<section class="panel bg-white tasks">
	<div class="tasks-scroll overflow-x-auto">
		<table class="tasks-table w-full">
			<thead>
				<tr>
					<th><span class="th-in display-f align-items-center gap-0-4"><TextSizeIcon size={18} />Ime zadatka</span></th>
					<th><span class="th-in display-f align-items-center gap-0-4"><PeopleIcon size={18} />Dodijeljeno</span></th>
					<th><span class="th-in display-f align-items-center gap-0-4"><ClockIcon size={18} />Rok</span></th>
					<th><span class="th-in display-f align-items-center gap-0-4"><StatusIcon size={18} />Status</span></th>
					<th><span class="th-in display-f align-items-center gap-0-4"><ApproveIcon size={18} />Završetak odobren</span></th>
					<th class="tasks-actions-col"></th>
				</tr>
			</thead>
			<tbody>
				{#each tasks as t (t.id)}
					<TaskRow
						task={t}
						canApprove={isHeadAdmin}
						onEdit={openEdit}
						onApproveFinish={approveFinish}
						onRejectFinish={rejectFinish}
					/>
				{:else}
					<tr><td class="tasks-empty t-center" colspan="6">Nema zadataka.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

{#if modalOpen}
	<!-- Add / edit task modal. -->
	<div class="modal-backdrop position-fixed" role="presentation" onclick={closeModal}></div>
	<div class="modal position-fixed br-lg" role="dialog" aria-modal="true" aria-label="Zadatak" transition:scale={anim}>
		<header class="modal-head display-f align-items-center justify-content-space-between">
			<h3 class="modal-title">{editingId ? 'Uredi zadatak' : 'Dodaj zadatak'}</h3>
			<button class="modal-close cursor-pointer br-full display-f align-items-center justify-content-center" type="button" aria-label="Zatvori" onclick={closeModal}>
				<CloseIcon size={22} />
			</button>
		</header>
		<form class="modal-form column-nowrap gap-1" onsubmit={submitModal}>
			<label class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Zadatak</span>
				<input class="field-input w-full br-xs" type="text" bind:value={fTitle} required />
			</label>
			<div class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Dodijeljeno</span>
				<DashSelect options={assigneeOptions} bind:value={fAssignee} ariaLabel="Dodijeljeno" />
			</div>
			<label class="field column-nowrap gap-0-3">
				<span class="field-label fw-600">Rok</span>
				<input
					class="field-input w-full br-xs"
					type="text"
					inputmode="numeric"
					placeholder="dd/mm/gggg"
					pattern="\d{'{'}1,2{'}'}/\d{'{'}1,2{'}'}/\d{'{'}4{'}'}"
					bind:value={fDue}
				/>
			</label>
			<!-- Status is NOT settable when adding — a new task is always "Na čekanju".
			     Only shown when editing an existing task (to move it along). -->
			{#if editingId}
				<div class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Status</span>
					<DashSelect options={statusOptions} bind:value={fStatus} ariaLabel="Status" />
				</div>
			{/if}
			<div class="modal-actions display-f justify-content-flex-end gap-0-5">
				<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" onclick={closeModal}>Odustani</button>
				<button class="btn btn--primary cursor-pointer br-xs fw-600" type="submit">
					{editingId ? 'Spremi' : 'Dodaj'}
				</button>
			</div>
		</form>
	</div>
{/if}

<style>
	/* Panel surface: padding + radius + shadow live here (the +page `.panel` rule is
	   scoped to that file and doesn't reach this child component). */
	.tasks {
		padding: 1.4rem 1.5rem;
		border-radius: 14px;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
	}

	/* Fixed to the sticky header + exactly 4 rows (≈39px + 4×55px ≈ 263px; 16.5rem
	   gives a hair of headroom so 4 rows show with NO scrollbar). Adding a 5th row
	   overflows → it scrolls (Hitno-style navy scrollbar, no OS arrows) without the
	   panel growing. */
	.tasks-scroll {
		height: 16.5rem;
		overflow-y: auto;
	}
	.tasks-scroll::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	.tasks-scroll::-webkit-scrollbar-track {
		background: transparent;
	}
	.tasks-scroll::-webkit-scrollbar-thumb {
		background: #102e66;
		border-radius: 4px;
	}
	.tasks-scroll::-webkit-scrollbar-corner {
		background: transparent;
	}
	.tasks-scroll::-webkit-scrollbar-button {
		display: none;
		width: 0;
		height: 0;
	}
	.tasks-table {
		border-collapse: collapse;
		font-size: 1rem;
	}
	/* Column titles: bigger, bold, black; icon (provided) sits to the left via .th-in.
	   Sticky so they stay visible while the body scrolls. */
	.tasks-table thead th {
		position: sticky;
		top: 0;
		background: #fff;
		z-index: 1;
	}
	.tasks-table th {
		text-align: left;
		padding: 0.65rem 0.75rem;
		font-size: 1.02rem;
		font-weight: 700;
		color: #1b1b1b;
		border-bottom: 1px solid #eef1f3;
		white-space: nowrap;
	}
	.tasks-actions-col {
		width: 1%;
	}
	.tasks-empty {
		color: #9aa3b2;
		padding: 1.5rem 0;
	}

	/* ── Modal ── */
	.modal-backdrop {
		inset: 0;
		background: rgba(16, 46, 102, 0.28);
		z-index: 80;
	}
	.modal {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		transform-origin: center;
		width: 30rem;
		max-width: calc(100vw - 2rem);
		padding: 1.5rem;
		background: #fff;
		box-shadow: 0 12px 40px rgba(16, 46, 102, 0.25);
		z-index: 81;
	}
	.modal-head {
		margin-bottom: 1.1rem;
	}
	.modal-title {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
		color: #102e66;
	}
	.modal-close {
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		background: none;
		color: #5b6577;
	}
	.modal-close:hover {
		background: #eef1f3;
	}
	.field-label {
		font-size: 0.85rem;
		color: #5b6577;
	}
	.field-input {
		box-sizing: border-box;
		padding: 0.6rem 0.8rem;
		border: 1px solid #d7dee8;
		font-size: 0.95rem;
		font-family: inherit;
		color: #102e66;
		background: #fff;
	}
	.field-input:focus {
		outline: none;
		border-color: #187ff5;
	}
	.modal-actions {
		margin-top: 0.5rem;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		font-size: 0.9rem;
		font-family: inherit;
		border: 1px solid transparent;
	}
	.btn--primary {
		background: #102e66;
		color: #fff;
	}
	.btn--primary:hover {
		background: #0c2350;
	}
	.btn--ghost {
		background: #fff;
		color: #5b6577;
		border-color: #d7dee8;
	}
	.btn--ghost:hover {
		background: #eef1f3;
	}
</style>

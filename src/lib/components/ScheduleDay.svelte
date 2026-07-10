<script lang="ts">
	// One weekday tab in the schedule strip (Pon 29, Uto 30, …). Repeats per day, so
	// it's its own component. Raises selection up via onSelect.
	let {
		name,
		dayNum,
		selected,
		today,
		onSelect
	}: {
		name: string;
		dayNum: number;
		selected: boolean;
		today: boolean;
		onSelect: () => void;
	} = $props();
</script>

<button
	class="sched-day cursor-pointer column-nowrap align-items-center"
	class:selected
	class:today
	type="button"
	onclick={onSelect}
>
	<span class="sched-day-name">{name}</span>
	<span class="sched-day-num fw-700">{dayNum}</span>
</button>

<style>
	.sched-day {
		flex: 1 1 0;
		display: flex;
		gap: 0.15rem;
		padding: 0.45rem 0;
		border: 0;
		border-radius: 10px;
		background: #f6f8fa;
		transition: background-color 0.15s ease;
	}
	.sched-day:hover {
		background: #e8edf2;
	}
	.sched-day-name {
		font-size: 0.82rem;
		color: #9aa3b2;
	}
	.sched-day-num {
		font-size: 1.1rem;
		color: #102e66;
	}
	/* Today = subtle ring; selected = filled highlight. The SELECTED day drops the ring
	   (no border on the picked date, per request) — the fill alone marks it; the ring
	   still cues "today" when a different day is selected. */
	.sched-day.today {
		box-shadow: inset 0 0 0 1px #187ff5;
	}
	.sched-day.selected {
		background: #dbe6f6;
		box-shadow: none;
	}
	.sched-day.selected .sched-day-name {
		color: #1657b8;
	}
</style>

<script lang="ts">
	// Weekly schedule panel (item 20). The title + week arrows live OUTSIDE the panel
	// (in the page heading row), which call the exported prevWeek/nextWeek. This
	// component renders the Mon–Sun day strip (<ScheduleDay>) + the selected day's
	// items (<ScheduleItem>), swap-animated on change. Placeholder data (schedule.ts).
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ScheduleDay from '$lib/components/ScheduleDay.svelte';
	import ScheduleItem from '$lib/components/ScheduleItem.svelte';
	import { HR_WEEKDAYS_SHORT, WEEK_ITEMS } from '$lib/schedule';

	// The page hides the prev/next arrows when the shown week is at the start/end of
	// the current month (only ONE month is browsable). The panel keeps these in sync.
	let { canPrev = $bindable(true), canNext = $bindable(true) } = $props();

	function mondayOf(d: Date): Date {
		const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
		const dow = (copy.getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
		copy.setDate(copy.getDate() - dow);
		return copy;
	}
	const today = new Date();
	const baseMonday = mondayOf(today);
	const todayIndex = (today.getDay() + 6) % 7;
	const curMonth = today.getMonth();
	const curYear = today.getFullYear();

	let weekOffset = $state(0);
	let selectedDay = $state(todayIndex);
	let dir = $state(1); // swap direction for the animation

	// The 7 dates of the week at a given offset from this week's Monday.
	function weekDatesAt(offset: number): Date[] {
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(baseMonday);
			d.setDate(baseMonday.getDate() + offset * 7 + i);
			return d;
		});
	}
	// Does the week at `offset` contain any day of the CURRENT month?
	function weekTouchesCurMonth(offset: number): boolean {
		return weekDatesAt(offset).some((d) => d.getMonth() === curMonth && d.getFullYear() === curYear);
	}

	const weekDates = $derived(weekDatesAt(weekOffset));
	const selectedItems = $derived(WEEK_ITEMS[selectedDay] ?? []);
	const listKey = $derived(`${weekOffset}:${selectedDay}`);

	// Can we step to the previous / next week and still stay within the current month?
	$effect(() => {
		canPrev = weekTouchesCurMonth(weekOffset - 1);
		canNext = weekTouchesCurMonth(weekOffset + 1);
	});

	// Exported so the page's outside arrows can move between weeks (guarded).
	export function prevWeek() {
		if (!weekTouchesCurMonth(weekOffset - 1)) return;
		dir = -1;
		weekOffset -= 1;
	}
	export function nextWeek() {
		if (!weekTouchesCurMonth(weekOffset + 1)) return;
		dir = 1;
		weekOffset += 1;
	}
	function selectDay(i: number) {
		dir = i >= selectedDay ? 1 : -1;
		selectedDay = i;
	}
	const isToday = (i: number) => weekOffset === 0 && i === todayIndex;
</script>

<section class="panel bg-white schedule">
	<div class="sched-days display-f gap-0-5">
		{#each weekDates as d, i (i)}
			<ScheduleDay
				name={HR_WEEKDAYS_SHORT[i]}
				dayNum={d.getDate()}
				selected={i === selectedDay}
				today={isToday(i)}
				onSelect={() => selectDay(i)}
			/>
		{/each}
	</div>

	{#key listKey}
		<ul class="sched-list column-nowrap gap-0-6" in:fly={{ x: dir * 24, duration: 180, easing: cubicOut }}>
			{#each selectedItems as item (item.id)}
				<ScheduleItem {item} />
			{:else}
				<li class="sched-empty t-center">Nema stavki za ovaj dan.</li>
			{/each}
		</ul>
	{/key}
</section>

<style>
	/* Panel surface (the +page `.panel` rule is scoped to that file). A min-height
	   makes it a bit taller / reach lower, and keeps it level with the mail panel. */
	.schedule {
		display: flex;
		flex-direction: column;
		padding: 1.4rem 1.5rem;
		border-radius: 14px;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		height: 20rem;
	}
	.sched-days {
		margin-bottom: 1rem;
		flex: 0 0 auto;
	}
	/* Day-item list fills the remaining height and scrolls (Hitno-style scrollbar,
	   no OS arrows) when the day has more items than fit. */
	.sched-list {
		margin: 0;
		padding: 0;
		list-style: none;
		flex: 1 1 auto;
		overflow-y: auto;
	}
	.sched-list::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	.sched-list::-webkit-scrollbar-track {
		background: transparent;
	}
	.sched-list::-webkit-scrollbar-thumb {
		background: #102e66;
		border-radius: 4px;
	}
	.sched-list::-webkit-scrollbar-corner {
		background: transparent;
	}
	.sched-list::-webkit-scrollbar-button {
		display: none;
		width: 0;
		height: 0;
	}
	.sched-empty {
		list-style: none;
		padding: 1.25rem 0;
		font-size: 0.88rem;
		color: #9aa3b2;
	}
</style>

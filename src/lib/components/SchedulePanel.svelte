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

	// All week offsets that touch the current month → drives the pager indicator (one line
	// per browsable week; the current week is highlighted). Scan a generous range and keep
	// the contiguous run of in-month weeks around offset 0.
	const weekOffsets = (() => {
		const offs: number[] = [];
		for (let o = -6; o <= 6; o++) if (weekTouchesCurMonth(o)) offs.push(o);
		return offs;
	})();
	const weekIndex = $derived(weekOffsets.indexOf(weekOffset));

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

	// Swipe to page weeks (TOUCH/PEN only): drag the day strip horizontally — left → next
	// week, right → previous. On DESKTOP (mouse) swipe is disabled — the arrow buttons in the
	// page heading are the desktop mechanism — so a mouse drag never pages the week. Commits
	// AS SOON AS the horizontal drag passes the threshold DURING the move (responsive, not
	// clunky); `armed` ensures one week-change per gesture and re-arms on the next pointerdown.
	const SWIPE_MIN = 28; // px horizontal travel to trigger a week change
	let swipeX = 0;
	let swipeY = 0;
	let armed = false;
	function onPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse') return; // desktop uses the arrow buttons, not swipe
		armed = true;
		swipeX = e.clientX;
		swipeY = e.clientY;
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {
			/* capture unsupported → pointermove still fires */
		}
	}
	function onPointerMove(e: PointerEvent) {
		if (!armed) return;
		const dx = e.clientX - swipeX;
		const dy = e.clientY - swipeY;
		// Ignore mostly-vertical drags (let the page scroll).
		if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
		armed = false; // fire once per gesture
		if (dx < 0) nextWeek();
		else prevWeek();
	}
	function endSwipe() {
		armed = false;
	}
</script>

<section
	class="panel bg-white schedule"
	role="group"
	aria-label="Tjedni raspored: povucite lijevo ili desno za promjenu tjedna"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={endSwipe}
	onpointercancel={endSwipe}
>
	<!-- Week strip: swipe left/right to page weeks; it slides in the swipe direction. The
	     `overflow: hidden` wrapper clips the sliding strip so it doesn't bleed past the panel. -->
	<div class="sched-days-wrap">
		{#key weekOffset}
			<div
				class="sched-days display-f gap-0-5"
				in:fly={{ x: dir * 60, duration: 220, easing: cubicOut }}
			>
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
		{/key}
	</div>

	{#key listKey}
		<ul class="sched-list column-nowrap gap-0-6 custom-scrollbar" in:fly={{ x: dir * 24, duration: 180, easing: cubicOut }}>
			{#each selectedItems as item (item.id)}
				<ScheduleItem {item} />
			{:else}
				<li class="sched-empty t-center">Nema stavki za ovaj dan.</li>
			{/each}
		</ul>
	{/key}

	<!-- Week pager: one line per browsable week (of the current month); the current week
	     is highlighted, so it's clear WHERE you are and how many weeks there are to swipe
	     through. Also tappable to jump directly to a week. -->
	<div class="sched-pager display-f align-items-center justify-content-center gap-0-5" aria-hidden="true">
		{#each weekOffsets as off, idx (off)}
			<button
				class="sched-pager-line"
				class:active={idx === weekIndex}
				type="button"
				aria-label={`Tjedan ${idx + 1}`}
				onclick={() => {
					dir = off > weekOffset ? 1 : -1;
					weekOffset = off;
				}}
			></button>
		{/each}
	</div>
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
	/* Clips the sliding week strip so it doesn't bleed past the panel during the fly-in.
	   touch-action pan-y keeps vertical page scroll working while we handle horizontal swipe. */
	.sched-days-wrap {
		overflow: hidden;
		margin-bottom: 1rem;
		flex: 0 0 auto;
		touch-action: pan-y;
	}
	.sched-days {
		flex: 0 0 auto;
	}
	/* The whole panel is a swipe target; hint the browser we handle horizontal gestures. */
	.schedule {
		touch-action: pan-y;
	}
	/* Day-item list fills the remaining height and scrolls when the day has more items
	   than fit. Scrollbar styling comes from the shared `.custom-scrollbar` class. */
	.sched-list {
		margin: 0;
		padding: 0;
		list-style: none;
		flex: 1 1 auto;
		overflow-y: auto;
		/* Give HORIZONTAL drags over the list to our swipe handler (only vertical scrolls the
		   list) — otherwise the list swallows the gesture and swiping in the MIDDLE of the
		   panel did nothing (worked only on the side edges). */
		touch-action: pan-y;
	}
	.sched-empty {
		list-style: none;
		padding: 1.25rem 0;
		font-size: 0.88rem;
		color: #9aa3b2;
	}

	/* Week pager at the panel bottom: short lines, one per browsable week; the current week
	   is the filled navy line. Signals position so the user knows swiping does something and
	   how many weeks there are. */
	.sched-pager {
		flex: 0 0 auto;
		margin-top: 0.9rem;
		padding-top: 0.2rem;
	}
	.sched-pager-line {
		width: 1.6rem;
		height: 0.28rem;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: #d7dee8; /* inactive */
		cursor: pointer;
		transition: background-color 0.15s ease;
	}
	.sched-pager-line:hover {
		background: #b8c2d1;
	}
	.sched-pager-line.active {
		background: #102e66; /* current week */
	}
</style>

<script lang="ts">
	// One item in the selected day's schedule list (an event or a post). Repeats, so
	// it's its own component. Straight, wide coloured left border (per design).
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import NewsIcon from '$lib/components/icons/NewsIcon.svelte';
	import type { ScheduleItem } from '$lib/schedule';

	let { item }: { item: ScheduleItem } = $props();
</script>

<li class="sched-item display-f align-items-center gap-0-8 sched-item--{item.color}">
	<span class="sched-item-ico display-f align-items-center">
		{#if item.kind === 'post'}
			<NewsIcon size={22} />
		{:else}
			<CalendarIcon size={22} />
		{/if}
	</span>
	<span class="sched-item-body column-nowrap">
		<span class="sched-item-title fw-600">{item.title}</span>
		<span class="sched-item-time">{item.time}</span>
	</span>
</li>

<style>
	.sched-item {
		padding: 0.6rem 0.8rem;
		background: #f6f8fa;
		/* Straight (square) left edge with a wide coloured accent; right side rounded. */
		border-radius: 0 8px 8px 0;
		border-left: 6px solid #187ff5;
	}
	.sched-item--blue {
		border-left-color: #1657b8;
	}
	.sched-item--purple {
		border-left-color: #6b3fc0;
	}
	.sched-item--green {
		border-left-color: #1c8a4b;
	}
	.sched-item-ico {
		color: #5b6577;
		flex: 0 0 auto;
	}
	.sched-item-body {
		line-height: 1.3;
		min-width: 0;
	}
	.sched-item-title {
		font-size: 1.02rem;
		color: #102e66;
	}
	.sched-item-time {
		font-size: 0.88rem;
		color: #5b6577;
	}
</style>

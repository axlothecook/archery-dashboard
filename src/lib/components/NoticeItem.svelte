<script lang="ts">
	// One "Novo" (notifications) item in the bell dropdown: title + detail + relative
	// time, linking to the section it relates to. Clicking it closes the dropdown via
	// onNavigate. Reused for every notice, so it lives here as a single component.
	import type { Notice } from '$lib/notices';

	let { notice, onNavigate }: { notice: Notice; onNavigate: () => void } = $props();
</script>

<a class="notif-item display-b br-sm cursor-pointer" href={notice.href} onclick={onNavigate}>
	<p class="notif-item-title">{notice.title}</p>
	<p class="notif-item-detail">{notice.detail}</p>
	<span class="notif-item-when">{notice.when}</span>
</a>

<style>
	/* display-b, br-sm (10px), cursor-pointer via utilities. Darker on hover. */
	.notif-item {
		padding: 0.9rem 1rem;
		background: #f6f8fa;
		text-decoration: none;
		transition: background-color 0.15s ease;
	}
	.notif-item:hover {
		background: #e8edf2; /* slightly darker than #f6f8fa */
	}
	.notif-item-title {
		margin: 0 0 0.2rem;
		font-size: 0.92rem;
		font-weight: 700;
		color: #102e66;
	}
	.notif-item-detail {
		margin: 0 0 0.3rem;
		font-size: 0.82rem;
		line-height: 1.45;
		color: #5b6577;
	}
	.notif-item-when {
		font-size: 0.74rem;
		color: #9aa3b2;
	}
</style>

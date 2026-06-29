<script lang="ts">
	// Eye glyph (view/preview). Uses currentColor so it inherits the surrounding
	// colour. Used as the per-card "view" action on the dashboard project cards.
	let { size = 24 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
	<circle cx="12" cy="12" r="3" />
</svg>

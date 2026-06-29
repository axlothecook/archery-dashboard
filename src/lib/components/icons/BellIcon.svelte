<script lang="ts">
	// Notification bell glyph. Uses currentColor so it inherits the surrounding
	// colour (top-bar icon).
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
	<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
	<path d="M13.73 21a2 2 0 0 1-3.46 0" />
</svg>

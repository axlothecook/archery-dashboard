<script lang="ts">
	// Magnifying-glass glyph. Uses currentColor so it inherits the surrounding
	// colour (white inside the search-pill button, grey elsewhere).
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
	<circle cx="11" cy="11" r="7" />
	<line x1="21" y1="21" x2="16.65" y2="16.65" />
</svg>

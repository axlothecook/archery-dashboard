<script lang="ts">
	// Check / success glyph (user-provided, check-svgrepo). Stroke-based, so it
	// inherits colour via `currentColor` on the stroke. Pass `color` to override.
	let { size = 24, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path
		d="M4 12.6111L8.92308 17.5L20 6.5"
		stroke={color}
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>

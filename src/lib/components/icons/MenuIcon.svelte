<script lang="ts">
	// Hamburger (menu) glyph: three stacked bars. Stroke-based, inherits colour via
	// currentColor on the stroke. Opens the mobile full-screen nav.
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
		d="M3 6H21M3 12H21M3 18H21"
		stroke={color}
		stroke-width="2"
		stroke-linecap="round"
	/>
</svg>

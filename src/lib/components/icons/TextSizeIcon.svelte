<script lang="ts">
	// Text-size glyph (user-provided, text-size-svgrepo) — column-title icon for
	// "Ime zadatka". Stroke-based → inherits colour via currentColor.
	let { size = 24, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<path
		d="M8 4V20M17 12V20M6 20H10M15 20H19M13 7V4H3V7M21 14V12H13V14"
		stroke={color}
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>

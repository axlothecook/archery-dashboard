<script lang="ts">
	// Levels glyph (user-provided, levels-2-svgrepo). Column-title icon for "Razina"
	// — three descending bars. Fill-based → inherits colour via currentColor.
	let { size = 24, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<rect x="16" y="4" width="2" height="16" />
	<rect x="11" y="10" width="2" height="10" />
	<rect x="6" y="14" width="2" height="6" />
</svg>

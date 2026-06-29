<script lang="ts">
	// 2x2 grid glyph (dashboard / overview). Uses currentColor so it inherits the
	// surrounding colour. Used for the "Nadzorna ploča" rail item.
	let { size = 24 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="currentColor"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z" />
</svg>

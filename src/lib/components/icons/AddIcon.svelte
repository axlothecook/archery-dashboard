<script lang="ts">
	// Add / plus glyph (user-provided, add-plus-svgrepo). Stroke-based — uses
	// currentColor so it inherits the surrounding colour. "Dodaj zadatak" etc.
	let { size = 24 }: { size?: number } = $props();
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
		d="M6 12H12M12 12H18M12 12V18M12 12V6"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>

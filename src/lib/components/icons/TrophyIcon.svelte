<script lang="ts">
	// Trophy glyph (achievements). Uses currentColor so it inherits the
	// surrounding colour. Used for the "Postignuća" rail item.
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
	<path d="M6 4h12v4a6 6 0 0 1-12 0V4Z" />
	<path d="M6 6H3v1a4 4 0 0 0 3 3.87M18 6h3v1a4 4 0 0 1-3 3.87" />
	<line x1="12" y1="14" x2="12" y2="18" />
	<path d="M8 21h8M9 21a3 3 0 0 1 6 0" />
</svg>

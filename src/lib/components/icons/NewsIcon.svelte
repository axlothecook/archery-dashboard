<script lang="ts">
	// Newspaper glyph (news / articles). Uses currentColor so it inherits the
	// surrounding colour. Used for the "Vijesti" rail item.
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
	<path d="M4 4h13a1 1 0 0 1 1 1v14a1 1 0 0 0 1 1 1 1 0 0 0 1-1V8h-2" />
	<path d="M4 4a1 1 0 0 0-1 1v14a2 2 0 0 0 2 2h13" />
	<line x1="7" y1="8" x2="14" y2="8" />
	<line x1="7" y1="12" x2="14" y2="12" />
	<line x1="7" y1="16" x2="11" y2="16" />
</svg>

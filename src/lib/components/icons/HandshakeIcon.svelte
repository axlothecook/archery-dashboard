<script lang="ts">
	// Handshake glyph (sponsors / partners). Uses currentColor so it inherits the
	// surrounding colour. Used for the "Sponzori" rail item.
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
	<path d="m11 17 2 2a1 1 0 1 0 3-3" />
	<path d="m14 16 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 0-2.8 0l-1.6 1.6a1 1 0 1 1-3-3l2.7-2.7a3 3 0 0 1 4.3 0L19 8" />
	<path d="m21 9-4-4" />
	<path d="m3 11 4-4 4 4" />
	<path d="m5 13-2-2" />
</svg>

<script lang="ts">
	// Helper for adding an inline markdown link to the article body. The admin enters a
	// URL + the display text, clicks "Umetni poveznicu", and `[text](url)` is appended to
	// the end of the Tijelo (body) field — where the public site renders it as a link on
	// that text (see the najnovije/[slug] renderer). Both fields optional; insert is only
	// enabled once both are filled and the URL is http(s):// (matching the renderer's rule).
	import AddIcon from '$lib/components/icons/AddIcon.svelte';

	let { body = $bindable('') }: { body?: string } = $props();

	let url = $state('');
	let text = $state('');

	const isHttp = $derived(/^https?:\/\/\S+$/i.test(url.trim()));
	const canInsert = $derived(isHttp && text.trim().length > 0);

	function insert() {
		if (!canInsert) return;
		const link = `[${text.trim()}](${url.trim()})`;
		// Append on its own line at the end; add a blank line if the body already has text.
		body = body.trim() ? `${body.trimEnd()}\n\n${link}` : link;
		// Clear the helper fields so it's ready for the next one.
		url = '';
		text = '';
	}
</script>

<fieldset class="group li-group">
	<legend class="group-legend">Poveznica</legend>

	<label class="li-field">
		<span class="li-label">Tekst poveznice</span>
		<input class="li-input" type="text" placeholder="npr. originalnoj objavi kluba" bind:value={text} />
	</label>

	<label class="li-field li-field--mt">
		<span class="li-label">URL</span>
		<input class="li-input" type="url" placeholder="https://…" bind:value={url} />
	</label>

	<!-- The wrapper carries the tooltip so it shows even while the button is disabled
	     (a disabled button doesn't fire hover in some browsers). -->
	<span class="li-insert-wrap" title={canInsert ? 'Umetni poveznicu u tijelo članka' : 'Unesite tekst poveznice i ispravan URL (mora počinjati s http:// ili https://)'}>
		<button class="li-insert" type="button" disabled={!canInsert} onclick={insert}>
			<AddIcon size={16} /> Umetni poveznicu
		</button>
	</span>
	<p class="li-help">
		{#if canInsert}
			Dodaje se na kraj tijela članka kao poveznica na uneseni tekst.
		{:else}
			Unesite tekst poveznice i URL (mora počinjati s http:// ili https://).
		{/if}
	</p>
</fieldset>

<style>
	.li-group {
		margin: 0;
		padding: 1rem 1.1rem;
		border: 1px solid #eef1f3;
		border-radius: 10px;
	}
	.group-legend {
		padding: 0 0.4rem;
		font-size: 0.9rem;
		font-weight: 700;
		color: #102e66;
	}
	.li-field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.li-field--mt {
		margin-top: 0.6rem;
	}
	.li-label {
		font-size: 0.85rem;
		color: #5b6577;
	}
	.li-input {
		box-sizing: border-box;
		width: 100%;
		padding: 0.6rem 0.8rem;
		border: 1px solid #d7dee8;
		border-radius: 10px;
		font-size: 0.95rem;
		font-family: inherit;
		color: #102e66;
		background: #fff;
	}
	.li-input:focus {
		outline: none;
		border-color: #187ff5;
	}
	.li-insert-wrap {
		display: inline-block;
		margin-top: 0.8rem;
	}
	.li-insert {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.8rem;
		border: 1px solid #d7dee8;
		border-radius: 8px;
		background: #fff;
		color: #102e66;
		font-size: 0.85rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}
	.li-insert:hover:not(:disabled) {
		background: #eef1f3;
	}
	.li-insert:disabled {
		opacity: 0.55;
		cursor: default;
	}
	.li-help {
		margin: 0.5rem 0 0;
		font-size: 0.78rem;
		color: #9aa3b2;
	}
</style>

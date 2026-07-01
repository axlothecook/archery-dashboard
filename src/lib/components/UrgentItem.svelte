<script lang="ts">
	// One "Hitno" (urgent-attention) card: title + 2-line-clamped body + two actions
	// ("Riješi sada" links to the relevant section, "Ukloni" removes it from the
	// panel). Fixed height so the panel's scroll window never shifts with content
	// length. Reused for every urgent item, so it lives here as a single component.
	import type { Urgent } from '$lib/urgent';

	let { item, onRemove }: { item: Urgent; onRemove: (id: string) => void } = $props();
</script>

<div class="urgent-item">
	<h4 class="urgent-title">{item.title}</h4>
	<p class="urgent-body">{item.body}</p>
	<div class="urgent-actions">
		<a class="urgent-btn urgent-btn--fix" href={item.href}>Riješi sada</a>
		<button class="urgent-btn urgent-btn--remove" type="button" onclick={() => onRemove(item.id)}>
			Ukloni
		</button>
	</div>
</div>

<style>
	/* Each urgent item is its own card with a faint warm background.
	   FIXED height per item so the panel's scroll window never shifts with content
	   length (3 always fit identically). The body is clamped to 2 lines. */
	.urgent-item {
		box-sizing: border-box;
		height: 8.625rem; /* 138px — one consistent row height */
		flex: 0 0 auto;
		padding: 0.9rem 1rem;
		border-radius: 10px;
		background: #fff5ec; /* faint warm tint matching the urgent orange */
		display: flex;
		flex-direction: column;
	}
	.urgent-title {
		margin: 0 0 0.35rem;
		font-size: 0.98rem;
		font-weight: 700;
		color: #102e66;
	}
	.urgent-body {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.5;
		color: #5b6577;
		/* Clamp to 2 lines so every item keeps the same fixed height. */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	/* Action buttons, bottom-right, with a clear gap above the text. */
	.urgent-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: auto; /* pin actions to the bottom of the fixed-height card */
		padding-top: 0.6rem;
	}
	.urgent-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		padding: 0.45rem 0.85rem;
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		border: 1px solid transparent;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}
	/* "Riješi sada" — light surface (not blue), leads to the section page. */
	.urgent-btn--fix {
		background: #fff;
		color: #102e66;
		border-color: #d7dee8;
	}
	.urgent-btn--fix:hover {
		background: #eef1f3;
	}
	/* "Ukloni" — secondary, removes the item from the panel. */
	.urgent-btn--remove {
		background: transparent;
		color: #5b6577;
		border-color: #cbd5e1;
	}
	.urgent-btn--remove:hover {
		background: #eef1f3;
		color: #102e66;
	}
</style>

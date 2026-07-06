<script lang="ts">
	// Reusable image field: pick a file → upload to R2 (POST /admin/upload) → store the
	// returned hosted URL in `url` (bindable). Shows a thumbnail preview of the current
	// image (the existing one on an edit page, or the just-picked one). Replaces the old
	// raw-URL text inputs so admins upload files instead of pasting URLs.
	//
	// One image per instance: use it for the poster, the video poster, and each gallery
	// slot (the parent loops for the gallery).
	import { uploadImage, AuthError } from '$lib/auth';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';

	let {
		url = $bindable(''),
		label,
		entityType = 'article',
		compact = false
	}: {
		/** The hosted R2 URL — what the parent saves. Empty until an image is uploaded. */
		url?: string;
		/** Field label shown above the control. */
		label: string;
		/** Upload entity type → R2 key prefix + video gate (see backend upload router). */
		entityType?: string;
		/** Tighter layout for gallery rows. */
		compact?: boolean;
	} = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let uploading = $state(false);
	let error = $state('');

	async function onPick(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		error = '';
		uploading = true;
		try {
			url = await uploadImage(file, entityType);
		} catch (err) {
			error = err instanceof AuthError ? err.message : 'Prijenos slike nije uspio.';
		} finally {
			uploading = false;
			// Reset the input so picking the SAME file again re-triggers change.
			if (inputEl) inputEl.value = '';
		}
	}

	function clear() {
		url = '';
		error = '';
	}
</script>

<div class="img-upload column-nowrap gap-0-3" class:compact>
	<span class="field-label fw-600">{label}</span>

	<div class="img-upload-row display-f align-items-center gap-0-8">
		<!-- Preview (or empty placeholder). -->
		{#if url}
			<img class="img-preview" src={url} alt="Pregled" />
		{:else}
			<span class="img-preview img-preview--empty display-f align-items-center justify-content-center" aria-hidden="true">
				<AddIcon size={compact ? 18 : 22} />
			</span>
		{/if}

		<div class="img-upload-actions column-nowrap gap-0-3">
			<button
				class="img-upload-btn cursor-pointer display-f align-items-center gap-0-4"
				type="button"
				disabled={uploading}
				onclick={() => inputEl?.click()}
			>
				{#if uploading}
					<span class="spinner spinner-sm" aria-hidden="true"></span> Prijenos…
				{:else}
					<AddIcon size={16} /> {url ? 'Zamijeni sliku' : 'Učitaj sliku'}
				{/if}
			</button>
			{#if url}
				<button class="img-clear cursor-pointer" type="button" onclick={clear}>Ukloni</button>
			{/if}
		</div>

		<input
			bind:this={inputEl}
			class="visually-hidden"
			type="file"
			accept="image/jpeg,image/png,image/webp"
			onchange={onPick}
		/>
	</div>

	{#if error}
		<p class="img-upload-error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.field-label {
		font-size: 0.85rem;
		color: #5b6577;
	}
	.img-preview {
		width: 5.5rem;
		height: 3.5rem;
		object-fit: cover;
		border-radius: 8px;
		background: #eef1f3;
		border: 1px solid #d7dee8;
		flex: 0 0 auto;
	}
	.img-preview--empty {
		color: #9aa3b2;
	}
	.compact .img-preview {
		width: 4rem;
		height: 2.6rem;
	}
	.img-upload-btn {
		padding: 0.45rem 0.8rem;
		border: 1px solid #d7dee8;
		border-radius: 8px;
		background: #fff;
		color: #102e66;
		font-size: 0.85rem;
		font-weight: 600;
		font-family: inherit;
		white-space: nowrap;
	}
	.img-upload-btn:hover:not(:disabled) {
		background: #eef1f3;
	}
	.img-upload-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}
	.img-clear {
		border: 0;
		background: none;
		padding: 0;
		color: #a4133c;
		font-size: 0.78rem;
		font-family: inherit;
		text-align: left;
	}
	.img-clear:hover {
		text-decoration: underline;
	}
	.img-upload-error {
		margin: 0;
		color: #a4133c;
		font-size: 0.82rem;
	}
	/* Screen-reader-only file input (triggered by the button). */
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>

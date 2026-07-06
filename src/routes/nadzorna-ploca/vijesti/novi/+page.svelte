<script lang="ts">
	// Vijesti → Novi članak: the full create-article form. Covers every backend
	// createBody field: HR source text (naslov/sažetak/tijelo), media type, poster
	// image, up to 10 gallery images, video (url + poster), external link (url +
	// source), mentioned archers, hidden flag, and save-as-draft vs publish. Posts to
	// POST /admin/articles. Two-column layout (text left, media/meta right) so the
	// whole form fits without page scroll on a normal screen.
	import { goto } from '$app/navigation';
	import {
		createArticle,
		MEDIA_TYPE_LABEL,
		type ArticleMediaType,
		type ArticleImageInput,
		type CreateArticleInput
	} from '$lib/articles';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import ArcherPicker from '$lib/components/ArcherPicker.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import NewsIcon from '$lib/components/icons/NewsIcon.svelte';

	let { data } = $props();

	// ── Form state ───────────────────────────────────────────────────────────
	let title = $state('');
	let excerpt = $state('');
	let body = $state('');
	// Slug is NOT admin-editable: the backend generates it from the title on create.
	let mediaType = $state<ArticleMediaType>('event');
	let posterImageUrl = $state('');
	let posterImageAlt = $state('');
	let images = $state<ArticleImageInput[]>([]);
	let videoUrl = $state('');
	let videoPosterUrl = $state('');
	let externalUrl = $state('');
	let externalSourceName = $state('');
	let mentionedArcherIds = $state<string[]>([]);
	let hidden = $state(false);

	let saving = $state(false);
	let error = $state('');

	const mediaOptions = (Object.keys(MEDIA_TYPE_LABEL) as ArticleMediaType[]).map((v) => ({
		value: v,
		label: MEDIA_TYPE_LABEL[v]
	}));

	// Which optional media blocks are relevant to the chosen type (all still allowed
	// by the backend, but we only surface what fits the type to keep the form focused).
	const showVideo = $derived(mediaType === 'video-only');
	const showExternal = $derived(mediaType === 'external-link');
	const showGallery = $derived(mediaType === 'gallery' || mediaType === 'event');

	function addImage() {
		if (images.length >= 10) return;
		images = [...images, { url: '', alt: '', order: images.length }];
	}
	function removeImage(i: number) {
		images = images.filter((_, idx) => idx !== i).map((img, idx) => ({ ...img, order: idx }));
	}

	function buildInput(status: 'draft' | 'published'): CreateArticleInput {
		const trimmed = (s: string) => s.trim();
		return {
			mediaType,
			posterImageUrl: trimmed(posterImageUrl),
			posterImageAlt: trimmed(posterImageAlt),
			images: showGallery
				? images.filter((i) => i.url.trim()).map((i, idx) => ({ url: i.url.trim(), alt: i.alt.trim(), order: idx }))
				: [],
			videoUrl: showVideo && trimmed(videoUrl) ? trimmed(videoUrl) : null,
			videoPosterUrl: showVideo && trimmed(videoPosterUrl) ? trimmed(videoPosterUrl) : null,
			externalUrl: showExternal && trimmed(externalUrl) ? trimmed(externalUrl) : null,
			externalSourceName: showExternal && trimmed(externalSourceName) ? trimmed(externalSourceName) : null,
			status,
			hidden,
			mentionedArcherIds,
			title: trimmed(title),
			body: trimmed(body),
			excerpt: trimmed(excerpt)
		};
	}

	// Minimal client-side guard mirroring the backend's required fields.
	function validate(): string | null {
		if (!title.trim()) return 'Naslov je obavezan.';
		if (!excerpt.trim()) return 'Sažetak je obavezan.';
		if (!body.trim()) return 'Tijelo članka je obavezno.';
		if (!posterImageUrl.trim()) return 'Naslovna slika je obavezna.';
		if (!posterImageAlt.trim()) return 'Opis (alt) naslovne slike je obavezan.';
		// Every gallery image that has been uploaded must have an alt (alt is required).
		if (showGallery) {
			const missingAlt = images.some((i) => i.url.trim() && !i.alt.trim());
			if (missingAlt) return 'Svaka slika u galeriji mora imati opis (alt).';
		}
		return null;
	}

	async function submit(status: 'draft' | 'published') {
		if (saving) return;
		const v = validate();
		if (v) {
			error = v;
			return;
		}
		error = '';
		saving = true;
		try {
			await createArticle(buildInput(status));
			// Land on the tab matching what we just saved.
			await goto(status === 'published' ? '/nadzorna-ploca/vijesti/objavljeno' : '/nadzorna-ploca/vijesti/nacrti');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Spremanje nije uspjelo.';
			saving = false;
		}
	}
</script>

<svelte:head><title>Novi članak · VSK</title></svelte:head>

<section class="art-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<NewsIcon size={28} />
		<div>
			<h2 class="mgmt-title">Novi članak</h2>
			<p class="mgmt-sub">Napišite vijest, dodajte medije i spremite kao nacrt ili odmah objavite.</p>
		</div>
	</div>

	{#if error}
		<p class="form-error" role="alert">{error}</p>
	{/if}

	<form class="panel bg-white custom-scrollbar" onsubmit={(e) => e.preventDefault()}>
		<div class="form-grid">
			<!-- LEFT: the article text (fills the tall column). -->
			<div class="col column-nowrap gap-1">
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Naslov</span>
					<input class="field-input w-full br-xs" type="text" bind:value={title} required />
				</label>
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Sažetak</span>
					<textarea class="field-input field-textarea w-full br-xs" rows="3" bind:value={excerpt}></textarea>
				</label>
				<label class="field column-nowrap gap-0-3 body-field">
					<span class="field-label fw-600">Tijelo članka <span class="field-hint">(Markdown)</span></span>
					<textarea class="field-input field-textarea body-textarea w-full br-xs" bind:value={body}></textarea>
				</label>
			</div>

			<!-- RIGHT: media + meta (uses the otherwise-empty right side of the page). -->
			<div class="col column-nowrap gap-1">
				<div class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Vrsta medija</span>
					<DashSelect options={mediaOptions} bind:value={mediaType} ariaLabel="Vrsta medija" />
				</div>

				<fieldset class="group">
					<legend class="group-legend">Naslovna slika</legend>
					<ImageUpload label="Slika" bind:url={posterImageUrl} />
					<label class="field column-nowrap gap-0-3 mt-0-6">
						<span class="field-label fw-600">Opis slike (alt) <span class="req">*</span></span>
						<input class="field-input w-full br-xs" type="text" bind:value={posterImageAlt} required />
					</label>
				</fieldset>

				{#if showGallery}
					<fieldset class="group">
						<legend class="group-legend">Galerija <span class="field-hint">(do 10 slika)</span></legend>
						{#each images as img, i (i)}
							<div class="img-row">
								<ImageUpload label={`Slika ${i + 1}`} bind:url={img.url} compact />
								<div class="img-row-alt display-f gap-0-5 mt-0-6">
									<label class="field column-nowrap gap-0-3 w-full">
										<span class="field-label fw-600">Opis (alt) <span class="req">*</span></span>
										<input class="field-input w-full br-xs" type="text" bind:value={img.alt} />
									</label>
									<button class="img-del cursor-pointer display-f" type="button" aria-label="Ukloni sliku" title="Ukloni" onclick={() => removeImage(i)}>
										<TrashIcon size={18} />
									</button>
								</div>
							</div>
						{/each}
						{#if images.length < 10}
							<button class="btn-ghost-add cursor-pointer display-f align-items-center gap-0-4" type="button" onclick={addImage}>
								<AddIcon size={16} /> Dodaj sliku
							</button>
						{/if}
					</fieldset>
				{/if}

				{#if showVideo}
					<fieldset class="group">
						<legend class="group-legend">Video</legend>
						<label class="field column-nowrap gap-0-3">
							<span class="field-label fw-600">URL videa</span>
							<input class="field-input w-full br-xs" type="url" bind:value={videoUrl} />
						</label>
						<div class="mt-0-6">
							<ImageUpload label="Naslovna sličica videa" bind:url={videoPosterUrl} />
						</div>
					</fieldset>
				{/if}

				{#if showExternal}
					<fieldset class="group">
						<legend class="group-legend">Vanjski link</legend>
						<label class="field column-nowrap gap-0-3">
							<span class="field-label fw-600">URL</span>
							<input class="field-input w-full br-xs" type="url" bind:value={externalUrl} />
						</label>
						<label class="field column-nowrap gap-0-3 mt-0-6">
							<span class="field-label fw-600">Naziv izvora</span>
							<input class="field-input w-full br-xs" type="text" bind:value={externalSourceName} />
						</label>
					</fieldset>
				{/if}

				<!-- Mentioned archers — real picker (published archers). Degrades to a
				     "report a problem" warning if its options fail to load. -->
				<div class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Označeni streličari</span>
					<ArcherPicker
						options={data.archerOptions}
						loadError={data.archerLoadError}
						errorDetail={data.archerErrorDetail}
						bind:selected={mentionedArcherIds}
					/>
				</div>

				<label class="check-row display-f align-items-center gap-0-5">
					<input type="checkbox" bind:checked={hidden} />
					<span>Sakrij s javne stranice <span class="field-hint">(objavljeno, ali skriveno)</span></span>
				</label>
			</div>
		</div>

		<!-- Actions span the full width. -->
		<div class="form-actions display-f justify-content-flex-end gap-0-5">
			<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={() => submit('draft')}>
				Spremi kao nacrt
			</button>
			<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={() => submit('published')}>
				{saving ? 'Spremanje…' : 'Objavi'}
			</button>
		</div>
	</form>
</section>

<style>
	.art-section {
		max-width: 72rem; /* wider: two columns use the page's unused right side */
	}
	.mgmt-head {
		margin-bottom: 1.25rem;
	}
	.mgmt-title {
		margin: 0;
		font-size: 1.6rem;
		font-weight: 700;
		color: #102e66;
	}
	.mgmt-sub {
		margin: 0.35rem 0 0;
		font-size: 0.95rem;
		color: #5b6577;
	}
	.form-error {
		margin: 0 0 1rem;
		padding: 0.6rem 0.9rem;
		border-radius: 8px;
		background: #fde7ec;
		color: #a4133c;
		font-size: 0.92rem;
	}
	.panel {
		border-radius: 14px;
		padding: 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		/* Fill the shared content frame and scroll the form INSIDE the panel (the page
		   never scrolls; the panel bottoms on the shared 2rem line like every page). */
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}
	/* Two columns: text left, media/meta right. The left body textarea grows to keep
	   both columns roughly the same height so the whole form fits without page scroll. */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		align-items: start;
	}
	.col {
		min-width: 0;
	}
	.body-field {
		flex: 1 1 auto;
	}
	.body-textarea {
		min-height: 16rem;
		height: 100%;
	}
	.mt-0-6 {
		margin-top: 0.6rem;
	}
	.field-label {
		font-size: 0.85rem;
		color: #5b6577;
	}
	.field-hint {
		font-weight: 400;
		color: #9aa3b2;
	}
	/* Required-field marker: a red star after the label. */
	.req {
		color: #d32752;
		font-weight: 700;
	}
	.field-input {
		box-sizing: border-box;
		padding: 0.6rem 0.8rem;
		border: 1px solid #d7dee8;
		font-size: 0.95rem;
		font-family: inherit;
		color: #102e66;
		background: #fff;
	}
	.field-input:focus {
		outline: none;
		border-color: #187ff5;
	}
	.field-textarea {
		resize: vertical;
		line-height: 1.4;
	}
	.group {
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
	.img-row + .img-row {
		margin-top: 0.8rem;
	}
	.img-row-alt {
		align-items: flex-end;
	}
	.img-del {
		align-items: center;
		border: 0;
		background: none;
		padding: 0.55rem;
		color: #5b6577;
	}
	.img-del:hover {
		color: #d32752;
	}
	.btn-ghost-add {
		margin-top: 0.9rem;
		padding: 0.45rem 0.8rem;
		border: 1px solid #d7dee8;
		border-radius: 8px;
		background: #fff;
		color: #102e66;
		font-size: 0.85rem;
		font-weight: 600;
		font-family: inherit;
	}
	.btn-ghost-add:hover {
		background: #eef1f3;
	}
	.check-row {
		font-size: 0.95rem;
		color: #102e66;
	}
	.form-actions {
		margin-top: 0.5rem;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		font-size: 0.9rem;
		font-family: inherit;
		border: 1px solid transparent;
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.btn--primary {
		background: #102e66;
		color: #fff;
	}
	.btn--primary:hover:not(:disabled) {
		background: #0c2350;
	}
	.btn--ghost {
		background: #fff;
		color: #102e66;
		border-color: #d7dee8;
	}
	.btn--ghost:hover:not(:disabled) {
		background: #eef1f3;
	}
	/* Collapse to one column on narrow screens (scroll is acceptable there). */
	@media (max-width: 900px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		.body-textarea {
			min-height: 12rem;
		}
	}
</style>

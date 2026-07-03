<script lang="ts">
	// Vijesti → Novi članak: the full create-article form. Covers every backend
	// createBody field: HR source text (naslov/sažetak/tijelo), media type, poster
	// image, up to 10 gallery images, video (url + poster), external link (url +
	// source), hidden flag, and save-as-draft vs publish. Posts to POST /admin/articles.
	//
	// Mentioned archers (mentionedArcherIds) needs archer UUIDs; there's no admin
	// archer-list endpoint yet (it arrives with the Momčad section), so that one field
	// is present but disabled with a note — nothing is silently dropped.
	import { goto } from '$app/navigation';
	import {
		createArticle,
		MEDIA_TYPE_LABEL,
		type ArticleMediaType,
		type ArticleImageInput,
		type CreateArticleInput
	} from '$lib/articles';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import NewsIcon from '$lib/components/icons/NewsIcon.svelte';

	// ── Form state ───────────────────────────────────────────────────────────
	let title = $state('');
	let excerpt = $state('');
	let body = $state('');
	let slug = $state(''); // optional; backend auto-generates from title if blank
	let mediaType = $state<ArticleMediaType>('event');
	let posterImageUrl = $state('');
	let posterImageAlt = $state('');
	let images = $state<ArticleImageInput[]>([]);
	let videoUrl = $state('');
	let videoPosterUrl = $state('');
	let externalUrl = $state('');
	let externalSourceName = $state('');
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
			slug: trimmed(slug) || undefined,
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
			mentionedArcherIds: [],
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
		if (!posterImageUrl.trim()) return 'URL naslovne slike je obavezan.';
		if (!posterImageAlt.trim()) return 'Opis (alt) naslovne slike je obavezan.';
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

	<form class="panel bg-white column-nowrap gap-1-25" onsubmit={(e) => e.preventDefault()}>
		<!-- Text -->
		<label class="field column-nowrap gap-0-3">
			<span class="field-label fw-600">Naslov</span>
			<input class="field-input w-full br-xs" type="text" bind:value={title} required />
		</label>
		<label class="field column-nowrap gap-0-3">
			<span class="field-label fw-600">Sažetak</span>
			<textarea class="field-input field-textarea w-full br-xs" rows="2" bind:value={excerpt}></textarea>
		</label>
		<label class="field column-nowrap gap-0-3">
			<span class="field-label fw-600">Tijelo članka <span class="field-hint">(Markdown)</span></span>
			<textarea class="field-input field-textarea w-full br-xs" rows="8" bind:value={body}></textarea>
		</label>
		<label class="field column-nowrap gap-0-3">
			<span class="field-label fw-600">Slug <span class="field-hint">(nije obavezno — generira se iz naslova)</span></span>
			<input class="field-input w-full br-xs" type="text" bind:value={slug} placeholder="npr. pobjeda-na-varazdin-openu" />
		</label>

		<!-- Media type -->
		<div class="field column-nowrap gap-0-3">
			<span class="field-label fw-600">Vrsta medija</span>
			<DashSelect options={mediaOptions} bind:value={mediaType} ariaLabel="Vrsta medija" />
		</div>

		<!-- Poster (always) -->
		<fieldset class="group">
			<legend class="group-legend">Naslovna slika</legend>
			<div class="two-col">
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">URL slike</span>
					<input class="field-input w-full br-xs" type="url" bind:value={posterImageUrl} required />
				</label>
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Opis slike (alt)</span>
					<input class="field-input w-full br-xs" type="text" bind:value={posterImageAlt} required />
				</label>
			</div>
		</fieldset>

		<!-- Gallery (event/gallery) -->
		{#if showGallery}
			<fieldset class="group">
				<legend class="group-legend">Galerija <span class="field-hint">(do 10 slika)</span></legend>
				{#each images as img, i (i)}
					<div class="img-row two-col">
						<label class="field column-nowrap gap-0-3">
							<span class="field-label fw-600">URL slike {i + 1}</span>
							<input class="field-input w-full br-xs" type="url" bind:value={img.url} />
						</label>
						<div class="img-row-alt display-f gap-0-5">
							<label class="field column-nowrap gap-0-3 w-full">
								<span class="field-label fw-600">Opis (alt)</span>
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

		<!-- Video (video-only) -->
		{#if showVideo}
			<fieldset class="group">
				<legend class="group-legend">Video</legend>
				<div class="two-col">
					<label class="field column-nowrap gap-0-3">
						<span class="field-label fw-600">URL videa</span>
						<input class="field-input w-full br-xs" type="url" bind:value={videoUrl} />
					</label>
					<label class="field column-nowrap gap-0-3">
						<span class="field-label fw-600">URL naslovne sličice videa</span>
						<input class="field-input w-full br-xs" type="url" bind:value={videoPosterUrl} />
					</label>
				</div>
			</fieldset>
		{/if}

		<!-- External link (external-link) -->
		{#if showExternal}
			<fieldset class="group">
				<legend class="group-legend">Vanjski link</legend>
				<div class="two-col">
					<label class="field column-nowrap gap-0-3">
						<span class="field-label fw-600">URL</span>
						<input class="field-input w-full br-xs" type="url" bind:value={externalUrl} />
					</label>
					<label class="field column-nowrap gap-0-3">
						<span class="field-label fw-600">Naziv izvora</span>
						<input class="field-input w-full br-xs" type="text" bind:value={externalSourceName} />
					</label>
				</div>
			</fieldset>
		{/if}

		<!-- Mentioned archers — deferred until the Momčad admin list exists. -->
		<div class="field column-nowrap gap-0-3">
			<span class="field-label fw-600">Označeni streličari</span>
			<div class="field-disabled">Bit će dostupno uz izradu odjeljka Momčad.</div>
		</div>

		<!-- Hidden -->
		<label class="check-row display-f align-items-center gap-0-5">
			<input type="checkbox" bind:checked={hidden} />
			<span>Sakrij s javne stranice <span class="field-hint">(objavljeno, ali skriveno)</span></span>
		</label>

		<!-- Actions -->
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
		max-width: 52rem;
	}
	.mgmt-head {
		margin-bottom: 1.5rem;
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
	}
	.field-label {
		font-size: 0.85rem;
		color: #5b6577;
	}
	.field-hint {
		font-weight: 400;
		color: #9aa3b2;
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
	.field-disabled {
		padding: 0.6rem 0.8rem;
		border: 1px dashed #d7dee8;
		border-radius: 8px;
		color: #9aa3b2;
		font-size: 0.9rem;
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
	.two-col {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
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
	@media (max-width: 640px) {
		.two-col {
			grid-template-columns: 1fr;
		}
	}
</style>

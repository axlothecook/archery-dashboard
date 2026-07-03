<script lang="ts">
	// Vijesti → Uredi članak: same layout as the create form, prefilled with the
	// existing article (loaded via GET /admin/articles/:id), saved via PATCH. A
	// hide/unhide eye toggle in the header flips the article's `hidden` state; the
	// eye icon reflects the CURRENT state (eye = visible, eye-off = hidden) and stays
	// in sync with the "Stanje" it will show in the list.
	import { goto } from '$app/navigation';
	import {
		updateArticle,
		MEDIA_TYPE_LABEL,
		type ArticleMediaType,
		type ArticleImageInput,
		type CreateArticleInput
	} from '$lib/articles';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import ArcherPicker from '$lib/components/ArcherPicker.svelte';
	import AddIcon from '$lib/components/icons/AddIcon.svelte';
	import TrashIcon from '$lib/components/icons/TrashIcon.svelte';
	import NewsIcon from '$lib/components/icons/NewsIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import EyeOffIcon from '$lib/components/icons/EyeOffIcon.svelte';

	let { data } = $props();
	// One-time seed of the form from the loaded article. A different article means a
	// navigation, which remounts this component, so capturing the initial value is
	// intentional here.
	// svelte-ignore state_referenced_locally
	const a = data.article;

	// ── Form state (seeded from the loaded article) ────────────────────────────
	let title = $state(a.title);
	let excerpt = $state(a.excerpt);
	let body = $state(a.body);
	let slug = $state(a.slug);
	let mediaType = $state<ArticleMediaType>(a.mediaType);
	let posterImageUrl = $state(a.posterImageUrl);
	let posterImageAlt = $state(a.posterImageAlt);
	let images = $state<ArticleImageInput[]>(a.images.map((i) => ({ ...i })));
	let videoUrl = $state(a.videoUrl ?? '');
	let videoPosterUrl = $state(a.videoPosterUrl ?? '');
	let externalUrl = $state(a.externalUrl ?? '');
	let externalSourceName = $state(a.externalSourceName ?? '');
	let mentionedArcherIds = $state<string[]>([...a.mentionedArcherIds]);
	let hidden = $state(a.hidden);
	const currentStatus = a.status; // 'draft' | 'published' — kept unless publish is pressed

	let saving = $state(false);
	let error = $state('');

	const mediaOptions = (Object.keys(MEDIA_TYPE_LABEL) as ArticleMediaType[]).map((v) => ({
		value: v,
		label: MEDIA_TYPE_LABEL[v]
	}));
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

	function buildPatch(status: 'draft' | 'published'): Partial<CreateArticleInput> {
		const t = (s: string) => s.trim();
		return {
			slug: t(slug) || undefined,
			mediaType,
			posterImageUrl: t(posterImageUrl),
			posterImageAlt: t(posterImageAlt),
			images: showGallery
				? images.filter((i) => i.url.trim()).map((i, idx) => ({ url: i.url.trim(), alt: i.alt.trim(), order: idx }))
				: [],
			videoUrl: showVideo && t(videoUrl) ? t(videoUrl) : null,
			videoPosterUrl: showVideo && t(videoPosterUrl) ? t(videoPosterUrl) : null,
			externalUrl: showExternal && t(externalUrl) ? t(externalUrl) : null,
			externalSourceName: showExternal && t(externalSourceName) ? t(externalSourceName) : null,
			status,
			hidden,
			mentionedArcherIds,
			title: t(title),
			body: t(body),
			excerpt: t(excerpt)
		};
	}

	function validate(): string | null {
		if (!title.trim()) return 'Naslov je obavezan.';
		if (!excerpt.trim()) return 'Sažetak je obavezan.';
		if (!body.trim()) return 'Tijelo članka je obavezno.';
		if (!posterImageUrl.trim()) return 'URL naslovne slike je obavezan.';
		if (!posterImageAlt.trim()) return 'Opis (alt) naslovne slike je obavezan.';
		return null;
	}

	// Save keeping the current status (draft stays draft, published stays published).
	async function save() {
		await submit(currentStatus);
	}
	// Publish a draft (or re-affirm published).
	async function publish() {
		await submit('published');
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
			await updateArticle(a.id, buildPatch(status));
			await goto(status === 'published' ? '/nadzorna-ploca/vijesti/objavljeno' : '/nadzorna-ploca/vijesti/nacrti');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Spremanje nije uspjelo.';
			saving = false;
		}
	}
</script>

<svelte:head><title>Uredi članak · VSK</title></svelte:head>

<section class="art-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<NewsIcon size={28} />
			<div>
				<h2 class="mgmt-title">Uredi članak</h2>
				<p class="mgmt-sub">Uredite postojeći članak i spremite promjene.</p>
			</div>
		</div>
		<!-- Hide/unhide toggle: icon reflects the CURRENT state; click flips `hidden`. -->
		<button
			class="vis-toggle cursor-pointer display-f align-items-center gap-0-5"
			class:is-hidden={hidden}
			type="button"
			aria-pressed={hidden}
			title={hidden ? 'Trenutačno skriveno — klik za prikaz' : 'Trenutačno vidljivo — klik za skrivanje'}
			onclick={() => (hidden = !hidden)}
		>
			{#if hidden}
				<EyeOffIcon size={20} /> Skriveno
			{:else}
				<EyeIcon size={20} /> Vidljivo
			{/if}
		</button>
	</div>

	{#if error}
		<p class="form-error" role="alert">{error}</p>
	{/if}

	<form class="panel bg-white" onsubmit={(e) => e.preventDefault()}>
		<div class="form-grid">
			<!-- LEFT: the article text. -->
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
				<label class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Slug</span>
					<input class="field-input w-full br-xs" type="text" bind:value={slug} />
				</label>
			</div>

			<!-- MIDDLE: media type + poster + video/external. -->
			<div class="col column-nowrap gap-1">
				<div class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Vrsta medija</span>
					<DashSelect options={mediaOptions} bind:value={mediaType} ariaLabel="Vrsta medija" />
				</div>

				<fieldset class="group">
					<legend class="group-legend">Naslovna slika</legend>
					<label class="field column-nowrap gap-0-3">
						<span class="field-label fw-600">URL slike</span>
						<input class="field-input w-full br-xs" type="url" bind:value={posterImageUrl} required />
					</label>
					<label class="field column-nowrap gap-0-3 mt-0-6">
						<span class="field-label fw-600">Opis slike (alt)</span>
						<input class="field-input w-full br-xs" type="text" bind:value={posterImageAlt} required />
					</label>
				</fieldset>

				{#if showVideo}
					<fieldset class="group">
						<legend class="group-legend">Video</legend>
						<label class="field column-nowrap gap-0-3">
							<span class="field-label fw-600">URL videa</span>
							<input class="field-input w-full br-xs" type="url" bind:value={videoUrl} />
						</label>
						<label class="field column-nowrap gap-0-3 mt-0-6">
							<span class="field-label fw-600">URL naslovne sličice videa</span>
							<input class="field-input w-full br-xs" type="url" bind:value={videoPosterUrl} />
						</label>
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
			</div>

			<!-- RIGHT: gallery + mentioned archers. -->
			<div class="col column-nowrap gap-1">
				{#if showGallery}
					<fieldset class="group">
						<legend class="group-legend">Galerija <span class="field-hint">(do 10 slika)</span></legend>
						{#each images as img, i (i)}
							<div class="img-row">
								<label class="field column-nowrap gap-0-3">
									<span class="field-label fw-600">URL slike {i + 1}</span>
									<input class="field-input w-full br-xs" type="url" bind:value={img.url} />
								</label>
								<div class="img-row-alt display-f gap-0-5 mt-0-6">
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

				<div class="field column-nowrap gap-0-3">
					<span class="field-label fw-600">Označeni streličari</span>
					<ArcherPicker
						options={data.archerOptions}
						loadError={data.archerLoadError}
						errorDetail={data.archerErrorDetail}
						bind:selected={mentionedArcherIds}
					/>
				</div>
			</div>
		</div>

		<div class="form-actions display-f justify-content-flex-end gap-0-5">
			<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={save}>
				{currentStatus === 'draft' ? 'Spremi nacrt' : 'Spremi promjene'}
			</button>
			{#if currentStatus === 'draft'}
				<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={publish}>
					{saving ? 'Spremanje…' : 'Objavi'}
				</button>
			{/if}
		</div>
	</form>
</section>

<style>
	.art-section {
		/* Full content width — the 3-column form uses it so the panel stays short. */
		width: 100%;
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
	/* Hide/unhide toggle: green when visible, grey when hidden — matches the state. */
	.vis-toggle {
		padding: 0.5rem 0.9rem;
		border: 1px solid #cfe8d8;
		border-radius: 8px;
		background: #eafaf0;
		color: #10683a;
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
	}
	.vis-toggle.is-hidden {
		border-color: #d7dee8;
		background: #f1f3f7;
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
	/* THREE columns so the fields spread horizontally (using the unused right-side
	   space) and the white div stays short — no internal scroll. */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 1.25rem 1.5rem;
		align-items: start;
	}
	.col {
		min-width: 0;
	}
	.body-textarea {
		min-height: 11rem;
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
	.form-actions {
		margin-top: 1.25rem;
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
	/* Collapse 3 → 2 → 1 columns as the screen narrows. */
	@media (max-width: 1200px) {
		.form-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 760px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

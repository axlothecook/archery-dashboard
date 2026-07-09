<script lang="ts">
	// Vijesti → Uredi članak: same layout as the create form, prefilled with the
	// existing article (loaded via GET /admin/articles/:id), saved via PATCH. A
	// hide/unhide eye toggle in the header flips the article's `hidden` state; the
	// eye icon reflects the CURRENT state (eye = visible, eye-off = hidden) and stays
	// in sync with the "Stanje" it will show in the list.
	import { tick } from 'svelte';
	import { goto, beforeNavigate } from '$app/navigation';
	import {
		updateArticle,
		MEDIA_TYPE_LABEL,
		type ArticleMediaType,
		type ArticleImageInput,
		type CreateArticleInput
	} from '$lib/articles';
	import DashSelect from '$lib/components/DashSelect.svelte';
	import ArcherPicker from '$lib/components/ArcherPicker.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ErrorPopup from '$lib/components/ErrorPopup.svelte';
	import LinkInserter from '$lib/components/LinkInserter.svelte';
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
	// Slug is NOT admin-editable: the backend generates it from the title on create and
	// never changes it on edit (PATCH ignores slug), so there's no slug field here.
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
	let errors = $state<string[]>([]);

	// Sažetak length cap: it becomes the SEO meta-description, so keep it to ~170 chars
	// (existing articles sit at 153–167). Countdown next to the label; over the limit it
	// turns red and blocks save/publish until trimmed.
	const EXCERPT_MAX = 170;
	const excerptRemaining = $derived(EXCERPT_MAX - excerpt.length);
	const excerptOver = $derived(excerpt.length > EXCERPT_MAX);

	// ── Unsaved-changes guard ────────────────────────────────────────────────────
	// A snapshot of the loaded article as a JSON string; `dirty` is true whenever the
	// current form differs from it. Used to warn before leaving (Odustani button, a
	// sidebar navigation, or closing the tab) so edits aren't lost silently. `saved` is
	// set right before a successful save/publish navigation so the guard doesn't fire on
	// our own redirect.
	const initialSnapshot = JSON.stringify({
		title: a.title, excerpt: a.excerpt, body: a.body, mediaType: a.mediaType,
		posterImageUrl: a.posterImageUrl, posterImageAlt: a.posterImageAlt,
		images: a.images, videoUrl: a.videoUrl ?? '', videoPosterUrl: a.videoPosterUrl ?? '',
		externalUrl: a.externalUrl ?? '', externalSourceName: a.externalSourceName ?? '',
		mentionedArcherIds: a.mentionedArcherIds, hidden: a.hidden
	});
	let saved = $state(false);
	const dirty = $derived(
		!saved &&
			JSON.stringify({
				title, excerpt, body, mediaType, posterImageUrl, posterImageAlt, images,
				videoUrl, videoPosterUrl, externalUrl, externalSourceName, mentionedArcherIds, hidden
			}) !== initialSnapshot
	);
	let leaveDlg = $state<ConfirmDialog>();
	// Guards SvelteKit in-app navigation (sidebar links, Odustani goto). If the form is
	// dirty, cancel the nav, ask, and only proceed (via a re-triggered goto) if confirmed.
	let confirmedLeaveTo = $state<string | null>(null);
	beforeNavigate((nav) => {
		if (!dirty) return;
		// Leaving the app / closing the tab (willUnload) is handled by the native
		// beforeunload prompt below — don't ALSO show our modal, or cancelling the
		// native prompt would pop this one right after (double prompt).
		if (nav.willUnload) return;
		const to = nav.to?.url.pathname ?? null;
		if (to && to === confirmedLeaveTo) {
			confirmedLeaveTo = null; // this nav was already confirmed
			return;
		}
		nav.cancel();
		void (async () => {
			if (await leaveDlg?.ask('Napustiti bez spremanja promjena?', 'Napusti')) {
				confirmedLeaveTo = to;
				if (to) await goto(to);
			}
		})();
	});
	// Native tab/window-close guard: browsers only allow their own generic prompt here.
	function onBeforeUnload(e: BeforeUnloadEvent) {
		if (dirty) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	const mediaOptions = (Object.keys(MEDIA_TYPE_LABEL) as ArticleMediaType[]).map((v) => ({
		value: v,
		label: MEDIA_TYPE_LABEL[v]
	}));
	const showVideo = $derived(mediaType === 'video-only');
	const showExternal = $derived(mediaType === 'external-link');
	const showGallery = $derived(mediaType === 'gallery' || mediaType === 'event');

	// Ref to the gallery scroll container so a newly-added image row is scrolled into
	// view (focus lands on the new row rather than staying wherever the user was).
	let galleryScrollEl = $state<HTMLDivElement | null>(null);
	async function addImage() {
		if (images.length >= 10) return;
		images = [...images, { url: '', alt: '', order: images.length }];
		await tick(); // let the new row render before scrolling to it
		galleryScrollEl?.scrollTo({ top: galleryScrollEl.scrollHeight, behavior: 'smooth' });
	}
	function removeImage(i: number) {
		images = images.filter((_, idx) => idx !== i).map((img, idx) => ({ ...img, order: idx }));
	}

	function buildPatch(status: 'draft' | 'published'): Partial<CreateArticleInput> {
		const t = (s: string) => s.trim();
		return {
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

	// Collect EVERY validation error so they all show at once (as dismissible popups),
	// rather than surfacing one at a time.
	function validate(): string[] {
		const errs: string[] = [];
		if (!title.trim()) errs.push('Naslov je obavezan.');
		if (!excerpt.trim()) errs.push('Sažetak je obavezan.');
		else if (excerpt.length > EXCERPT_MAX) errs.push(`Sažetak smije imati najviše ${EXCERPT_MAX} znakova.`);
		if (!body.trim()) errs.push('Tijelo članka je obavezno.');
		if (!posterImageUrl.trim()) errs.push('Naslovna slika je obavezna.');
		if (!posterImageAlt.trim()) errs.push('Opis (alt) naslovne slike je obavezan.');
		// Every gallery image that has been uploaded must have an alt (alt is required).
		if (showGallery && images.some((i) => i.url.trim() && !i.alt.trim())) {
			errs.push('Svaka slika u galeriji mora imati opis (alt).');
		}
		return errs;
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
		const errs = validate();
		if (errs.length > 0) {
			errors = errs;
			return;
		}
		errors = [];
		saving = true;
		try {
			await updateArticle(a.id, buildPatch(status));
			saved = true; // our own redirect — don't trigger the unsaved-changes guard
			await goto(status === 'published' ? '/nadzorna-ploca/vijesti/objavljeno' : '/nadzorna-ploca/vijesti/nacrti');
		} catch (e) {
			errors = [e instanceof Error ? e.message : 'Spremanje nije uspjelo.'];
			saving = false;
		}
	}

	// Odustani (Cancel): go back to the list. If there are unsaved edits, the
	// beforeNavigate guard shows the abandon-changes dialog first.
	async function cancel() {
		await goto(currentStatus === 'draft' ? '/nadzorna-ploca/vijesti/nacrti' : '/nadzorna-ploca/vijesti/objavljeno');
	}
</script>

<svelte:window onbeforeunload={onBeforeUnload} />

<svelte:head><title>Uredi članak · VSK</title></svelte:head>

<section class="art-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<NewsIcon size={48} />
		<div>
			<h2 class="mgmt-title">Uredi članak</h2>
			<p class="mgmt-sub">Uredite postojeći članak i spremite promjene.</p>
		</div>
	</div>

	<form class="panel bg-white custom-scrollbar" onsubmit={(e) => e.preventDefault()}>
		<!-- Hide/unhide toggle: INSIDE the white panel (top-right on desktop, full-width on
		     phone). Icon reflects the CURRENT state; click flips `hidden`. -->
		<div class="vis-row display-f justify-content-flex-end">
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
		<div class="form-grid">
			<!-- LEFT: the article text. -->
			<div class="col column-nowrap gap-1">
				<label class="field column-nowrap gap-title">
					<span class="field-title">Naslov <span class="req">*</span></span>
					<input class="field-input w-full br-xs" type="text" bind:value={title} required />
				</label>
				<label class="field column-nowrap gap-title">
					<span class="field-title sazetak-head display-f align-items-baseline gap-0-5">
						<span>Sažetak <span class="req">*</span></span>
						<span class="char-count" class:over={excerptOver}>{excerptRemaining}</span>
					</span>
					<textarea class="field-input field-textarea sazetak-textarea w-full br-xs" bind:value={excerpt}></textarea>
				</label>
				<label class="field column-nowrap gap-title body-field">
					<span class="field-title">Tijelo članka <span class="req">*</span></span>
					<textarea class="field-input field-textarea body-textarea custom-scrollbar w-full br-xs" bind:value={body}></textarea>
				</label>
			</div>

			<!-- MIDDLE: media type + poster + video/external. -->
			<div class="col column-nowrap gap-1">
				<div class="field column-nowrap gap-title">
					<span class="field-title">Vrsta medija <span class="req">*</span></span>
					<DashSelect options={mediaOptions} bind:value={mediaType} ariaLabel="Vrsta medija" />
				</div>

				<fieldset class="group">
					<legend class="group-legend">Naslovna slika <span class="req">*</span></legend>
					<ImageUpload label="Slika" bind:url={posterImageUrl} />
					<label class="field column-nowrap gap-0-3 mt-0-6">
						<span class="field-label fw-600">Opis slike (alt) <span class="req">*</span></span>
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

				<!-- Označeni streličari: below Naslovna slika (more width here than the
				     right column) so the multi-select never overflows the panel. -->
				<div class="field column-nowrap gap-title">
					<span class="field-title">Označeni streličari</span>
					<ArcherPicker
						options={data.archerOptions}
						loadError={data.archerLoadError}
						errorDetail={data.archerErrorDetail}
						bind:selected={mentionedArcherIds}
					/>
				</div>
			</div>

			<!-- RIGHT: gallery. -->
			<div class="col column-nowrap gap-1">
				{#if showGallery}
					<fieldset class="group gallery-group">
						<legend class="group-legend">Galerija <span class="field-hint">(do 10 slika)</span></legend>
						<div class="gallery-scroll custom-scrollbar" bind:this={galleryScrollEl}>
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
						</div>
						{#if images.length < 10}
							<button class="btn-ghost-add cursor-pointer display-f align-items-center gap-0-4" type="button" onclick={addImage}>
								<AddIcon size={16} /> Dodaj sliku
							</button>
						{/if}
					</fieldset>
				{/if}

				<!-- Optional: add an inline markdown link to the body (e.g. the club's
				     original post) — appends [text](url) to the Tijelo field. Below the
				     gallery so the middle column's archer picker has more room. -->
				<LinkInserter bind:body />
			</div>
		</div>

		<div class="form-actions display-f justify-content-flex-end gap-0-5">
			<button class="btn btn--cancel cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={cancel}>
				Odustani
			</button>
			<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" disabled={saving || excerptOver} onclick={save}>
				{currentStatus === 'draft' ? 'Spremi nacrt' : 'Spremi promjene'}
			</button>
			{#if currentStatus === 'draft'}
				<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={saving || excerptOver} onclick={publish}>
					{saving ? 'Spremanje…' : 'Objavi'}
				</button>
			{/if}
		</div>
	</form>
</section>

<!-- Validation warnings: top-centre dismissible stack (not inline, so they don't push
     the content down). -->
<ErrorPopup bind:messages={errors} />

<!-- Abandon-changes popup (animated) — shown by the beforeNavigate guard + Odustani. -->
<ConfirmDialog bind:this={leaveDlg} confirmLabel="Napusti" cancelLabel="Ostani" />

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
	/* Toggle row inside the white panel; sits above the form grid. */
	.vis-row {
		margin-bottom: 1rem;
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
	.panel {
		border-radius: 14px;
		padding: 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		/* Fill the shared content frame and scroll the form INSIDE the panel (the page
		   never scrolls; the panel bottoms on the shared 2rem line like every page).
		   Flex column so the grid can fill the panel height (→ Tijelo reaches the bottom). */
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}
	/* THREE columns so the fields spread horizontally (using the unused right-side space).
	   The grid fills the panel height and stretches its columns, so the left column's
	   Tijelo textarea grows down to the panel's bottom padding. */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 1.25rem 1.5rem;
		align-items: stretch;
		flex: 1 1 auto;
		min-height: 0;
	}
	.col {
		min-width: 0;
	}
	.mt-0-6 {
		margin-top: 0.6rem;
	}
	.field-label {
		font-size: 0.85rem;
		color: #5b6577;
	}
	/* Section-field titles (Naslov, Sažetak, Tijelo, Vrsta medija, Označeni streličari):
	   match the Galerija legend (.group-legend) — bigger, bold, deep-sapphire. */
	.field-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: #102e66;
	}
	/* Gap between a field title and its input — matches the Vrsta medija spacing (0.3rem)
	   so every titled field lines up the same. */
	.gap-title {
		gap: 0.3rem;
	}
	/* Sažetak countdown: chars remaining; red + bold once over the limit. */
	.char-count {
		font-size: 0.8rem;
		font-weight: 600;
		color: #9aa3b2;
	}
	.char-count.over {
		color: #d32752;
	}
	/* Sažetak textarea: tall enough that the full 170-char cap NEVER triggers a scrollbar,
	   however the words wrap (170 chars can wrap to ~5 lines at this width). Sized in `lh`
	   units (5 text lines + the field's vertical padding) so it holds regardless of the
	   root font-size scaling; a genuine overflow past that still scrolls. */
	.sazetak-textarea {
		height: calc(5lh + 1.2rem);
		min-height: calc(5lh + 1.2rem);
		resize: none;
		/* Fixed 5-line box; scroll if the summary runs longer instead of spilling. */
		overflow-y: auto;
	}
	/* Tijelo grows to fill the rest of the left column height (now that Sažetak is short).
	   The column stretches to the grid row height; body-field flex-grows into it, so the
	   textarea reaches the panel's bottom. A min-height keeps it tall even if the column
	   isn't stretched; its own scrollbar handles overflow. */
	.body-field {
		flex: 1 1 auto;
		min-height: 0;
	}
	.body-textarea {
		min-height: 12rem; /* floor for very short viewports */
		height: 100%;
		/* The box already fills the panel height (height:100%) and scrolls long bodies inside,
		   so it must NOT be drag-resizable — a manual drag would pull it past the panel into the
		   grey / under the sticky action bar. `!important` because the base `.field-textarea`
		   rule (later in this file, equal specificity) sets `resize: vertical` and would
		   otherwise win, re-enabling the unbounded drag. */
		overflow-y: auto;
		resize: none !important;
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
		/* Override the library textarea's default top margin so the title→textarea gap
		   matches the title→input gap (Naslov / Vrsta medija). */
		margin-top: 0;
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
	/* Galerija: the URL+opis rows scroll inside .gallery-scroll while "Dodaj sliku"
	   stays pinned at the bottom of the fieldset (outside the scroll area). */
	.gallery-group {
		display: flex;
		flex-direction: column;
	}
	.gallery-scroll {
		/* Height = 2 image rows with a little headroom so 2 images show WITHOUT a
		   scrollbar; a 3rd image overflows → the gallery scrolls. Keeps the gallery +
		   Poveznica fieldset below it clear of the action buttons. */
		max-height: 17.5rem;
		overflow-y: auto;
		/* Gap between the rows and the scrollbar (matches the other scroll panels). */
		padding-right: 0.75rem;
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
		/* Sticky action bar flush to the panel's bottom edge (off-white bg), always in view
		   while the (tall) form scrolls under it on any screen size. */
		position: sticky;
		bottom: -1.5rem;
		margin: 1.25rem -1.5rem -1.5rem;
		padding: 1rem 1.5rem;
		background: #eef1f3;
		border-top: 1px solid #dfe4ea;
	}
	.btn {
		padding: 0.6rem 1.3rem;
		font-size: 0.9rem;
		font-family: inherit;
		border: 1px solid transparent;
		text-align: center;
		white-space: nowrap; /* never wrap → equal single-line height */
	}
	/* All action buttons the SAME width on desktop (fixed basis, wide enough for the longest
	   label "Spremi promjene" on one line) — uniform width AND height. Mobile → equal flex. */
	.form-actions .btn {
		flex: 0 0 10rem;
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
	/* Odustani (cancel/discard): red outline so it reads as "leave without saving".
	   Sits in the same right-aligned action row as Spremi/Objavi (same gap). */
	.btn--cancel {
		background: #fff;
		color: #d32752;
		border-color: #d32752;
	}
	.btn--cancel:hover:not(:disabled) {
		background: #fdeef2;
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
		/* Vidljivo/Skriveno toggle (now inside the white panel) spans FULL width on phone. */
		.vis-toggle {
			width: 100%;
			justify-content: center;
			padding: 0.7rem 1rem;
			font-size: 0.95rem;
		}
		/* On mobile the PAGE scrolls (no bounded panel), so pin the Odustani/Spremi bar to the
		   bottom of the SCREEN — always reachable without scrolling to the end of the long
		   form. Full-width; the panel gets bottom padding so the last fields clear the bar. */
		.form-actions {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			margin: 0;
			z-index: 40;
			padding: 0.9rem 1rem calc(0.9rem + env(safe-area-inset-bottom));
			box-shadow: 0 -4px 16px rgba(16, 46, 102, 0.12);
			gap: 0.4rem;
			align-items: stretch;
		}
		/* Buttons share the row evenly, one line, and FIXED height so they're all identical
		   height regardless of border/label. */
		.form-actions .btn {
			flex: 1 1 0;
			min-width: 0;
			height: 2.75rem;
			padding: 0 0.4rem;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 0.8rem;
			white-space: nowrap;
			line-height: 1;
		}
		/* White panel edge-to-edge (cancel the content area's 1rem side padding) + tighter
		   inner form padding so fields get more room. */
		.panel {
			padding-bottom: 5rem; /* clear the fixed action bar */
			margin-left: -1rem;
			margin-right: -1rem;
			border-radius: 0;
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
</style>

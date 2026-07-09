<script lang="ts">
	// Vijesti → Novi članak: the full create-article form. Covers every backend
	// createBody field: HR source text (naslov/sažetak/tijelo), media type, poster
	// image, up to 10 gallery images, video (url + poster), external link (url +
	// source), mentioned archers, hidden flag, and save-as-draft vs publish. Posts to
	// POST /admin/articles. Two-column layout (text left, media/meta right) so the
	// whole form fits without page scroll on a normal screen.
	import { tick } from 'svelte';
	import { goto, beforeNavigate } from '$app/navigation';
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
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ErrorPopup from '$lib/components/ErrorPopup.svelte';
	import LinkInserter from '$lib/components/LinkInserter.svelte';
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
	let errors = $state<string[]>([]);

	// Sažetak length cap: it becomes the SEO meta-description, so keep it to ~170 chars
	// (existing articles sit at 153–167). Countdown next to the label; over the limit it
	// turns red and blocks save/publish until trimmed.
	const EXCERPT_MAX = 170;
	const excerptRemaining = $derived(EXCERPT_MAX - excerpt.length);
	const excerptOver = $derived(excerpt.length > EXCERPT_MAX);

	// ── Unsaved-changes guard ────────────────────────────────────────────────────
	// On the CREATE form, "dirty" just means the user has entered anything (all fields
	// start empty). Warns before leaving (Odustani, a sidebar nav, or closing the tab).
	// `saved` is set before our own post-create redirect so the guard doesn't fire on it.
	let saved = $state(false);
	const dirty = $derived(
		!saved &&
			(title !== '' || excerpt !== '' || body !== '' || posterImageUrl !== '' ||
				posterImageAlt !== '' || images.length > 0 || videoUrl !== '' ||
				videoPosterUrl !== '' || externalUrl !== '' || externalSourceName !== '' ||
				mentionedArcherIds.length > 0 || hidden)
	);
	let leaveDlg = $state<ConfirmDialog>();
	let confirmedLeaveTo = $state<string | null>(null);
	beforeNavigate((nav) => {
		if (!dirty) return;
		// Tab close / leaving the app is handled by the native beforeunload prompt below;
		// don't also show our modal (would double-prompt after cancelling the native one).
		if (nav.willUnload) return;
		const to = nav.to?.url.pathname ?? null;
		if (to && to === confirmedLeaveTo) {
			confirmedLeaveTo = null;
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

	// Which optional media blocks are relevant to the chosen type (all still allowed
	// by the backend, but we only surface what fits the type to keep the form focused).
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

	// Collect EVERY validation error so they all show at once (dismissible popups).
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
			await createArticle(buildInput(status));
			saved = true; // our own redirect — don't trigger the unsaved-changes guard
			// Land on the tab matching what we just saved.
			await goto(status === 'published' ? '/nadzorna-ploca/vijesti/objavljeno' : '/nadzorna-ploca/vijesti/nacrti');
		} catch (e) {
			errors = [e instanceof Error ? e.message : 'Spremanje nije uspjelo.'];
			saving = false;
		}
	}

	// Odustani (Cancel): go back to the published list. If there are unsaved edits, the
	// beforeNavigate guard shows the abandon-changes dialog first.
	async function cancel() {
		await goto('/nadzorna-ploca/vijesti/objavljeno');
	}
</script>

<svelte:window onbeforeunload={onBeforeUnload} />

<svelte:head><title>Novi članak · VSK</title></svelte:head>

<section class="art-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<NewsIcon size={48} />
		<div>
			<h2 class="mgmt-title">Novi članak</h2>
			<p class="mgmt-sub">Napišite vijest, dodajte medije i spremite kao nacrt ili odmah objavite.</p>
		</div>
	</div>

	<form class="panel bg-white custom-scrollbar" onsubmit={(e) => e.preventDefault()}>
		<div class="form-grid">
			<!-- LEFT: the article text (fills the tall column). -->
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

			<!-- MIDDLE: media type + poster + video/external + archers + hidden flag. -->
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

				<!-- Mentioned archers — real picker (published archers). Degrades to a
				     "report a problem" warning if its options fail to load. -->
				<div class="field column-nowrap gap-title">
					<span class="field-title">Označeni streličari</span>
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

			<!-- RIGHT: gallery (its own column so a long gallery reflows into the unused
			     right space instead of making the middle column overflow / scroll). -->
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

		<!-- Actions span the full width. -->
		<div class="form-actions display-f justify-content-flex-end gap-0-5">
			<button class="btn btn--cancel cursor-pointer br-xs fw-600" type="button" disabled={saving} onclick={cancel}>
				Odustani
			</button>
			<button class="btn btn--ghost cursor-pointer br-xs fw-600" type="button" disabled={saving || excerptOver} onclick={() => submit('draft')}>
				Spremi kao nacrt
			</button>
			<button class="btn btn--primary cursor-pointer br-xs fw-600" type="button" disabled={saving || excerptOver} onclick={() => submit('published')}>
				{saving ? 'Spremanje…' : 'Objavi'}
			</button>
		</div>
	</form>
</section>

<!-- Validation warnings: top-centre dismissible stack (not inline). -->
<ErrorPopup bind:messages={errors} />

<!-- Abandon-changes popup (animated) — shown by the beforeNavigate guard + Odustani. -->
<ConfirmDialog bind:this={leaveDlg} confirmLabel="Napusti" cancelLabel="Ostani" />

<style>
	.art-section {
		/* Full width: the 3-column form spreads across the whole content area so a long
		   gallery / video + external fields reflow into the otherwise-unused right side
		   instead of piling up and overflowing (the panel scrolls inside if still tall). */
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
	.panel {
		border-radius: 14px;
		padding: 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		/* FILL the content frame (not hug content) so the panel reaches the bottom and the
		   sticky action bar pins to the panel's bottom edge — otherwise the panel ended short
		   and left a big grey gap with the actions floating mid-page. Flex column: the grid
		   grows, the action bar is the last child pinned at the bottom. */
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	/* Three columns (text / media+meta / gallery) so the fields spread horizontally into
	   the unused right space. The grid fills the panel height and stretches its columns,
	   so the left column's Tijelo textarea grows down to the panel's bottom padding. */
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
	/* Tijelo grows to fill the rest of the left column (now that Sažetak is short) down to
	   the panel's bottom padding; its own scrollbar handles overflow. */
	.body-field {
		flex: 0 0 auto;
	}
	/* Fixed, moderate height so the panel doesn't stretch tall (which left big empty white
	   beside the shorter middle/right columns). Long bodies SCROLL inside the box (overflow-y),
	   and a max-height caps manual drag-resize so the text can never spill past the box into
	   the grey / under the action bar. */
	.body-textarea {
		height: 16rem;
		max-height: 22rem;
		resize: vertical;
		overflow-y: auto;
	}
	/* Galerija: URL+opis rows scroll inside .gallery-scroll while "Dodaj sliku" stays
	   pinned at the bottom of the fieldset (matches the edit page). */
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
		padding-right: 0.75rem;
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
	/* Gap between a field title and its input — matches the Vrsta medija spacing. */
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
		font-size: 0.9rem;
		color: #102e66;
		white-space: nowrap; /* keep the label on ONE row */
	}
	/* Fully custom checkbox: unchecked = an EMPTY outlined box (bg-coloured, not the browser's
	   black square); checked = navy fill + white tick. Matches the Vrsta filter boxes. */
	.check-row input[type='checkbox'] {
		appearance: none;
		-webkit-appearance: none;
		width: 1.1rem;
		height: 1.1rem;
		flex: 0 0 auto;
		margin: 0;
		border: 1.5px solid #b9c3d3;
		border-radius: 4px;
		background: #fff;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.check-row input[type='checkbox']:checked {
		border-color: #102e66;
		background: #102e66;
	}
	/* White tick drawn with a border (no SVG needed). */
	.check-row input[type='checkbox']:checked::after {
		content: '';
		width: 0.28rem;
		height: 0.55rem;
		border: solid #fff;
		border-width: 0 2px 2px 0;
		transform: translateY(-1px) rotate(45deg);
	}
	.form-actions {
		/* Sticky action bar flush to the panel's bottom edge (off-white bg), always in view
		   while the (tall) form scrolls under it on any screen size. */
		position: sticky;
		bottom: -1.5rem;
		margin: 0.5rem -1.5rem -1.5rem;
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
		white-space: nowrap; /* never wrap → all buttons keep the SAME single-line height */
	}
	/* All three action buttons the SAME width on desktop (fixed basis, no grow/shrink), wide
	   enough that the longest label ("Spremi kao nacrt") stays on one line — so they're
	   uniform in width AND height. Mobile overrides to an equal flex share. */
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
	/* Collapse 3 → 2 → 1 columns as the screen narrows (matches the edit page). */
	@media (max-width: 1200px) {
		.form-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 760px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		.body-textarea {
			min-height: 12rem;
		}
		/* White panel spans the full width — cancel the shared content area's 1rem side
		   padding so it touches the grey area's edges (edge-to-edge on phones) — and tighten
		   the form's own inner padding so fields get more room. */
		.panel {
			margin-left: -1rem;
			margin-right: -1rem;
			border-radius: 0;
			padding-left: 1rem;
			padding-right: 1rem;
		}
		/* Pin the action bar to the bottom of the SCREEN (the page scrolls on mobile, so the
		   in-panel sticky wouldn't stay in view). Panel gets bottom padding so the last
		   fields clear it. */
		.form-actions {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			margin: 0;
			z-index: 40;
			padding: 0.9rem 1rem calc(0.9rem + env(safe-area-inset-bottom));
			box-shadow: 0 -4px 16px rgba(16, 46, 102, 0.12);
			/* Three buttons share the row evenly, and stretch so they're all the SAME height. */
			gap: 0.4rem;
			align-items: stretch;
		}
		.form-actions .btn {
			flex: 1 1 0;
			min-width: 0;
			/* FIXED height + flex-centred text → every button is identical height regardless
			   of its border colour / label. (Padding alone let the middle one render shorter.) */
			height: 2.75rem;
			padding: 0 0.4rem;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 0.8rem;
			white-space: nowrap;
			text-align: center;
			line-height: 1;
		}
		.panel {
			padding-bottom: 5rem; /* clear the fixed action bar */
		}
	}
</style>

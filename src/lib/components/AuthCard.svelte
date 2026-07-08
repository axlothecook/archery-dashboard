<script lang="ts">
	// Shared auth-page shell: the two-column split (white card left on a grey backdrop,
	// full-bleed cover image right) used by /prijava, /accept-invite, /reset-password,
	// and /zaboravljena-lozinka. The page passes a `title` + its form via the default
	// slot so every auth screen looks identical. Cover-image preload mirrors /prijava.
	import { t } from '$lib/i18n';
	import { page } from '$app/state';

	let { title, children }: { title: string; children: import('svelte').Snippet } = $props();

	const locale = $derived(page.data.locale);

	const COVER_IMAGE = 'https://images.axlothecook.com/archery/stock-bow-photos/background.webp';
	let imageReady = $state(false);
	$effect(() => {
		const img = new Image();
		img.src = COVER_IMAGE;
		const done = () => (imageReady = true);
		img.decode?.().then(done).catch(done) ?? (img.onload = done);
		if (img.complete) done();
	});
</script>

<svelte:head>
	<title>{title} · {t(locale, 'clubName')}</title>
	<meta name="robots" content="noindex" />
	<link rel="preload" as="image" href={COVER_IMAGE} fetchpriority="high" />
</svelte:head>

<div class="login-split">
	<div class="login-pane">
		<div class="login-card">
			<h1 class="login-title">{title}</h1>
			{@render children()}
		</div>
	</div>

	<div
		class="login-image"
		class:is-ready={imageReady}
		style="--cover: url({COVER_IMAGE})"
		role="img"
		aria-label={t(locale, 'auth.imageAlt')}
	></div>
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'axlothecook-sass-library/sass-library/breakpoints' as bp;
	@use 'sass:map';
	@use 'sass:color';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$white: map.get(lib.$colors, 'white');
	$ink: map.get(lib.$colors, 'blue-charcoal');
	$sp: lib.$base-padding;
	$radius: $sp * 0.625;

	.login-split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		flex: 1 0 auto;
		min-height: 100dvh;
	}
	.login-pane {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $sp * 2;
		background-color: #e2e8f0;
	}
	.login-card {
		width: 100%;
		max-width: 34rem;
		background: $white;
		border-radius: $radius;
		padding: ($sp * 3.25) ($sp * 3.25);
		box-shadow: lib.$base-box-shadow;
	}
	.login-title {
		margin: 0 0 ($sp * 1.5);
		font-size: 2.6rem;
		font-weight: 700;
		color: $ink;
		letter-spacing: -0.01em;
		text-align: center;
	}
	.login-image {
		background-color: $navy;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		opacity: 1;
		&.is-ready {
			background-image: var(--cover);
		}
	}
	// Phone/tablet: the cover image becomes a FULL-SCREEN BACKGROUND with the white card
	// centred on top (both axes) — kept in sync with /prijava. Image + card pane overlap in
	// one grid cell; the pane sits above (z-index) so the card shows over the photo.
	@include bp.md-down {
		.login-split {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr;
			min-height: 100dvh;
		}
		.login-image {
			grid-area: 1 / 1;
			min-height: 0;
			z-index: 0;
			// Slight navy scrim so the white card + text read clearly over the photo.
			&.is-ready {
				background-image: linear-gradient(rgba(16, 46, 102, 0.35), rgba(16, 46, 102, 0.35)),
					var(--cover);
			}
		}
		.login-pane {
			grid-area: 1 / 1;
			z-index: 1;
			background: transparent;
			align-items: center; // vertical centre (card no longer sits low)
			justify-content: center;
			padding: ($sp * 1.5) ($sp * 1.25);
			min-height: 100dvh;
		}
		.login-card {
			max-width: 26rem;
			padding: ($sp * 2) ($sp * 1.75);
		}
		.login-title {
			font-size: 1.8rem;
			margin-bottom: ($sp * 1.1);
		}
	}
</style>

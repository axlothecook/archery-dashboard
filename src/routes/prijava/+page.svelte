<script lang="ts">
	// Dashboard login page (/prijava). UI mirrors the demo personnel-login design:
	// a two-column split — white login card on the left (grey backdrop), a
	// full-bleed cover image on the right. Adapted to the real app: email +
	// password (the backend's /auth/login contract), Croatian labels via i18n,
	// navy palette (library `deep-sapphire` #102e66). Fields use the Create_Resume
	// floating-label pattern: the label sits as the placeholder, then floats up to
	// NOTCH the input border on focus / touch / when filled.
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { login, AuthError } from '$lib/auth';

	const locale = $derived(page.data.locale);

	// Cover image: served from R2 (images.axlothecook.com), optimized to a 1600px
	// WebP (~41 KB, down from the 30 MP / 1.66 MB Supabase original — that oversize
	// was the login's slow-load cause). Migrated via
	// backend scripts/optimize-login-cover-to-r2.ts.
	const COVER_IMAGE = 'https://images.axlothecook.com/archery/stock-bow-photos/background.webp';

	// Preload the cover so it's FULLY decoded before we reveal it — no slow paint-in
	// over the navy placeholder. A hidden Image() decodes off-screen; once ready we
	// flip `imageReady`, which fades the background in (already-decoded → instant).
	let imageReady = $state(false);
	$effect(() => {
		const img = new Image();
		img.src = COVER_IMAGE;
		const done = () => (imageReady = true);
		img.decode?.().then(done).catch(done) ?? (img.onload = done);
		if (img.complete) done();
	});

	let email = $state('');
	let password = $state('');
	let submitting = $state(false);
	let errorMsg = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;
		errorMsg = '';
		submitting = true;
		try {
			await login(email, password);
			await goto('/admin');
		} catch (err) {
			errorMsg =
				err instanceof AuthError && err.status === 401
					? t(locale, 'auth.error')
					: t(locale, 'auth.errorGeneric');
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{t(locale, 'auth.title')} · {t(locale, 'clubName')}</title>
	<meta name="robots" content="noindex" />
	<!-- Preload hint so the browser fetches the cover at high priority immediately. -->
	<link rel="preload" as="image" href={COVER_IMAGE} fetchpriority="high" />
</svelte:head>

<div class="login-split">
	<div class="login-pane">
		<div class="login-card">
			<h1 class="login-title">{t(locale, 'auth.title')}</h1>

			<form class="login-form" onsubmit={handleSubmit} novalidate>
				<!-- Floating-label field: input carries a single-space placeholder so
				     :placeholder-shown works; the label floats onto the border on focus
				     (incl. touch) or when filled. Order = input THEN label (sibling CSS). -->
				<div class="field">
					<input
						id="login-email"
						type="email"
						name="email"
						placeholder=" "
						autocomplete="username"
						bind:value={email}
						required
						disabled={submitting}
					/>
					<label for="login-email">{t(locale, 'auth.email')}</label>
				</div>

				<div class="field">
					<input
						id="login-password"
						type="password"
						name="password"
						placeholder=" "
						autocomplete="current-password"
						bind:value={password}
						required
						disabled={submitting}
					/>
					<label for="login-password">{t(locale, 'auth.password')}</label>
				</div>

				{#if errorMsg}
					<p class="login-error" role="alert">{errorMsg}</p>
				{/if}

				<button type="submit" class="login-btn" disabled={submitting}>
					{submitting ? t(locale, 'auth.submitting') : t(locale, 'auth.submit')}
				</button>
			</form>

			<p class="login-help">
				{t(locale, 'auth.help')}
				<a href="https://archery.axlothecook.com/kontakt">{t(locale, 'auth.helpLink')}</a>
			</p>
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

	// Palette pulled from the shared library (no hardcoded hex).
	$navy: map.get(lib.$colors, 'deep-sapphire'); // #102E66
	$navy-dark: color.adjust($navy, $lightness: -6%);
	$white: map.get(lib.$colors, 'white');
	$grey-bg: map.get(lib.$colors, 'pastel-grey'); // #ccc → softened below
	$grey-line: map.get(lib.$colors, 'heather'); // #bec2d0 input border
	$ink: map.get(lib.$colors, 'blue-charcoal'); // near-black text
	$label-grey: map.get(lib.$colors, 'jet-grey'); // #607480 resting label
	$link: map.get(lib.$colors, 'blue-dress'); // #187ff5 — lighter blue, differentiates from the dark help text
	$error: map.get(lib.$colors, 'brick-red'); // #d32752
	$sp: lib.$base-padding;
	$radius: $sp * 0.625; // 10px to match the demo

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
		background-color: #e2e8f0; // soft light-grey backdrop
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

	.login-form {
		display: flex;
		flex-direction: column;
		gap: $sp * 1.15;
	}

	// ── Floating-label field (Create_Resume pattern) ────────────────────────────
	.field {
		position: relative;
		display: block;
		// the label notches the border by sitting on the card-bg behind it
		--field-bg: #{$white};
	}

	.field input {
		width: 100%;
		box-sizing: border-box;
		padding: ($sp * 0.9) ($sp * 1.1);
		border: 2px solid $grey-line;
		border-radius: $radius;
		font-size: 1.05rem;
		font-family: inherit;
		color: $ink;
		background: transparent;
		// Only the border-color animates — NO focus glow/ring (per request).
		transition: border-color 0.18s ease;
	}
	.field input:focus {
		outline: none; // remove the default blue focus highlight
		border-color: $navy; // active cue = border colour only, no box-shadow
	}
	.field input:disabled {
		opacity: 0.6;
	}
	// Kill the browser AUTOFILL background tint (Chrome/Safari paint a yellow/blue
	// fill once the field matches a saved value — this is the bg-colour change
	// seen after typing the email). The bg can't be made truly transparent, so we
	// mask it with an inset shadow in the card colour and pin the text colour. The
	// long transition delay defeats Chrome's fade-in on autofill.
	.field input:-webkit-autofill,
	.field input:-webkit-autofill:hover,
	.field input:-webkit-autofill:focus,
	.field input:-webkit-autofill:active {
		-webkit-text-fill-color: $ink;
		caret-color: $ink;
		box-shadow: 0 0 0 1000px var(--field-bg) inset;
		transition: background-color 9999s ease 0s;
	}

	.field label {
		position: absolute;
		left: $sp * 0.9;
		top: 50%;
		transform: translateY(-50%);
		padding: 0 ($sp * 0.3);
		font-size: 1.25rem;
		font-weight: 500;
		color: $label-grey;
		background: transparent;
		pointer-events: none; // clicks pass through to the input
		transition:
			top 0.18s ease,
			transform 0.18s ease,
			font-size 0.18s ease,
			color 0.18s ease;
	}

	// Floated: focused (incl. touch — tap fires focus) OR filled (placeholder gone).
	// The label rises to sit ON the border, with the card bg behind it so it notches in.
	.field input:focus + label,
	.field input:not(:placeholder-shown) + label {
		top: 0;
		transform: translateY(-50%);
		font-size: 0.92rem;
		background: var(--field-bg);
	}
	// Highlight colour only while actually focused (the "currently active" cue).
	.field input:focus + label {
		color: $navy;
	}

	.login-error {
		margin: 0;
		color: $error;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.login-btn {
		margin-top: $sp * 0.5;
		border: none;
		border-radius: $radius;
		padding: $sp * 0.95;
		font-size: 1.05rem;
		font-weight: 600;
		font-family: inherit;
		color: $white;
		background-color: $navy;
		cursor: pointer;
		transition:
			background-color 0.18s ease,
			transform 0.05s ease;

		&:hover:not(:disabled) {
			background-color: $navy-dark;
		}
		&:active:not(:disabled) {
			transform: translateY(1px);
		}
		&:disabled {
			opacity: 0.7;
			cursor: default;
		}
	}

	.login-help {
		margin: ($sp * 1.25) 0 0;
		text-align: center;
		font-size: 1rem;
		font-weight: 400;
		color: color.adjust($ink, $lightness: 25%);

		a {
			color: $link; // lighter blue (blue-dress) so the link stands out from the dark sentence
			font-weight: 500;
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	// ── Cover image (right) ─────────────────────────────────────────────────────
	// Sits on a navy placeholder; the decoded image fades in once preloaded, so the
	// pane is never blank/slow-painting — it's navy, then the (already-decoded)
	// photo appears instantly.
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

	// Phone: stack — image becomes a short banner on top, card below. Uses the
	// library's desktop-first breakpoint mixin instead of a raw @media query.
	@include bp.md-down {
		.login-split {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
		}
		.login-image {
			order: -1;
			min-height: 11.25rem;
		}
		.login-pane {
			padding: ($sp * 1.5) ($sp * 1.1);
		}
		.login-title {
			font-size: 2.1rem;
		}
	}
</style>

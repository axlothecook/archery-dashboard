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
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import EyeOffIcon from '$lib/components/icons/EyeOffIcon.svelte';

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

	// Public demo account (the site is a portfolio piece — anyone may LOOK at the
	// dashboard without credentials). These are DELIBERATELY in the client bundle:
	// the backend's guestReadOnly middleware makes the role read-only, so knowing
	// them grants nothing beyond what the button already offers.
	const GUEST_EMAIL = 'gost@vsk-demo.hr';
	const GUEST_PASSWORD = 'razgledaj-vsk-2026';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let guestSubmitting = $state(false);
	let errorMsg = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting || guestSubmitting) return;
		errorMsg = '';
		submitting = true;
		try {
			await login(email, password);
			await goto('/nadzorna-ploca');
		} catch (err) {
			errorMsg =
				err instanceof AuthError && err.status === 401
					? t(locale, 'auth.error')
					: t(locale, 'auth.errorGeneric');
			submitting = false;
		}
	}

	// Guest entry: the same login flow, fixed credentials. Any failure (e.g. the
	// guest account not seeded) falls back to the generic error message.
	async function handleGuest() {
		if (submitting || guestSubmitting) return;
		errorMsg = '';
		guestSubmitting = true;
		try {
			await login(GUEST_EMAIL, GUEST_PASSWORD);
			await goto('/nadzorna-ploca');
		} catch {
			errorMsg = t(locale, 'auth.errorGeneric');
			guestSubmitting = false;
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

				<div class="field field--pw">
					<!-- value + oninput (not bind:value) so `type` can toggle with the eye button;
					     Svelte forbids a dynamic `type` alongside bind:value. The label stays
					     immediately after the input so the floating-label `+ label` selector holds. -->
					<input
						id="login-password"
						type={showPassword ? 'text' : 'password'}
						name="password"
						placeholder=" "
						autocomplete="current-password"
						value={password}
						oninput={(e) => (password = e.currentTarget.value)}
						required
						disabled={submitting}
					/>
					<label for="login-password">{t(locale, 'auth.password')}</label>
					<button
						class="pw-eye"
						type="button"
						aria-label={showPassword ? t(locale, 'auth.hidePassword') : t(locale, 'auth.showPassword')}
						aria-pressed={showPassword}
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}<EyeIcon size={20} />{:else}<EyeOffIcon size={20} />{/if}
					</button>
				</div>

				<!-- Forgot-password link sits directly under the password field. -->
				<p class="login-forgot">
					<a href="/zaboravljena-lozinka">{t(locale, 'auth.forgotLink')}</a>
				</p>

				{#if errorMsg}
					<p class="login-error" role="alert">{errorMsg}</p>
				{/if}

				<button type="submit" class="login-btn" disabled={submitting || guestSubmitting}>
					{submitting ? t(locale, 'auth.submitting') : t(locale, 'auth.submit')}
				</button>

				<!-- Guest entry: outlined secondary button — visually subordinate to the
				     primary login, but discoverable for anyone wanting a look around. -->
				<button
					type="button"
					class="login-btn login-btn--guest"
					onclick={handleGuest}
					disabled={submitting || guestSubmitting}
				>
					{guestSubmitting ? t(locale, 'auth.guestSubmitting') : t(locale, 'auth.guestBtn')}
				</button>
			</form>

			<p class="login-help">
				{t(locale, 'auth.help')}
				<!-- Login help = reach a human about ACCOUNT ACCESS (best practice: not the public
				     inquiry form). mailto to the developer/administrator, subject prefilled.
				     TODO(adoption): replace the placeholder address with the real support mailbox. -->
				<a href="mailto:podrska@axlothecook.com?subject={encodeURIComponent('Pomoć pri prijavi: nadzorna ploča VSK')}">{t(locale, 'auth.helpLink')}</a>
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

	// Password field: leave room on the right for the show/hide eye button.
	.field--pw input {
		padding-right: $sp * 3.4;
	}
	.pw-eye {
		position: absolute;
		top: 50%;
		right: $sp * 0.6;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.2rem;
		height: 2.2rem;
		padding: 0;
		border: 0;
		border-radius: $radius;
		background: none;
		color: $label-grey;
		cursor: pointer;
		transition:
			color 0.15s ease,
			background-color 0.15s ease;

		&:hover {
			color: $navy;
			background: rgba(16, 46, 102, 0.06);
		}
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

	// Guest variant: outlined on the white card. Hover = state layer of the content
	// colour (light bg → darken), same pattern as the rest of the site's buttons.
	.login-btn--guest {
		margin-top: 0;
		background: transparent;
		border: 2px solid $navy;
		color: $navy;
		padding: calc(#{$sp * 0.95} - 2px); // border eats into the box — keep equal height

		&:hover:not(:disabled) {
			background-color: rgba(16, 46, 102, 0.08);
		}
	}

	.login-forgot {
		/* Directly under the password field, right-aligned; small gap before the button. */
		margin: (-$sp * 0.35) 0 ($sp * 0.4);
		text-align: right;
		font-size: 0.92rem;

		a {
			color: $link;
			font-weight: 500;
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.login-help {
		margin: ($sp * 0.75) 0 0;
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

	// Phone/tablet: the cover image becomes a FULL-SCREEN BACKGROUND and the white card
	// is centred on top of it (both axes). Single grid cell; the image and the card pane
	// overlap in that one cell (grid-area 1/1). A translucent navy scrim over the image
	// keeps the card edges + any text legible against a busy photo.
	@include bp.md-down {
		.login-split {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr;
			min-height: 100dvh;
		}
		// Image fills the whole cell, BEHIND the card (z-index 0).
		.login-image {
			grid-area: 1 / 1;
			min-height: 0;
			z-index: 0;
			// Darken slightly so the white card and text read clearly over the photo.
			&.is-ready {
				background-image: linear-gradient(rgba(16, 46, 102, 0.35), rgba(16, 46, 102, 0.35)),
					var(--cover);
			}
		}
		// Card pane sits in the SAME cell but ABOVE the image (z-index 1), transparent,
		// centring the card both axes.
		.login-pane {
			grid-area: 1 / 1;
			z-index: 1;
			background: transparent;
			align-items: center; // vertical centre (fixes the card sitting low)
			justify-content: center; // horizontal centre
			padding: ($sp * 1.5) ($sp * 1.25);
			// Full available height so centring has room to work.
			min-height: 100dvh;
		}
		.login-card {
			// Narrower + tighter padding on phones (the full-size desktop padding was oversized
			// on mobile now that the laptop font-shrink no longer applies here).
			max-width: 26rem;
			padding: ($sp * 2) ($sp * 1.75);
		}
		.login-title {
			font-size: 1.8rem;
			margin-bottom: ($sp * 1.1);
		}
		// Smaller field text + label so inputs aren't oversized on phones.
		.field input {
			font-size: 0.95rem;
			padding: ($sp * 0.75) ($sp * 0.95);
		}
		.field label {
			font-size: 1.05rem;
		}
		.field input:focus + label,
		.field input:not(:placeholder-shown) + label {
			font-size: 0.82rem;
		}
		.login-forgot {
			font-size: 0.88rem;
		}
		.login-btn {
			font-size: 0.98rem;
		}
		// Help line: smaller, and kept on ONE row (don't wrap the link under the sentence).
		.login-help {
			margin-top: ($sp * 1.4);
			font-size: 0.9rem;
			white-space: nowrap;
		}
	}
</style>

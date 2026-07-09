<script lang="ts">
	// Reset password: opened from the emailed link (/reset-password?token=…). Set a new
	// password (12–20, printable ASCII, confirmed) → POST /auth/reset-password. On success
	// all sessions are revoked server-side and the card flips to a "Lozinka promijenjena"
	// state pointing the user to /prijava.
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { resetPassword, AuthError } from '$lib/auth';
	import { passwordError, confirmError } from '$lib/password-rules';
	import AuthCard from '$lib/components/AuthCard.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import EyeOffIcon from '$lib/components/icons/EyeOffIcon.svelte';
	import '$lib/auth-forms.css';

	const locale = $derived(page.data.locale);
	const token = $derived(page.url.searchParams.get('token') ?? '');

	let password = $state('');
	let confirm = $state('');
	let showPw = $state(false);
	let showConfirm = $state(false);
	let pwTouched = $state(false);
	let confirmTouched = $state(false);
	let submitting = $state(false);
	let done = $state(false);
	let errorMsg = $state('');

	const pwErrKey = $derived(password.length > 0 ? passwordError(password) : null);
	const confirmErrKey = $derived(confirmError(password, confirm));
	const formValid = $derived(!!token && pwErrKey === null && password.length > 0 && confirmErrKey === null && confirm.length > 0);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;
		errorMsg = '';
		if (!token) {
			errorMsg = t(locale, 'pw.noToken');
			return;
		}
		pwTouched = true;
		confirmTouched = true;
		if (!formValid) return;
		submitting = true;
		try {
			await resetPassword(token, password);
			done = true;
		} catch (err) {
			errorMsg =
				err instanceof AuthError && err.status === 400
					? t(locale, 'pw.badToken')
					: t(locale, 'pw.genericError');
		} finally {
			submitting = false;
		}
	}
</script>

<AuthCard title={done ? t(locale, 'reset.doneTitle') : t(locale, 'reset.title')}>
	{#if done}
		<p class="af-success">{t(locale, 'reset.done')}</p>
		<p class="af-help"><a class="af-link" href="/prijava">{t(locale, 'reset.goLogin')}</a></p>
	{:else}
		<p class="af-intro">{t(locale, 'reset.intro')}</p>
		<form class="af-form" onsubmit={handleSubmit} novalidate>
			<div class="af-field af-field--pw" class:af-field--invalid={pwTouched && pwErrKey}>
				<input
					id="reset-pw"
					type={showPw ? 'text' : 'password'}
					name="new-password"
					placeholder=" "
					autocomplete="new-password"
					value={password}
					oninput={(e) => (password = e.currentTarget.value)}
					onblur={() => (pwTouched = true)}
					aria-invalid={pwTouched && !!pwErrKey}
					aria-describedby="reset-pw-hint"
					required
					disabled={submitting}
				/>
				<label for="reset-pw">{t(locale, 'reset.password')}</label>
				<button
					class="pw-eye"
					type="button"
					aria-label={showPw ? t(locale, 'auth.hidePassword') : t(locale, 'auth.showPassword')}
					aria-pressed={showPw}
					onclick={() => (showPw = !showPw)}
				>
					{#if showPw}<EyeIcon size={20} />{:else}<EyeOffIcon size={20} />{/if}
				</button>
			</div>
			{#if pwTouched && pwErrKey}
				<p class="af-field-error" role="alert">{t(locale, pwErrKey)}</p>
			{:else}
				<p class="af-hint" id="reset-pw-hint">{t(locale, 'pw.hint')}</p>
			{/if}

			<div class="af-field af-field--pw" class:af-field--invalid={confirmTouched && confirmErrKey}>
				<input
					id="reset-confirm"
					type={showConfirm ? 'text' : 'password'}
					name="confirm-password"
					placeholder=" "
					autocomplete="new-password"
					value={confirm}
					oninput={(e) => (confirm = e.currentTarget.value)}
					onblur={() => (confirmTouched = true)}
					aria-invalid={confirmTouched && !!confirmErrKey}
					required
					disabled={submitting}
				/>
				<label for="reset-confirm">{t(locale, 'reset.confirm')}</label>
				<button
					class="pw-eye"
					type="button"
					aria-label={showConfirm ? t(locale, 'auth.hidePassword') : t(locale, 'auth.showPassword')}
					aria-pressed={showConfirm}
					onclick={() => (showConfirm = !showConfirm)}
				>
					{#if showConfirm}<EyeIcon size={20} />{:else}<EyeOffIcon size={20} />{/if}
				</button>
			</div>
			{#if confirmTouched && confirmErrKey}
				<p class="af-field-error" role="alert">{t(locale, confirmErrKey)}</p>
			{/if}

			{#if errorMsg}<p class="af-error" role="alert">{errorMsg}</p>{/if}
			<button type="submit" class="af-btn" disabled={submitting || !formValid}>
				{submitting ? t(locale, 'reset.submitting') : t(locale, 'reset.submit')}
			</button>
		</form>
		<p class="af-help"><a class="af-link" href="/prijava">{t(locale, 'auth.backToLogin')}</a></p>
	{/if}
</AuthCard>

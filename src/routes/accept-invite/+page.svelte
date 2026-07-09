<script lang="ts">
	// Accept invite: opened from the emailed link (/accept-invite?token=…). Set a
	// password (12–20, printable ASCII, confirmed) → POST /auth/accept-invite, which
	// activates the pending admin account. Single-use: once the account has a password
	// the token stops working. On success the card flips to a "Račun aktiviran" state
	// pointing the user to /prijava to log in.
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { acceptInvite, AuthError } from '$lib/auth';
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
	// `touched` gates the live per-field errors so they don't shout before the user has
	// interacted with a field (errors appear on blur or once they've typed then cleared).
	let pwTouched = $state(false);
	let confirmTouched = $state(false);
	let submitting = $state(false);
	let done = $state(false);
	let errorMsg = $state('');

	// Live validation keys (null = valid). Shown under each field once touched.
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
		// Surface any field errors on submit even if the user never blurred.
		pwTouched = true;
		confirmTouched = true;
		if (!formValid) return;
		submitting = true;
		try {
			await acceptInvite(token, password);
			done = true;
		} catch (err) {
			// 400 = invalid/expired token; 409 = invite already used.
			errorMsg =
				err instanceof AuthError && (err.status === 400 || err.status === 409)
					? t(locale, 'pw.badToken')
					: t(locale, 'pw.genericError');
		} finally {
			submitting = false;
		}
	}
</script>

<AuthCard title={done ? t(locale, 'invite.doneTitle') : t(locale, 'invite.title')}>
	{#if done}
		<p class="af-success">{t(locale, 'invite.done')}</p>
		<p class="af-help"><a class="af-link" href="/prijava">{t(locale, 'reset.goLogin')}</a></p>
	{:else}
		<p class="af-intro">{t(locale, 'invite.intro')}</p>
		<form class="af-form" onsubmit={handleSubmit} novalidate>
			<div class="af-field af-field--pw" class:af-field--invalid={pwTouched && pwErrKey}>
				<input
					id="invite-pw"
					type={showPw ? 'text' : 'password'}
					name="new-password"
					placeholder=" "
					autocomplete="new-password"
					value={password}
					oninput={(e) => (password = e.currentTarget.value)}
					onblur={() => (pwTouched = true)}
					aria-invalid={pwTouched && !!pwErrKey}
					aria-describedby="invite-pw-hint"
					required
					disabled={submitting}
				/>
				<label for="invite-pw">{t(locale, 'reset.password')}</label>
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
				<p class="af-hint" id="invite-pw-hint">{t(locale, 'pw.hint')}</p>
			{/if}

			<div class="af-field af-field--pw" class:af-field--invalid={confirmTouched && confirmErrKey}>
				<input
					id="invite-confirm"
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
				<label for="invite-confirm">{t(locale, 'reset.confirm')}</label>
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
				{submitting ? t(locale, 'invite.submitting') : t(locale, 'invite.submit')}
			</button>
		</form>
	{/if}
</AuthCard>

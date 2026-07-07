<script lang="ts">
	// Accept invite: opened from the emailed link (/accept-invite?token=…). Set a
	// password (min 12, confirmed) → POST /auth/accept-invite, which activates the
	// pending admin account. Single-use: once the account has a password the token stops
	// working. On success, point the user to /prijava to log in.
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { acceptInvite, AuthError } from '$lib/auth';
	import AuthCard from '$lib/components/AuthCard.svelte';
	import '$lib/auth-forms.css';

	const locale = $derived(page.data.locale);
	const token = $derived(page.url.searchParams.get('token') ?? '');

	let password = $state('');
	let confirm = $state('');
	let submitting = $state(false);
	let done = $state(false);
	let errorMsg = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;
		errorMsg = '';
		if (!token) {
			errorMsg = t(locale, 'pw.noToken');
			return;
		}
		if (password.length < 12) {
			errorMsg = t(locale, 'pw.tooShort');
			return;
		}
		if (password !== confirm) {
			errorMsg = t(locale, 'pw.mismatch');
			return;
		}
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

<AuthCard title={t(locale, 'invite.title')}>
	{#if done}
		<p class="af-success">{t(locale, 'invite.done')}</p>
		<p class="af-help"><a class="af-link" href="/prijava">{t(locale, 'reset.goLogin')}</a></p>
	{:else}
		<p class="af-intro">{t(locale, 'invite.intro')}</p>
		<form class="af-form" onsubmit={handleSubmit} novalidate>
			<div class="af-field">
				<input
					id="invite-pw"
					type="password"
					name="new-password"
					placeholder=" "
					autocomplete="new-password"
					bind:value={password}
					required
					disabled={submitting}
				/>
				<label for="invite-pw">{t(locale, 'reset.password')}</label>
			</div>
			<div class="af-field">
				<input
					id="invite-confirm"
					type="password"
					name="confirm-password"
					placeholder=" "
					autocomplete="new-password"
					bind:value={confirm}
					required
					disabled={submitting}
				/>
				<label for="invite-confirm">{t(locale, 'reset.confirm')}</label>
			</div>
			{#if errorMsg}<p class="af-error" role="alert">{errorMsg}</p>{/if}
			<button type="submit" class="af-btn" disabled={submitting}>
				{submitting ? t(locale, 'invite.submitting') : t(locale, 'invite.submit')}
			</button>
		</form>
	{/if}
</AuthCard>

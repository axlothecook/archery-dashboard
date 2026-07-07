<script lang="ts">
	// Forgot-password: enter an email → POST /auth/forgot-password → the backend emails
	// a reset link if the account exists. We ALWAYS show the same neutral "if it exists,
	// we sent it" message (no account enumeration), matching the backend's behaviour.
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { forgotPassword } from '$lib/auth';
	import AuthCard from '$lib/components/AuthCard.svelte';
	import '$lib/auth-forms.css';

	const locale = $derived(page.data.locale);

	let email = $state('');
	let submitting = $state(false);
	let sent = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting || !email.trim()) return;
		submitting = true;
		try {
			await forgotPassword(email.trim());
		} catch {
			// Intentionally ignore errors — the response is always neutral so we never
			// reveal whether the address has an account.
		}
		sent = true;
		submitting = false;
	}
</script>

<AuthCard title={t(locale, 'forgot.title')}>
	{#if sent}
		<p class="af-success">{t(locale, 'forgot.sent')}</p>
		<p class="af-help"><a class="af-link" href="/prijava">{t(locale, 'auth.backToLogin')}</a></p>
	{:else}
		<p class="af-intro">{t(locale, 'forgot.intro')}</p>
		<form class="af-form" onsubmit={handleSubmit} novalidate>
			<div class="af-field">
				<input
					id="forgot-email"
					type="email"
					name="email"
					placeholder=" "
					autocomplete="username"
					bind:value={email}
					required
					disabled={submitting}
				/>
				<label for="forgot-email">{t(locale, 'auth.email')}</label>
			</div>
			<button type="submit" class="af-btn" disabled={submitting}>
				{submitting ? t(locale, 'forgot.submitting') : t(locale, 'forgot.submit')}
			</button>
		</form>
		<p class="af-help"><a class="af-link" href="/prijava">{t(locale, 'auth.backToLogin')}</a></p>
	{/if}
</AuthCard>

<script lang="ts">
	// Pomoć (Help / Q&A): common admin questions as a click-to-expand ACCORDION. Each
	// question is a full-width title bar (box-shadow) with a chevron that rotates on open;
	// the answer drops down. Multiple can be open at once. This is where the top-bar search
	// leads (?q= pre-filters). Two answers point to the Profil page's Report/Suggest buttons.
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import QuestionIcon from '$lib/components/icons/QuestionIcon.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';

	// The FAQ (Croatian; the dashboard is HR-first). Order matches the club's request.
	const FAQ: { q: string; a: string }[] = [
		{
			q: 'Kako mogu promijeniti svoju lozinku ili email?',
			a: 'Otvorite svoj profil (klik na svoje ime gore desno -> Profil). Ondje možete urediti email i promijeniti lozinku. Ako ste zaboravili lozinku, na stranici za prijavu kliknite „Zaboravili ste lozinku?” i poveznica za postavljanje nove lozinke (vrijedi 30 minuta) će Vam biti poslana.'
		},
		{
			q: 'Kako mogu napraviti novog člana administracije?',
			a: 'Otvorite Administracija i dodajte člana s njegovim imenom, emailom i ulogom. Pozvana osoba dobiva e-poštu s poveznicom (vrijedi 72 sata) na kojoj sama postavlja lozinku i aktivira svoj račun. Napomena: samo administratori mogu dodavati članove.'
		},
		{
			q: 'Kako mogu urediti informacije ili maknuti trenutnog člana administracije?',
			a: 'Na stranici Administracija, pokraj svakog člana nalaze se opcije za uređivanje i brisanje. Uređivanjem mijenjate njegove podatke; brisanjem mu se trajno uklanja pristup nadzornoj ploči.'
		},
		{
			q: 'Gdje mogu dobiti pomoć ako je nešto hitno?',
			a: 'Otvorite svoj profil (ime gore desno -> Profil). Ondje se nalazi hitni kontakt razvojnog programera (WhatsApp / poziv) za slučaj da nešto hitno ne radi. Ako stranica prikazuje grešku, prvo je osvježite; ako se problem nastavi, javite se putem tog kontakta.'
		},
		{
			q: 'Kako mogu prijaviti problem sa stranicom?',
			a: 'Na svom profilu (ime gore desno -> Profil) kliknite „Prijavi problem” i ispunite kratki obrazac s opisom (što ste radili i što se dogodilo). Poruka se šalje razvojnom programeru na pregled.'
		},
		{
			q: 'Imam ideju za nešto što bih htio/htjela da se uvede ili uredi u nadzornu ploču / glavnu stranicu. Gdje da se javim?',
			a: 'Na svom profilu (ime gore desno -> Profil) kliknite „Predloži promjenu” i opišite svoju ideju. Svaka povratna informacija je dobrodošla: recite što biste htjeli i zašto bi to pomoglo.'
		},
		{
			q: 'Ne mogu naći neke podatke. Gdje da ih potražim?',
			a: 'Podaci su organizirani po sekcijama u lijevom izborniku (Vijesti, Raspored, Momčad, Postignuća, Sponzori, Upiti). Unutar svake sekcije koristite filtere i pretragu. Nacrti (još neobjavljene stavke) nalaze se pod „Nacrti” u odgovarajućoj sekciji.'
		},
		{
			q: 'Što obavijesti na vrhu stranice znače?',
			a: 'Zvono gore desno prikazuje novosti od vašeg zadnjeg posjeta (novi članci, događaji, upiti, promjene drugih administratora). Crvena točkica znači da ima novih obavijesti; nestane kad otvorite popis.'
		},
		{
			q: 'Što žuti treptajući krugovi na lijevom izborniku znače?',
			a: 'Žuti krug pokraj sekcije znači da u njoj ima nešto novo što još niste pregledali. Nestane čim otvorite tu sekciju. Oznake su za svakog administratora zasebne: ako jedan pogleda, drugi i dalje vidi svoju oznaku dok i on ne pogleda.'
		}
	];

	// Pre-filter from the top-bar search (?q=…); the box below refines further.
	let query = $state('');
	let lastQ = $state<string | null>(null);
	$effect(() => {
		const q = page.url.searchParams.get('q') ?? '';
		if (q !== lastQ) {
			lastQ = q;
			query = q;
		}
	});
	const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
	const matches = $derived(
		query.trim() ? FAQ.filter((f) => norm(f.q + ' ' + f.a).includes(norm(query.trim()))) : FAQ
	);
	// If a search matches no question, we STILL show all questions (never a blank page) —
	// with a note that nothing matched. So the help content is always visible.
	const noMatch = $derived(query.trim().length > 0 && matches.length === 0);
	const display = $derived(noMatch ? FAQ : matches);

	// Which questions are open (by question text). Multiple may be open at once.
	let open = $state<Set<string>>(new Set());
	function toggle(q: string) {
		const next = new Set(open);
		next.has(q) ? next.delete(q) : next.add(q);
		open = next;
	}
</script>

<svelte:head><title>Pomoć · VSK</title></svelte:head>

<section class="help-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<QuestionIcon size={38} />
		<div>
			<h2 class="mgmt-title">Pomoć</h2>
			<p class="mgmt-sub">Česta pitanja i odgovori za rad u nadzornoj ploči.</p>
		</div>
	</div>

	<div class="faq-scroll custom-scrollbar">
		{#if display.length === 0}
			<p class="help-empty">Nema dostupnih pitanja.</p>
		{:else}
			<ul class="faq-list">
				{#each display as item (item.q)}
					<li class="faq-item">
						<!-- Title = white card. -->
						<button
							class="faq-head display-f align-items-center justify-content-space-between w-full cursor-pointer"
							type="button"
							aria-expanded={open.has(item.q)}
							onclick={() => toggle(item.q)}
						>
							<span class="faq-q">{item.q}</span>
							<span class="faq-chevron display-f" class:open={open.has(item.q)} aria-hidden="true">
								<ChevronIcon direction="right" size={44} />
							</span>
						</button>
						<!-- Answer = on the grey page background (no white card), slides open/closed. -->
						{#if open.has(item.q)}
							<div class="faq-body" transition:slide={{ duration: 240, easing: cubicOut }}>
								<p class="faq-a">{item.a}</p>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');

	.help-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
	}
	.mgmt-head {
		margin-bottom: 2.5rem;
	}
	.mgmt-title {
		margin: 0;
		font-size: 1.6rem;
		font-weight: 700;
		color: $navy;
	}
	.mgmt-sub {
		margin: 0.35rem 0 0;
		font-size: 0.95rem;
		color: #5b6577;
	}
	/* Scroll the accordion list inside the frame (the page never scrolls). `overflow-y:
	   scroll` keeps the styled scrollbar visible from the start (not only while scrolling);
	   the extra right padding puts a clear gap between the cards and the scrollbar. */
	.faq-scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: scroll;
		padding: 0.25rem 1.5rem 0.5rem 0.25rem;
	}
	.faq-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	/* The item wraps a white title card + an answer that sits on the grey page bg. */
	.faq-item {
		background: none;
	}
	/* Only the TITLE is a white card with box-shadow. */
	.faq-head {
		gap: 1rem;
		padding: 1.6rem 1.75rem;
		border: 0;
		border-radius: 12px;
		background: #fff;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.08);
		text-align: left;
		font-family: inherit;
	}
	.faq-q {
		font-size: 1.6rem;
		font-weight: 700;
		color: $navy;
		line-height: 1.4;
	}
	.faq-chevron {
		flex: 0 0 auto;
		color: #5b6577;
		transition: transform 0.2s ease;
	}
	/* Chevron points RIGHT when closed; rotates to point DOWN (90°) when open. */
	.faq-chevron.open {
		transform: rotate(90deg);
	}
	/* Answer sits BELOW the title card, directly on the grey page background (no card).
	   Extra bottom padding gives a clear gap before the next question card. */
	.faq-body {
		padding: 1rem 1.75rem 2.5rem;
	}
	.faq-a {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.65;
		color: #000;
	}
	.help-empty {
		margin: 0;
		padding: 1.5rem 0;
		text-align: center;
		color: #9aa3b2;
		font-size: 0.95rem;
	}
	@media (max-width: 820px) {
		/* 1) Smaller question title so it doesn't dominate a phone screen. */
		.faq-q {
			font-size: 1.2rem;
		}
		/* 2) Bring the cards close to the screen edges (cancel the content area's 1rem side
		   padding), EQUIDISTANT from both sides. On phone the PAGE scrolls (not this box), so
		   drop the reserved scrollbar track (`overflow: visible`) — otherwise the always-on
		   `overflow-y: scroll` reserves a right-side track and pushes the cards left of centre. */
		.faq-scroll {
			overflow: visible;
			margin-left: -1rem;
			margin-right: -1rem;
			padding: 0.25rem 0.5rem 0.5rem 0.5rem;
		}
		/* Chevron down from 44 so it fits the smaller title bar. */
		.faq-chevron :global(svg) {
			width: 28px;
			height: 28px;
		}
		.faq-head {
			padding: 1.1rem 1.25rem;
		}
		/* 3) Tighter padding around the answer text. */
		.faq-body {
			padding: 0.75rem 1.25rem 1.5rem;
		}
		.faq-a {
			font-size: 1rem;
		}
	}
</style>

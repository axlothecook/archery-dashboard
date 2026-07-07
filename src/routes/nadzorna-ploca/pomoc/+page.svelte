<script lang="ts">
	// Pomoć (Help / Q&A): a small FAQ of the things a club admin is most likely to ask,
	// with the answers shown inline. This is where the top-bar search bar leads — the
	// `?q=` query pre-filters the questions. It's a self-contained help centre (not a
	// data search): questions + ready answers an admin can skim.
	import { page } from '$app/state';
	import InquiryIcon from '$lib/components/icons/InquiryIcon.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';

	// The FAQ. Croatian (the dashboard is HR-first). Grouped by area so it reads as a
	// help centre; each entry is a question + a plain-language answer.
	const FAQ: { q: string; a: string }[] = [
		{
			q: 'Kako dodati novu vijest?',
			a: 'Otvorite Vijesti → Novi članak, ispunite naslov, sadržaj i sliku, pa spremite. Članak možete spremiti kao nacrt ili ga odmah objaviti. Objavljeni članci vidljivi su na javnoj stranici.'
		},
		{
			q: 'Kako dodati događaj u raspored?',
			a: 'Raspored → Novi događaj. Unesite naziv, disciplinu, datume, lokaciju i razinu (kategoriju). Spremite kao nacrt dok pripremate detalje, ili objavite kad je spreman.'
		},
		{
			q: 'Kako dodati streličara u momčad?',
			a: 'Momčad → Novi streličar. Unesite ime, ulogu, luk, kategorije i barem jednu sliku te biografiju. Novi profili počinju kao nacrt (Momčad → Nacrti) dok ih ne objavite.'
		},
		{
			q: 'Što znači „nacrt”?',
			a: 'Nacrt je stavka koja još nije javno vidljiva — vidite je samo vi u nadzornoj ploči. Kad je spremna, objavite je da se prikaže na javnoj stranici.'
		},
		{
			q: 'Kako odgovoriti na upit?',
			a: 'Otvorite Upiti, odaberite upit s popisa i upišite odgovor u polje „Odgovori e-poštom”. Klikom na upit označava se kao pročitan. Odgovor se šalje pošiljatelju e-poštom.'
		},
		{
			q: 'Kako sakriti nešto s javne stranice bez brisanja?',
			a: 'Na objavljenim stavkama (događaji, streličari) postoji opcija „Skrij s javne stranice”. Stavka ostaje u nadzornoj ploči, ali se ne prikazuje javno. Kod streličara možete sakriti i pojedine sekcije (biografija, statistika, nastupi).'
		},
		{
			q: 'Zaboravio/la sam lozinku. Što sada?',
			a: 'Na stranici za prijavu kliknite „Zaboravili ste lozinku?”, unesite svoj email i poslat ćemo vam poveznicu za postavljanje nove lozinke (vrijedi 30 minuta).'
		},
		{
			q: 'Kako dodati novog administratora?',
			a: 'Administracija → dodajte člana s emailom i ulogom. Pozvana osoba dobiva e-poštu s poveznicom (vrijedi 72 sata) na kojoj postavlja svoju lozinku i aktivira račun.'
		},
		{
			q: 'Što znače žute točkice u izborniku?',
			a: 'Žuta točkica pokraj sekcije znači da u njoj ima nešto novo što još niste pregledali. Nestane kad otvorite tu sekciju. Svaki administrator ima svoje oznake.'
		},
		{
			q: 'Kako promijeniti redoslijed streličara?',
			a: 'Kod uređivanja streličara postoji polje „Redoslijed” — manji broj znači više na popisu unutar njegove skupine luka na javnoj stranici.'
		}
	];

	// Pre-filter from the search bar (?q=…); the search box below refines further. Sync
	// from the URL whenever the ?q param changes (e.g. arriving from the top-bar search),
	// then let the user edit freely.
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
	const filtered = $derived(
		query.trim()
			? FAQ.filter((f) => norm(f.q + ' ' + f.a).includes(norm(query.trim())))
			: FAQ
	);
</script>

<svelte:head><title>Pomoć · VSK</title></svelte:head>

<section class="help-section">
	<div class="mgmt-head display-f align-items-center gap-0-7">
		<InquiryIcon size={40} />
		<div>
			<h2 class="mgmt-title">Pomoć</h2>
			<p class="mgmt-sub">Česta pitanja i odgovori za rad u nadzornoj ploči.</p>
		</div>
	</div>

	<div class="help-search display-f align-items-center gap-0-5">
		<span class="help-search-ico display-f"><SearchIcon size={22} /></span>
		<input
			class="help-search-input w-full"
			type="search"
			placeholder="Pretražite pitanja…"
			bind:value={query}
			aria-label="Pretražite pitanja"
		/>
	</div>

	<div class="panel bg-white custom-scrollbar">
		{#if filtered.length === 0}
			<p class="help-empty">Nema pitanja koja odgovaraju pretrazi „{query}”.</p>
		{:else}
			<ul class="faq-list">
				{#each filtered as item (item.q)}
					<li class="faq-item">
						<h3 class="faq-q">{item.q}</h3>
						<p class="faq-a">{item.a}</p>
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
	$border: map.get(lib.$colors, 'seashell');

	.help-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
	}
	.mgmt-head {
		margin-bottom: 1.25rem;
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
	.help-search {
		margin-bottom: 1.25rem;
		max-width: 32rem;
		padding: 0.6rem 0.9rem;
		border: 1px solid #d7dee8;
		border-radius: 999px;
		background: #fff;
		color: #5b6577;
	}
	.help-search:focus-within {
		border-color: #187ff5;
	}
	.help-search-ico {
		flex: 0 0 auto;
		color: #5b6577;
	}
	.help-search-input {
		border: 0;
		outline: none;
		background: transparent;
		font-size: 0.98rem;
		font-family: inherit;
		color: $navy;
		min-width: 0;
	}
	.panel {
		border-radius: 14px;
		padding: 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}
	.faq-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.faq-item {
		padding: 1.15rem 0;
	}
	.faq-item + .faq-item {
		border-top: 1px solid $border;
	}
	.faq-item:first-child {
		padding-top: 0.25rem;
	}
	.faq-q {
		margin: 0 0 0.4rem;
		font-size: 1.05rem;
		font-weight: 700;
		color: $navy;
	}
	.faq-a {
		margin: 0;
		font-size: 0.98rem;
		line-height: 1.6;
		color: #3d4c66;
	}
	.help-empty {
		margin: 0;
		padding: 1.5rem 0;
		text-align: center;
		color: #9aa3b2;
		font-size: 0.95rem;
	}
</style>

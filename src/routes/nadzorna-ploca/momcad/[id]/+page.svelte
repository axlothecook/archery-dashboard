<script lang="ts">
	// Momčad → individual archer VIEW page (read-only). Opened by the eye icon in the
	// Svi streličari / Nacrti tables. Shows the full profile; the Uredi button (top
	// right) goes to the edit form. Data from GET /admin/archers/:id + the roster (to
	// resolve coach IDs to names).
	import {
		ROLE_LABEL,
		BOW_LABEL,
		GENDER_LABEL,
		STATUS_LABEL,
		PERF_SCOPE_LABEL,
		PERF_TYPE_LABEL,
		HIDDEN_SECTION_LABEL,
		type Role,
		type Bow,
		type Gender,
		type ArcherStatus,
		type PerformanceScope,
		type PerformanceType,
		type HiddenSection
	} from '$lib/archers';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';

	let { data } = $props();
	const a = $derived(data.archer);

	const fullName = $derived(`${a.firstName} ${a.lastName}`);
	const nameById = $derived(new Map(data.roster.map((r) => [r.id, r.name])));
	const coachNames = $derived(a.coachIds.map((id) => nameById.get(id) ?? id));

	function fmtDate(iso: string | null): string {
		if (!iso) return '—';
		const d = new Date(iso);
		return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}.`;
	}
	// Whole-year age from an ISO birthdate (or null).
	function ageFrom(iso: string | null): number | null {
		if (!iso) return null;
		const b = new Date(iso);
		const now = new Date();
		let age = now.getFullYear() - b.getFullYear();
		const m = now.getMonth() - b.getMonth();
		if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
		return age;
	}
	const age = $derived(ageFrom(a.birthDate));

	const rolesText = $derived(a.roles.map((r) => ROLE_LABEL[r as Role]).join(', ') || '—');
	const bowText = $derived(a.bowType.map((b) => BOW_LABEL[b as Bow]).join(', ') || '—');
	const catsText = $derived(a.competitionCategories.join(', ') || '—');
	const hiddenText = $derived(
		a.hiddenSections.map((s) => HIDDEN_SECTION_LABEL[s as HiddenSection] ?? s).join(', ') || '—'
	);
</script>

<svelte:head><title>{fullName} · VSK</title></svelte:head>

<section class="ar-section">
	<div class="mgmt-head display-f align-items-center justify-content-space-between">
		<div class="display-f align-items-center gap-0-7">
			<PersonIcon size={40} />
			<div>
				<h2 class="mgmt-title">{fullName}</h2>
				<p class="mgmt-sub">Profil streličara. Pregled svih podataka.</p>
			</div>
		</div>
		<a class="btn-edit cursor-pointer display-f align-items-center gap-0-4" href="/nadzorna-ploca/momcad/uredi/{a.id}">
			<EditIcon size={18} />
			Uredi
		</a>
	</div>

	<div class="panel bg-white">
		<div class="view-grid">
			<!-- LEFT: photos + identity + classification. -->
			<div class="col column-nowrap gap-1-5">
				<div class="photos display-f gap-1">
					<figure class="photo column-nowrap gap-0-3">
						<span class="photo-cap">Kartica</span>
						{#if a.cardPhotoUrl}
							<img class="photo-img" src={a.cardPhotoUrl} alt={a.cardPhotoAlt ?? ''} />
						{:else}
							<span class="photo-img photo-img--empty display-f align-items-center justify-content-center"><PersonIcon size={28} /></span>
						{/if}
					</figure>
					<figure class="photo column-nowrap gap-0-3">
						<span class="photo-cap">Profil</span>
						{#if a.profilePhotoUrl}
							<img class="photo-img" src={a.profilePhotoUrl} alt={a.profilePhotoAlt ?? ''} />
						{:else}
							<span class="photo-img photo-img--empty display-f align-items-center justify-content-center"><PersonIcon size={28} /></span>
						{/if}
					</figure>
				</div>

				<dl class="fields">
					<div class="field-row"><dt>Uloga</dt><dd>{rolesText}</dd></div>
					<div class="field-row"><dt>Luk</dt><dd>{bowText}</dd></div>
					<div class="field-row"><dt>Spol</dt><dd>{a.gender ? GENDER_LABEL[a.gender as Gender] : '—'}</dd></div>
					<div class="field-row"><dt>Kategorije</dt><dd>{catsText}</dd></div>
					<div class="field-row"><dt>Datum rođenja</dt><dd>{fmtDate(a.birthDate)}{age !== null ? ` (${age} g.)` : ''}</dd></div>
					<div class="field-row"><dt>World Archery ID</dt><dd>{a.worldArcheryId ?? '—'}</dd></div>
					<div class="field-row"><dt>Redoslijed</dt><dd>{a.order}</dd></div>
					<div class="field-row"><dt>Treneri</dt><dd>{coachNames.length ? coachNames.join(', ') : '—'}</dd></div>
					<div class="field-row"><dt>Skrivene sekcije</dt><dd>{hiddenText}</dd></div>
					<div class="field-row">
						<dt>Stanje</dt>
						<dd>
							{#if a.status === 'draft'}
								<span class="state state--draft">Nacrt</span>
							{:else if a.hidden}
								<span class="state state--hidden">Skriveno</span>
							{:else}
								<span class="state state--published">Objavljeno</span>
							{/if}
						</dd>
					</div>
				</dl>
			</div>

			<!-- RIGHT: bio + career stats + performance. -->
			<div class="col column-nowrap gap-1-5">
				<div class="block">
					<span class="block-label">Biografija</span>
					{#if a.bio}
						<p class="bio-text">{a.bio}</p>
					{:else}
						<p class="muted">Nema biografije.</p>
					{/if}
				</div>

				<div class="block">
					<span class="block-label">Statistika karijere</span>
					{#if a.careerStats.length}
						<div class="tbl-scroll custom-scrollbar">
							<table class="mini-tbl">
								<thead>
									<tr><th>Godina</th><th>Disciplina</th><th>Prosjek</th><th>Pobjede</th><th>Porazi</th><th>Najbolji</th></tr>
								</thead>
								<tbody>
									{#each a.careerStats as s (s.id)}
										<tr>
											<td>{s.year}.</td>
											<td>{s.discipline}</td>
											<td>{s.averageScore ?? '—'}</td>
											<td>{s.wins}</td>
											<td>{s.losses}</td>
											<td>{s.highestScore ?? '—'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="muted">Nema unesene statistike.</p>
					{/if}
				</div>

				<div class="block">
					<span class="block-label">Nastupi</span>
					{#if a.performance.length}
						<div class="tbl-scroll custom-scrollbar">
							<table class="mini-tbl">
								<thead>
									<tr><th>Datum</th><th>Natjecanje</th><th>Vrsta</th><th>Opseg</th><th>Kategorije</th><th>Plasman</th><th>Bodovi</th></tr>
								</thead>
								<tbody>
									{#each a.performance as p (p.id)}
										<tr>
											<td>{p.date}</td>
											<td>{p.name}</td>
											<td>{PERF_TYPE_LABEL[p.type as PerformanceType] ?? p.type}</td>
											<td>{PERF_SCOPE_LABEL[p.scope as PerformanceScope] ?? p.scope}</td>
											<td>{p.categories.join(', ') || '—'}</td>
											<td>{p.placing ?? '—'}</td>
											<td>{p.points ?? '—'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="muted">Nema unesenih nastupa.</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$border: map.get(lib.$colors, 'seashell');

	.ar-section {
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
	.btn-edit {
		padding: 0.5rem 0.9rem;
		border: 0;
		border-radius: 8px;
		background: $navy;
		color: #fff;
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
		text-decoration: none;
		white-space: nowrap;
	}
	.btn-edit:hover {
		background: #0c2350;
	}
	.panel {
		border-radius: 14px;
		padding: 1.5rem;
		box-shadow: 0 4px 18px rgba(16, 46, 102, 0.06);
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}
	.view-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem 2rem;
		align-items: start;
	}
	.col {
		min-width: 0;
	}
	.photos {
		flex-wrap: wrap;
	}
	.photo-cap {
		font-size: 0.8rem;
		font-weight: 600;
		color: #5b6577;
	}
	.photo-img {
		width: 9rem;
		height: 9rem;
		object-fit: cover;
		border-radius: 12px;
		background: #f7f8fa;
		border: 1px solid #e3e7ee;
	}
	.photo-img--empty {
		color: #9aa3b2;
	}
	.fields {
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}
	.field-row {
		display: grid;
		grid-template-columns: 11rem 1fr;
		gap: 0.5rem;
		font-size: 0.95rem;
	}
	.field-row dt {
		color: #9aa3b2;
	}
	.field-row dd {
		margin: 0;
		color: $navy;
		word-break: break-word;
	}
	.block-label {
		display: block;
		margin-bottom: 0.4rem;
		font-size: 0.85rem;
		font-weight: 700;
		color: #5b6577;
	}
	.bio-text {
		margin: 0;
		padding: 0.8rem 1rem;
		background: #f7f8fa;
		border-radius: 8px;
		color: $navy;
		font-size: 0.95rem;
		line-height: 1.55;
		white-space: pre-wrap;
	}
	.muted {
		margin: 0;
		color: #9aa3b2;
		font-size: 0.9rem;
	}
	.tbl-scroll {
		overflow-x: auto;
		border: 1px solid $border;
		border-radius: 8px;
	}
	.mini-tbl {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
	}
	.mini-tbl th {
		text-align: left;
		padding: 0.5rem 0.7rem;
		font-weight: 700;
		color: #1b1b1b;
		white-space: nowrap;
		border-bottom: 1px solid $border;
		background: #f7f8fa;
	}
	.mini-tbl td {
		padding: 0.5rem 0.7rem;
		color: $navy;
		white-space: nowrap;
		border-bottom: 1px solid #f3f5f8;
	}
	.mini-tbl tbody tr:last-child td {
		border-bottom: 0;
	}
	.state {
		display: inline-block;
		min-width: 6.5rem;
		text-align: center;
		padding: 0.4rem 0.4rem;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 600;
	}
	.state--published {
		background: #d4f3df;
		color: #10683a;
	}
	.state--hidden {
		background: #fdefc4;
		color: #7a5b00;
	}
	.state--draft {
		background: #fde7d8;
		color: #8a4b1e;
	}
	@media (max-width: 900px) {
		.view-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

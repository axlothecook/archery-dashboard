<script lang="ts">
	// Role avatar: a colour-tinted circle with the role letter (A = admin,
	// D = developer). Used in the Tim rows, the topbar user chip, and the profile
	// header — so it lives here as ONE component instead of duplicated markup + the
	// three colour classes. `color` picks the tint; `size`/`fontSize` (rem) let each
	// call scale the circle + letter (defaults match the Tim-row avatar).
	// TODO(adoption): swap the letter for a real uploaded image when available.
	import { roleLetter, type Member } from '$lib/team';

	// `color` is still accepted (callers pass member.color) but the circle is now tinted
	// by ROLE, not this rotating palette key — so it's optional and unused here.
	let {
		role,
		size = 2.6,
		fontSize = 1.35
	}: { color?: Member['color']; role: Member['role']; size?: number; fontSize?: number } = $props();
</script>

<span
	class="avatar avatar--role-{role} br-full"
	style="width:{size}rem; height:{size}rem; font-size:{fontSize}rem;"
>
	{roleLetter(role)}
</span>

<style>
	/* circle shape via utility (br-full = 50%). */
	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		flex: 0 0 auto;
	}
	/* Solid role circle with a black letter: admin = light blue, developer =
	   bright green. Keyed by ROLE (not the old rotating blue/purple/green palette) so
	   the circle colour tells you the person's role at a glance. */
	.avatar--role-admin {
		background: #bbd0ff;
		color: #000;
	}
	.avatar--role-developer {
		background: #1bc61b;
		color: #000;
	}
</style>

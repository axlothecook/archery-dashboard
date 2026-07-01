<script lang="ts">
	// Role avatar: a colour-tinted circle with the role letter (A = admin,
	// D = developer). Used in the Tim rows, the topbar user chip, and the profile
	// header — so it lives here as ONE component instead of duplicated markup + the
	// three colour classes. `color` picks the tint; `size`/`fontSize` (rem) let each
	// call scale the circle + letter (defaults match the Tim-row avatar).
	// TODO(adoption): swap the letter for a real uploaded image when available.
	import { roleLetter, type Member } from '$lib/team';

	let {
		color,
		role,
		size = 2.6,
		fontSize = 1.35
	}: { color: Member['color']; role: Member['role']; size?: number; fontSize?: number } = $props();
</script>

<span
	class="avatar avatar--{color} br-full"
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
	/* Light tinted circle with the role letter in a DARKER shade of the same hue. */
	.avatar--blue {
		background: #cfe0fb;
		color: #1657b8;
	}
	.avatar--purple {
		background: #e7defb;
		color: #6b3fc0;
	}
	.avatar--green {
		background: #d4f3df;
		color: #1c8a4b;
	}
</style>

<script lang="ts">
	import '@fontsource-variable/dm-sans';
	import '@fontsource-variable/fraunces';
	import favicon from '#lib/assets/favicon.svg';
	import brand from '#lib/brand.json';
	import { Theme } from 'bref-ui';
	import type { ThemeProps } from 'bref-ui/types';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	// brand.json is checked by check.mjs; JSON imports type hex values as plain strings.
	const palette = brand.palette as ThemeProps['palette'];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{brand.name}</title>
</svelte:head>

<Theme {palette}>
	{@render children()}
</Theme>

<style>
	/* Bref reads --font-text for body text and falls back to its system stack. */
	:global(:root) {
		--font-text: 'DM Sans Variable', var(--font-sans);
	}
	/* Bref doesn't style headings, so a display font is plain CSS. */
	:global(h1, h2, h3) {
		font-family: 'Fraunces Variable', Georgia, serif;
	}
</style>

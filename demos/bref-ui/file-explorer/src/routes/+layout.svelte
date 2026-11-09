<script lang="ts">
	import { Theme, ThemeModeToggle } from 'bref-ui';
	import favicon from '#lib/assets/favicon.svg';
	import { themeState } from '#lib/theme-mode.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Files · acme-web</title>
</svelte:head>

<Theme>
	<ThemeModeToggle mode={themeState.mode} />
	{@render children()}
</Theme>

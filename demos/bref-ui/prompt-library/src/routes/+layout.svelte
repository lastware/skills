<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { Theme } from 'bref-ui';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Prompt Library</title>
</svelte:head>

<Theme>
	{@render children()}
</Theme>

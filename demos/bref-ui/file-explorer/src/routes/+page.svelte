<script lang="ts">
	import { Button, Icon, Pill, Select, Surface, TextInput, TreeView } from 'bref-ui';
	import type { ThemeMode } from 'bref-ui/types';
	import {
		countFiles,
		findNode,
		formatDate,
		formatSize,
		iconFor,
		kindColor,
		kindLabel,
		lineCount,
		pathTo,
		toTreeItems,
		totalSize,
		workspace,
		type FsNode
	} from '#lib/files.js';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { themeState } from '#lib/theme-mode.svelte.js';
	import CodePreview from '#lib/preview/CodePreview.svelte';
	import MarkdownPreview from '#lib/preview/MarkdownPreview.svelte';
	import ImagePreview from '#lib/preview/ImagePreview.svelte';
	import TablePreview from '#lib/preview/TablePreview.svelte';
	import DocumentPreview from '#lib/preview/DocumentPreview.svelte';
	import FolderPreview from '#lib/preview/FolderPreview.svelte';

	let query = $state('');
	// Deep link: ?file=<path> opens that node; otherwise start on the README.
	const initial = page.url.searchParams.get('file');
	let selection = $state<string>(
		initial && findNode(initial) ? initial : 'acme-web/docs/README.md'
	);

	$effect(() => {
		const url = new URL(page.url.href);
		if (url.searchParams.get('file') === selection) return;
		url.searchParams.set('file', selection);
		replaceState(url, {});
	});
	let copied = $state(false);

	const tree = $derived(toTreeItems(workspace.children, query));
	const selected = $derived(findNode(selection));
	const crumbs = $derived(selected ? pathTo(selected.id) : [workspace]);
	const fileCount = countFiles(workspace);
	const workspaceSize = formatSize(totalSize(workspace));

	const themeItems = [
		{ id: 'auto', label: 'System', icon: { name: 'contrast' as const } },
		{ id: 'light', label: 'Light', icon: { name: 'light_mode' as const } },
		{ id: 'dark', label: 'Dark', icon: { name: 'dark_mode' as const } }
	];

	const open = (id: string) => (selection = id);

	const copyPath = async (node: FsNode) => {
		try {
			await navigator.clipboard.writeText(`/${node.id}`);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			copied = false;
		}
	};

	const details = (node: FsNode): [string, string][] => {
		const location = `/${node.id.split('/').slice(0, -1).join('/')}`;
		if (node.type === 'folder') {
			return [
				['Kind', 'Folder'],
				['Items', `${node.children.length} direct · ${countFiles(node)} files total`],
				['Total size', formatSize(totalSize(node))],
				['Location', node.id === workspace.id ? '/' : location],
				['Owner', node.owner],
				['Modified', formatDate(node.modified)]
			];
		}
		const rows: [string, string][] = [
			['Kind', kindLabel[node.kind]],
			['Size', `${formatSize(node.size)} (${node.size.toLocaleString('en-US')} bytes)`]
		];
		if (node.language) rows.push(['Language', node.language]);
		if (node.content && node.kind !== 'data') rows.push(['Lines', String(lineCount(node))]);
		if (node.kind === 'data' && node.content) rows.push(['Rows', String(lineCount(node) - 1)]);
		if (node.image) {
			const mp = (node.image.width * node.image.height) / 1_000_000;
			rows.push(['Dimensions', `${node.image.width} × ${node.image.height} px`]);
			rows.push(['Resolution', `${mp.toFixed(1)} MP`]);
			if (node.image.camera) rows.push(['Camera', node.image.camera]);
		}
		if (node.document) rows.push(['Pages', String(node.document.pages)]);
		rows.push(['Location', location], ['Owner', node.owner], ['Modified', formatDate(node.modified)]);
		return rows;
	};
</script>

<div class="app">
	<header class="topbar">
		<div class="brand">
			<span class="logo"><Icon name="folder_open" filled /></span>
			<div>
				<strong>Files</strong>
				<span>{workspace.name} · {fileCount} files · {workspaceSize}</span>
			</div>
		</div>
		<nav aria-label="Breadcrumb" class="crumbs">
			<ol>
				{#each crumbs as crumb, i (crumb.id)}
					<li>
						{#if i > 0}<span class="sep" aria-hidden="true"><Icon name="chevron_right" /></span>{/if}
						{#if i === crumbs.length - 1}
							<span aria-current="page">{crumb.name}</span>
						{:else}
							<button type="button" onclick={() => open(crumb.id)}>{crumb.name}</button>
						{/if}
					</li>
				{/each}
			</ol>
		</nav>
		<div class="theme">
			<label for="theme-mode">Theme</label>
			<Select
				id="theme-mode"
				size="small"
				placeholder="Theme"
				items={themeItems}
				value={themeState.mode}
				onChange={(v) => (themeState.mode = v as ThemeMode)}
			/>
		</div>
	</header>

	<div class="body">
		<aside aria-label="Folder tree">
			<Surface variant="soft" color="muted" spacing="small" height="fill" radius="medium">
				<label class="search">
					<span class="visually-hidden">Filter files</span>
					<TextInput
						bind:value={query}
						placeholder="Filter files…"
						icon={{ name: 'search' }}
						size="small"
						wide
					/>
				</label>
				<div class="tree-wrap">
					<Surface scroll height="fill" aria-label="Workspace files">
						{#if tree.length}
							{#key query}
								<TreeView items={tree} label="Workspace files" size="small" defaultExpanded bind:selection />
							{/key}
						{:else}
							<p class="no-match">No files match “{query}”.</p>
						{/if}
					</Surface>
				</div>
				<footer class="usage">
					<div class="usage-row">
						<span>Storage</span>
						<span>{workspaceSize} of 50 MB</span>
					</div>
					<div class="meter" aria-hidden="true">
						<span style:width={`${(totalSize(workspace) / (50 * 1024 * 1024)) * 100}%`}></span>
					</div>
				</footer>
			</Surface>
		</aside>

		<main>
			{#if selected}
				<Surface spacing="large" height="fill" radius="medium" shadow="small">
					<div class="preview-head">
						<span
							class="tile"
							style:--tile={`var(--color-${selected.type === 'folder' ? 'primary' : kindColor[selected.kind]})`}
						>
							<Icon name={iconFor(selected)} filled={selected.type === 'folder'} size="large" />
						</span>
						<div class="title">
							<h1>{selected.name}</h1>
							<div class="pills">
								{#if selected.type === 'folder'}
									<Pill label="Folder" size="small" variant="soft" color="primary" />
									{#if selected.description}<span class="desc">{selected.description}</span>{/if}
								{:else}
									<Pill
										label={kindLabel[selected.kind]}
										size="small"
										variant="soft"
										color={kindColor[selected.kind]}
									/>
									{#if selected.locked}
										<Pill label="Restricted" icon={{ name: 'lock' }} size="small" variant="soft" color="warning" />
									{/if}
									{#each selected.tags ?? [] as tag (tag)}
										<Pill label={tag} size="small" variant="neutral" color="muted" />
									{/each}
								{/if}
							</div>
						</div>
						<div class="actions">
							<Button
								label={copied ? 'Copied' : 'Copy path'}
								icon={{ name: copied ? 'check' : 'content_copy' }}
								size="small"
								variant="soft"
								color="foreground"
								onClick={() => copyPath(selected)}
							/>
							{#if selected.type === 'file'}
								<Button label="Download" icon={{ name: 'download' }} size="small" variant="filled" />
							{/if}
							<Button icon={{ name: 'share' }} aria-label="Share" size="small" variant="soft" color="foreground" />
						</div>
					</div>

					<div class="content">
						<section class="preview" aria-label="Preview">
							{#if selected.type === 'folder'}
								<FolderPreview folder={selected} onOpen={open} />
							{:else if selected.kind === 'markdown' && selected.content}
								<MarkdownPreview content={selected.content} />
							{:else if selected.kind === 'data' && selected.content}
								<TablePreview content={selected.content} />
							{:else if selected.image}
								<ImagePreview image={selected.image} name={selected.name} />
							{:else if selected.document}
								<DocumentPreview document={selected.document} name={selected.name} locked={selected.locked} />
							{:else if selected.content}
								<CodePreview content={selected.content} language={selected.language} />
							{/if}
						</section>

						<section class="meta" aria-labelledby="meta-title">
							<h2 id="meta-title">Details</h2>
							<dl>
								{#each details(selected) as [term, value] (term)}
									<div>
										<dt>{term}</dt>
										<dd>{value}</dd>
									</div>
								{/each}
							</dl>
						</section>
					</div>
				</Surface>
			{:else}
				<Surface spacing="large" height="fill" radius="medium" shadow="small">
					<div class="empty">
						<Icon name="draft" size="x-large" />
						<p>Select a file in the tree to preview it.</p>
					</div>
				</Surface>
			{/if}
		</main>
	</div>
</div>

<style>
	.app {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		height: 100dvh;
		padding: 0.75rem 1rem 1rem;
		gap: 0.75rem;
	}

	/* Top bar */
	.topbar {
		display: grid;
		grid-template-columns: 18rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 1rem;
		padding: 0 0.25rem;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}
	.brand div {
		display: grid;
		min-width: 0;
	}
	.brand strong {
		font-size: 1.0625rem;
	}
	.brand span:not(.logo) {
		font-size: 0.8125rem;
		color: var(--color-muted);
		white-space: nowrap;
	}
	.logo {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.625rem;
		background: var(--color-primary);
		color: var(--color-background);
		font-size: 1.25rem;
	}
	.crumbs ol {
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		gap: 0.125rem;
		list-style: none;
		min-width: 0;
		overflow: hidden;
		font-size: 0.875rem;
	}
	.crumbs li {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		white-space: nowrap;
	}
	.sep {
		color: var(--color-muted);
		display: inline-flex;
	}
	.crumbs button {
		padding: 0.25rem 0.5rem;
		border: 0;
		border-radius: 0.375rem;
		background: transparent;
		color: var(--color-muted);
		font: inherit;
		cursor: pointer;
	}
	.crumbs button:hover {
		background: color-mix(in srgb, var(--color-foreground) 6%, transparent);
		color: var(--color-foreground);
	}
	.crumbs button:focus-visible {
		outline: 2px solid var(--color-primary);
	}
	[aria-current='page'] {
		padding: 0.25rem 0.5rem;
		font-weight: 600;
	}
	.theme {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 12rem;
	}
	.theme label {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
	.theme :global(> div) {
		flex: 1;
	}

	/* Body */
	.body {
		display: grid;
		grid-template-columns: 18rem minmax(0, 1fr);
		gap: 1rem;
		min-height: 0;
	}
	aside,
	main {
		min-height: 0;
		min-width: 0;
	}
	.search {
		display: block;
	}
	.tree-wrap {
		flex: 1;
		min-height: 0;
	}
	.no-match {
		padding: 1rem 0.75rem;
		font-size: 0.875rem;
		color: var(--color-muted);
	}
	.usage {
		display: grid;
		gap: 0.375rem;
		padding: 0.5rem 0.5rem 0.25rem;
		border-top: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.usage-row {
		display: flex;
		justify-content: space-between;
	}
	.meter {
		height: 0.375rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-muted) 25%, transparent);
		overflow: hidden;
	}
	.meter span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--color-primary);
	}

	/* Preview */
	.preview-head {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
	}
	.tile {
		display: grid;
		place-items: center;
		flex: none;
		width: 3rem;
		height: 3rem;
		border-radius: 0.875rem;
		background: color-mix(in srgb, var(--tile) 14%, transparent);
		color: var(--tile);
		font-size: 1.5rem;
	}
	.title {
		display: grid;
		gap: 0.375rem;
		flex: 1;
		min-width: 0;
	}
	h1 {
		font-size: 1.375rem;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.pills {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
	}
	.pills :global(*) {
		white-space: nowrap;
		overflow-wrap: normal;
	}
	.desc {
		font-size: 0.875rem;
		color: var(--color-muted);
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		flex: none;
	}
	.content {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 17rem;
		gap: 1.5rem;
		flex: 1;
		min-height: 0;
	}
	.preview {
		min-height: 0;
		overflow: auto;
		padding-right: 0.25rem;
	}
	.meta {
		align-self: start;
		padding: 1rem 1.125rem;
		border-radius: 0.875rem;
		background: color-mix(in srgb, var(--color-foreground) 3%, var(--color-background));
		border: 1px solid color-mix(in srgb, var(--color-muted) 20%, transparent);
	}
	.meta h2 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-muted);
		margin-bottom: 0.75rem;
	}
	dl {
		display: grid;
		gap: 0.75rem;
	}
	dt {
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	dd {
		font-size: 0.875rem;
		overflow-wrap: anywhere;
	}
	.empty {
		display: grid;
		place-items: center;
		align-content: center;
		gap: 0.75rem;
		height: 100%;
		color: var(--color-muted);
	}
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	@media (max-width: 960px) {
		.content {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 720px) {
		.app {
			height: auto;
		}
		.topbar,
		.body {
			grid-template-columns: 1fr;
		}
		.tree-wrap {
			max-height: 22rem;
		}
	}
</style>

<script lang="ts">
	import {
		Button,
		Dialog,
		Icon,
		Pill,
		PillChoiceGroup,
		PillGroup,
		Select,
		Surface,
		TextArea,
		TextInput,
		TreeView
	} from 'bref-ui';
	import type { PillDataProps, TreeItemProps, TreeSectionProps } from 'bref-ui/types';
	import { models, prompts as seed, tags, type ModelId, type Prompt } from '#lib/data.js';

	const ALL = 'all';

	let prompts = $state<Prompt[]>(seed.map((p) => ({ ...p, tags: [...p.tags] })));
	let activeTag = $state<string>(ALL);
	let query = $state('');
	let modelFilter = $state<string>(ALL);

	// Dialog draft
	let dialogOpen = $state(false);
	let editingId = $state<string | null>(null);
	let draftTitle = $state('');
	let draftDescription = $state('');
	let draftBody = $state('');
	let draftModel = $state<string>('claude-sonnet');
	let draftTags = $state<string[]>([]);

	const modelLabel = (id: ModelId) => models.find((m) => m.id === id)?.label ?? id;
	const tagLabel = (id: string) => tags.find((t) => t.id === id)?.label ?? id;

	const dateFormat = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
	const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T12:00:00`));
	const numberFormat = new Intl.NumberFormat('en-US');

	const tagCount = (id: string) => prompts.filter((p) => p.tags.includes(id)).length;

	const libraryItems: TreeItemProps[] = $derived([
		{ id: ALL, label: `All prompts (${prompts.length})`, icon: { name: 'library_books' } }
	]);

	const tagSections: TreeSectionProps[] = $derived([
		{
			id: 'tags',
			label: 'Tags',
			icon: { name: 'sell' },
			items: tags.map((t) => ({
				id: t.id,
				label: `${t.label} (${tagCount(t.id)})`,
				icon: { name: t.icon }
			}))
		}
	]);

	const modelOptions = [{ id: ALL, label: 'All models' }, ...models];
	const tagChoices: PillDataProps[] = tags.map((t) => ({ id: t.id, label: t.label }));

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return prompts
			.filter((p) => activeTag === ALL || p.tags.includes(activeTag))
			.filter((p) => modelFilter === ALL || p.model === modelFilter)
			.filter(
				(p) =>
					!q ||
					p.title.toLowerCase().includes(q) ||
					p.description.toLowerCase().includes(q) ||
					p.body.toLowerCase().includes(q) ||
					p.tags.some((t) => tagLabel(t).toLowerCase().includes(q))
			)
			.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	});

	const totalUses = $derived(prompts.reduce((sum, p) => sum + p.uses, 0));
	const contributors = $derived(new Set(prompts.map((p) => p.author)).size);
	const lastEdit = $derived(
		formatDate(prompts.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), ''))
	);

	const heading = $derived(activeTag === ALL ? 'All prompts' : tagLabel(activeTag));

	function openEditor(prompt?: Prompt) {
		editingId = prompt?.id ?? null;
		draftTitle = prompt?.title ?? '';
		draftDescription = prompt?.description ?? '';
		draftBody = prompt?.body ?? '';
		draftModel = prompt?.model ?? 'claude-sonnet';
		draftTags = prompt ? [...prompt.tags] : activeTag === ALL ? [] : [activeTag];
		dialogOpen = true;
	}

	function save() {
		const title = draftTitle.trim();
		if (!title) return;
		const today = new Date().toISOString().slice(0, 10);
		const fields = {
			title,
			description: draftDescription.trim(),
			body: draftBody,
			model: draftModel as ModelId,
			tags: [...draftTags],
			updatedAt: today
		};
		if (editingId) {
			prompts = prompts.map((p) => (p.id === editingId ? { ...p, ...fields } : p));
		} else {
			prompts = [
				{ id: `p-${Date.now()}`, author: 'You', uses: 0, ...fields },
				...prompts
			];
		}
		dialogOpen = false;
	}

	function clearFilters() {
		query = '';
		activeTag = ALL;
		modelFilter = ALL;
	}
</script>

<div class="shell">
	<nav aria-label="Prompt library navigation">
		<Surface orientation="vertical" spacing="medium" height="fill" variant="soft" radius="large">
			<div class="brand">
				<Icon name="auto_awesome" color="primary" />
				<span>Promptbook</span>
			</div>
			<TreeView label="Filter prompts by tag" items={libraryItems} sections={tagSections} bind:selection={activeTag} />
			<div class="spacer"></div>
			<dl class="stats">
				<div><dt>Prompts</dt><dd>{prompts.length}</dd></div>
				<div><dt>Total uses</dt><dd>{numberFormat.format(totalUses)}</dd></div>
				<div><dt>Contributors</dt><dd>{contributors}</dd></div>
				<div><dt>Last edit</dt><dd>{lastEdit}</dd></div>
			</dl>
		</Surface>
	</nav>

	<main>
		<header>
			<div class="title">
				<h1>{heading}</h1>
				<p>
					{filtered.length} of {prompts.length} prompts
					{#if query.trim()}matching “{query.trim()}”{/if}
				</p>
			</div>
			<Button label="New prompt" icon={{ name: 'add' }} variant="filled" onClick={() => openEditor()} />
		</header>

		<div class="toolbar">
			<label class="search">
				<span class="sr-only">Search prompts</span>
				<TextInput
					bind:value={query}
					placeholder="Search titles, text and tags…"
					icon={{ name: 'search' }}
					wide
				/>
			</label>
			<div class="model-filter">
				<label for="model-filter">Model</label>
				<Select id="model-filter" items={modelOptions} bind:value={modelFilter} placeholder="All models" />
			</div>
		</div>

		{#if filtered.length}
			<ul class="grid">
				{#each filtered as prompt (prompt.id)}
					<li>
						<Surface
							as="section"
							orientation="vertical"
							spacing="medium"
							radius="large"
							height="fill"
							shadow="small"
							hover="small"
							aria-label={prompt.title}
						>
							<div class="card-top">
								<h2>{prompt.title}</h2>
								<Button
									icon={{ name: 'edit' }}
									aria-label={`Edit ${prompt.title}`}
									size="small"
									variant="soft"
									onClick={() => openEditor(prompt)}
								/>
							</div>
							<p class="desc">{prompt.description}</p>
							<div class="body"><p>{prompt.body.replace(/\s+/g, ' ')}</p></div>
							<div class="spacer"></div>
							<PillGroup
								items={prompt.tags.map((t) => ({ id: t, label: tagLabel(t) }))}
								size="small"
								variant="soft"
							/>
							<div class="meta">
								<Pill label={modelLabel(prompt.model)} icon={{ name: 'smart_toy' }} size="small" color="primary" variant="soft" />
								<span><Icon name="schedule" size="small" /> {formatDate(prompt.updatedAt)}</span>
								<span class="uses">{numberFormat.format(prompt.uses)} uses</span>
							</div>
						</Surface>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="empty">
				<Surface orientation="vertical" spacing="large" radius="large" variant="soft">
					<Icon name="search" size="large" color="muted" />
					<p>No prompts match these filters.</p>
					<Button label="Clear filters" variant="soft" onClick={clearFilters} />
				</Surface>
			</div>
		{/if}
	</main>
</div>

<Dialog
	bind:open={dialogOpen}
	size="large"
	header={{
		title: editingId ? 'Edit prompt' : 'New prompt',
		description: editingId ? 'Changes are saved back to the library.' : 'Add a prompt to the library.',
		icon: { name: editingId ? 'edit' : 'add' }
	}}
	footer={{
		primary: { label: 'Save prompt', icon: { name: 'check' }, onClick: save, disabled: !draftTitle.trim() },
		secondary: { label: 'Cancel', onClick: () => (dialogOpen = false) }
	}}
>
	<div class="form">
		<label class="field">
			<span>Title</span>
			<TextInput bind:value={draftTitle} placeholder="e.g. Code review assistant" wide />
		</label>
		<label class="field">
			<span>Description</span>
			<TextInput bind:value={draftDescription} placeholder="One line on what this prompt does" wide />
		</label>
		<div class="field">
			<label for="draft-model">Model</label>
			<Select id="draft-model" items={models} bind:value={draftModel} placeholder="Choose a model" />
		</div>
		<div class="field">
			<span id="draft-tags-label">Tags</span>
			<PillChoiceGroup
				aria-labelledby="draft-tags-label"
				items={tagChoices}
				bind:selection={draftTags}
				size="small"
			/>
		</div>
		<label class="field">
			<span>Prompt</span>
			<TextArea bind:value={draftBody} rows={8} placeholder="Write the prompt. Use {'{{variables}}'} for inputs." wide />
		</label>
	</div>
</Dialog>

<style>
	.shell {
		display: grid;
		grid-template-columns: 17rem minmax(0, 1fr);
		gap: 1.5rem;
		min-height: 100vh;
		padding: 1.5rem;
		box-sizing: border-box;
		color: var(--color-foreground);
		background: var(--color-background);
	}
	nav {
		position: sticky;
		top: 1.5rem;
		height: calc(100vh - 3rem);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		font-size: 1.125rem;
		padding: 0.25rem 0.25rem 0.5rem;
	}
	main {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		min-width: 0;
	}
	header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
	}
	h1 {
		margin: 0;
		font-size: 1.75rem;
		line-height: 1.2;
	}
	.title p {
		margin: 0.25rem 0 0;
		color: var(--color-muted);
	}
	.toolbar {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.search {
		flex: 1;
		min-width: 0;
	}
	.model-filter {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
		min-width: 14rem;
	}
	.model-filter label {
		color: var(--color-muted);
		font-size: 0.875rem;
	}
	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
		gap: 1rem;
	}
	.grid li {
		min-width: 0;
	}
	.card-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}
	h2 {
		margin: 0;
		font-size: 1.0625rem;
		line-height: 1.3;
	}
	.desc {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.9rem;
	}
	.body {
		margin: 0;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: color-mix(in srgb, var(--color-muted) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-muted) 20%, transparent);
		font-size: 0.8rem;
		line-height: 1.45;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}
	.body p {
		margin: 0;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
	}
	.spacer {
		flex: 1;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.8rem;
		color: var(--color-muted);
		padding-top: 0.75rem;
		border-top: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
	}
	.meta :global(*) {
		white-space: nowrap;
		overflow-wrap: normal;
	}
	.meta span {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.uses {
		margin-left: auto;
	}
	.stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin: 0;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--color-muted) 10%, transparent);
	}
	.stats dt {
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.stats dd {
		margin: 0.125rem 0 0;
		font-weight: 700;
		font-size: 1.05rem;
		white-space: nowrap;
	}
	.empty {
		display: grid;
		place-items: center;
		padding: 4rem 0;
		text-align: center;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.field > span,
	.field > label {
		font-size: 0.875rem;
		font-weight: 600;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	@media (max-width: 52rem) {
		.shell {
			grid-template-columns: 1fr;
		}
		nav {
			position: static;
			height: auto;
		}
		.toolbar {
			flex-wrap: wrap;
		}
	}
</style>

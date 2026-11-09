<script lang="ts">
	import { Icon, surface } from 'bref-ui';
	import {
		countFiles,
		formatSize,
		iconFor,
		kindColor,
		totalSize,
		type FolderNode
	} from '#lib/files.js';

	let { folder, onOpen }: { folder: FolderNode; onOpen: (id: string) => void } = $props();
</script>

<ul>
	{#each folder.children as child (child.id)}
		<li>
			<button
				type="button"
				class={surface({ variant: 'soft', color: 'muted', hover: 'small' })}
				onclick={() => onOpen(child.id)}
			>
				<span class="icon">
					<Icon
						name={iconFor(child)}
						filled={child.type === 'folder'}
						size="large"
						color={child.type === 'folder' ? 'primary' : kindColor[child.kind]}
					/>
				</span>
				<span class="name">{child.name}</span>
				<span class="meta">
					{child.type === 'folder'
						? `${countFiles(child)} files · ${formatSize(totalSize(child))}`
						: formatSize(child.size)}
				</span>
			</button>
		</li>
	{/each}
</ul>

<style>
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: 0.75rem;
		list-style: none;
	}
	button {
		display: grid;
		gap: 0.25rem;
		width: 100%;
		padding: 1rem;
		border: 0;
		border-radius: 0.875rem;
		text-align: left;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
	.icon {
		display: flex;
		margin-bottom: 0.25rem;
	}
	.name {
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.meta {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
</style>

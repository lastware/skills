<script lang="ts">
	type Inline = { kind: 'text' | 'code' | 'strong'; text: string };
	type Block =
		| { kind: 'h1' | 'h2' | 'h3' | 'p'; inline: Inline[] }
		| { kind: 'ul'; items: Inline[][] }
		| { kind: 'pre'; text: string };

	let { content }: { content: string } = $props();

	const inline = (text: string): Inline[] =>
		text
			.split(/(`[^`]+`|\*\*[^*]+\*\*)/)
			.filter(Boolean)
			.map((part) =>
				part.startsWith('`')
					? { kind: 'code', text: part.slice(1, -1) }
					: part.startsWith('**')
						? { kind: 'strong', text: part.slice(2, -2) }
						: { kind: 'text', text: part }
			);

	const parse = (source: string): Block[] => {
		const blocks: Block[] = [];
		const lines = source.split('\n');
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line.startsWith('```')) {
				const body: string[] = [];
				while (++i < lines.length && !lines[i].startsWith('```')) body.push(lines[i]);
				blocks.push({ kind: 'pre', text: body.join('\n') });
			} else if (line.startsWith('- ')) {
				const items: Inline[][] = [];
				while (i < lines.length && lines[i].startsWith('- ')) items.push(inline(lines[i++].slice(2)));
				i--;
				blocks.push({ kind: 'ul', items });
			} else {
				const heading = /^(#{1,3})\s+(.*)$/.exec(line);
				if (heading) {
					const level = heading[1].length as 1 | 2 | 3;
					blocks.push({ kind: `h${level}`, inline: inline(heading[2]) });
				} else if (line.trim()) blocks.push({ kind: 'p', inline: inline(line) });
			}
		}
		return blocks;
	};

	const blocks = $derived(parse(content));
</script>

{#snippet text(parts: Inline[])}
	{#each parts as part, i (i)}
		{#if part.kind === 'code'}<code>{part.text}</code>{:else if part.kind === 'strong'}<strong
				>{part.text}</strong
			>{:else}{part.text}{/if}
	{/each}
{/snippet}

<article>
	{#each blocks as block, i (i)}
		{#if block.kind === 'h1'}<h1>{@render text(block.inline)}</h1>
		{:else if block.kind === 'h2'}<h2>{@render text(block.inline)}</h2>
		{:else if block.kind === 'h3'}<h3>{@render text(block.inline)}</h3>
		{:else if block.kind === 'p'}<p>{@render text(block.inline)}</p>
		{:else if block.kind === 'ul'}
			<ul>
				{#each block.items as item, j (j)}<li>{@render text(item)}</li>{/each}
			</ul>
		{:else if block.kind === 'pre'}<pre>{block.text}</pre>{/if}
	{/each}
</article>

<style>
	article {
		max-width: 44rem;
		line-height: 1.65;
		font-size: 0.9375rem;
	}
	h1 {
		font-size: 1.75rem;
		line-height: 1.2;
		margin-bottom: 0.75rem;
		letter-spacing: -0.01em;
	}
	h2 {
		font-size: 1.125rem;
		margin: 1.5rem 0 0.5rem;
		padding-bottom: 0.375rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
	}
	h3 {
		font-size: 1rem;
		margin: 1.25rem 0 0.5rem;
	}
	p {
		margin-bottom: 0.75rem;
	}
	ul {
		padding-left: 1.25rem;
		margin-bottom: 0.75rem;
	}
	li {
		margin-bottom: 0.25rem;
	}
	code,
	pre {
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.85em;
	}
	code {
		padding: 0.1rem 0.35rem;
		border-radius: 0.3rem;
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		color: var(--color-primary);
	}
	pre {
		margin-bottom: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: 0.6rem;
		background: color-mix(in srgb, var(--color-foreground) 5%, var(--color-background));
		overflow-x: auto;
	}
</style>

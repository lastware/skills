<script lang="ts">
	type TokenKind = 'comment' | 'string' | 'keyword' | 'number' | 'tag' | 'plain';
	interface Token {
		kind: TokenKind;
		text: string;
	}

	let { content, language }: { content: string; language?: string } = $props();

	const pattern =
		/(\/\/.*$|^\s*#.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(import|from|export|const|let|async|function|await|return|if|throw|new|interface|type|true|false|then)\b|\b(\d[\d_.]*)\b|(<\/?[a-z][\w-]*|\{[#/:][a-z]+)/g;
	const kinds: TokenKind[] = ['comment', 'string', 'keyword', 'number', 'tag'];

	const tokenize = (line: string): Token[] => {
		const tokens: Token[] = [];
		let last = 0;
		for (const match of line.matchAll(pattern)) {
			const start = match.index ?? 0;
			if (start > last) tokens.push({ kind: 'plain', text: line.slice(last, start) });
			const group = match.slice(1).findIndex((g) => g !== undefined);
			tokens.push({ kind: kinds[group] ?? 'plain', text: match[0] });
			last = start + match[0].length;
		}
		if (last < line.length) tokens.push({ kind: 'plain', text: line.slice(last) });
		return tokens;
	};

	const lines = $derived(content.split('\n').map(tokenize));
</script>

<figure aria-label={language ? `${language} source` : 'Source'}>
	<pre><code
			>{#each lines as tokens, i (i)}<span class="line"><span class="n" aria-hidden="true"
						>{i + 1}</span
					>{#each tokens as token, j (j)}<span class={token.kind}>{token.text}</span
						>{/each}{'\n'}</span
				>{/each}</code
		></pre>
</figure>

<style>
	figure {
		margin: 0;
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--color-foreground) 4%, var(--color-background));
		border: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
		overflow: auto;
	}
	pre {
		padding: 1rem 0;
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.8125rem;
		line-height: 1.7;
		tab-size: 2;
	}
	.line {
		display: block;
		padding-right: 1.25rem;
	}
	.n {
		display: inline-block;
		width: 3rem;
		padding-right: 1rem;
		text-align: right;
		color: color-mix(in srgb, var(--color-muted) 70%, transparent);
		user-select: none;
	}
	.comment {
		color: var(--color-muted);
		font-style: italic;
	}
	.string {
		color: var(--color-success);
	}
	.keyword {
		color: var(--color-primary);
		font-weight: 600;
	}
	.number {
		color: var(--color-warning);
	}
	.tag {
		color: var(--color-secondary);
	}
</style>

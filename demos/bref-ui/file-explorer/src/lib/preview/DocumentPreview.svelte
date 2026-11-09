<script lang="ts">
	import { Icon } from 'bref-ui';
	import type { DocumentMeta } from '#lib/files.js';

	let { document, name, locked }: { document: DocumentMeta; name: string; locked?: boolean } =
		$props();
</script>

<div class="stage">
	<div class="page" aria-label={`First page of ${name}`} role="img">
		<span class="kicker">Board update</span>
		<strong>{name.replace(/\.pdf$/, '').replaceAll('-', ' ')}</strong>
		{#each [92, 100, 86, 97, 64] as w, i (i)}<span class="bar" style:width={`${w}%`}></span>{/each}
		<div class="chart" aria-hidden="true">
			{#each [40, 55, 48, 70, 82, 90] as h, i (i)}<span style:height={`${h}%`}></span>{/each}
		</div>
		{#each [100, 94, 72] as w, i (i)}<span class="bar" style:width={`${w}%`}></span>{/each}
		<span class="folio">1 / {document.pages}</span>
	</div>
	<div class="aside">
		<span class="label">Summary</span>
		<p>{document.summary}</p>
		{#if locked}
			<p class="lock"><Icon name="lock" /> Restricted to the leadership group. Download is logged.</p>
		{/if}
	</div>
</div>

<style>
	.stage {
		display: grid;
		grid-template-columns: minmax(12rem, 17rem) minmax(0, 1fr);
		gap: 1.5rem;
		align-items: start;
	}
	.page {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		aspect-ratio: 1 / 1.414;
		padding: 1.5rem 1.25rem;
		border-radius: 0.375rem;
		background: color-mix(in srgb, var(--color-foreground) 3%, var(--color-background));
		border: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
		color: var(--color-foreground);
		box-shadow:
			0 1px 2px color-mix(in srgb, var(--color-foreground) 12%, transparent),
			0 12px 28px -12px color-mix(in srgb, var(--color-foreground) 30%, transparent);
		font-size: 0.75rem;
		position: relative;
	}
	.kicker {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-error);
		font-weight: 600;
	}
	strong {
		font-size: 1rem;
		text-transform: capitalize;
		margin-bottom: 0.5rem;
	}
	.bar {
		display: block;
		height: 0.375rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-muted) 30%, transparent);
	}
	.chart {
		display: flex;
		align-items: flex-end;
		gap: 0.375rem;
		height: 5rem;
		margin: 0.5rem 0;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 30%, transparent);
	}
	.chart span {
		flex: 1;
		border-radius: 0.2rem 0.2rem 0 0;
		background: color-mix(in srgb, var(--color-primary) 70%, transparent);
	}
	.folio {
		position: absolute;
		bottom: 0.75rem;
		right: 1rem;
		font-size: 0.625rem;
		color: var(--color-muted);
	}
	.aside {
		display: grid;
		gap: 0.5rem;
	}
	.label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}
	p {
		line-height: 1.6;
	}
	.lock {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		padding: 0.625rem 0.75rem;
		border-radius: 0.6rem;
		background: color-mix(in srgb, var(--color-warning) 12%, transparent);
		color: var(--color-warning);
		font-size: 0.875rem;
	}
	@media (max-width: 720px) {
		.stage {
			grid-template-columns: 1fr;
		}
	}
</style>

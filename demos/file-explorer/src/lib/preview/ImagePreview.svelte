<script lang="ts">
	import { Icon } from 'bref-ui';
	import type { ImageMeta } from '#lib/files.js';

	let { image, name }: { image: ImageMeta; name: string } = $props();

	const gradient = $derived(
		`linear-gradient(135deg, ${image.swatches
			.map(
				(c, i) =>
					`color-mix(in srgb, var(--color-${c}) ${i === 0 ? 70 : 45}%, var(--color-background)) ${Math.round((i / Math.max(image.swatches.length - 1, 1)) * 100)}%`
			)
			.join(', ')})`
	);
	const ratio = $derived(`${image.width} / ${image.height}`);
	const orientation = $derived(
		image.width === image.height ? 'Square' : image.width > image.height ? 'Landscape' : 'Portrait'
	);
</script>

<figure>
	<div class="canvas" style:background={gradient} style:aspect-ratio={ratio} role="img" aria-label={image.alt}>
		<span class="glyph"><Icon name="image" size="x-large" /></span>
		<span class="dims">{image.width} × {image.height}</span>
	</div>
	<figcaption>
		<span class="label">Alt text</span>
		<p>{image.alt}</p>
		<div class="swatches" aria-label="Dominant tones">
			{#each image.swatches as swatch (swatch)}
				<span class="swatch" style:background={`var(--color-${swatch})`} title={swatch}></span>
			{/each}
			<span class="hint">{orientation} · dominant tones of {name}</span>
		</div>
	</figcaption>
</figure>

<style>
	figure {
		display: grid;
		gap: 1rem;
		margin: 0;
	}
	.canvas {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		max-height: 26rem;
		margin-inline: auto;
		border-radius: 0.875rem;
		border: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
		overflow: hidden;
	}
	.glyph {
		display: grid;
		place-items: center;
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-background) 70%, transparent);
		color: var(--color-foreground);
		font-size: 1.5rem;
	}
	.dims {
		position: absolute;
		right: 0.75rem;
		bottom: 0.75rem;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-background) 80%, transparent);
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}
	figcaption {
		display: grid;
		gap: 0.375rem;
	}
	.label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}
	p {
		line-height: 1.55;
	}
	.swatches {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}
	.swatch {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		border: 1px solid color-mix(in srgb, var(--color-foreground) 15%, transparent);
	}
	.hint {
		margin-left: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
</style>

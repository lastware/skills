<script lang="ts">
	import { Icon, Progress, Surface } from 'bref-ui';
	import type { Kpi } from '../data.js';

	let { kpi }: { kpi: Kpi } = $props();

	const good = $derived(kpi.higherIsBetter ? kpi.delta >= 0 : kpi.delta <= 0);
	const deltaText = $derived(`${kpi.delta > 0 ? '+' : ''}${kpi.delta.toFixed(1)}%`);
</script>

<Surface as="section" variant="soft" spacing="medium" radius="medium" shadow="small" aria-label={kpi.label}>
	<div class="top">
		<span class="label">{kpi.label}</span>
		<Icon name={kpi.icon} color="primary" size="large" />
	</div>
	<p class="value">{kpi.value}</p>
	<p class="delta" class:good class:bad={!good}>
		<Icon name={kpi.delta >= 0 ? 'trending_up' : 'trending_down'} size="small" />
		{deltaText} <span class="muted">vs last week</span>
	</p>
	{#if kpi.progress !== undefined}
		<Progress value={kpi.progress} label={kpi.progressLabel} size="small" />
		<span class="muted small">{kpi.progressLabel}</span>
	{/if}
</Surface>

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.label {
		color: var(--color-muted);
		font-size: 0.875rem;
	}
	.value {
		margin: 0;
		font-size: 2rem;
		font-weight: 650;
		line-height: 1.1;
		color: var(--color-foreground);
		font-variant-numeric: tabular-nums;
	}
	.delta {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
	}
	.good {
		color: var(--color-success);
	}
	.bad {
		color: var(--color-error);
	}
	.muted {
		color: var(--color-muted);
	}
	.small {
		font-size: 0.75rem;
	}
</style>

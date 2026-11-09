<script lang="ts">
	let { content }: { content: string } = $props();

	const rows = $derived(content.trim().split('\n').map((line) => line.split(',')));
	const header = $derived(rows[0] ?? []);
	const body = $derived(rows.slice(1));
	const numeric = (value: string) => value !== '' && !Number.isNaN(Number(value));
	const numericColumns = $derived(header.map((_, c) => body.every((row) => numeric(row[c] ?? ''))));
</script>

<div class="wrap">
	<table>
		<caption>{body.length} rows · {header.length} columns</caption>
		<thead>
			<tr>{#each header as cell, i (i)}<th scope="col" class:num={numericColumns[i]}>{cell}</th>{/each}</tr>
		</thead>
		<tbody>
			{#each body as row, r (r)}
				<tr>
					{#each row as cell, c (c)}
						<td class:num={numericColumns[c]}>{cell}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.wrap {
		overflow-x: auto;
		border-radius: 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}
	caption {
		caption-side: bottom;
		padding: 0.625rem 1rem;
		text-align: left;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
	th,
	td {
		padding: 0.625rem 1rem;
		text-align: left;
		white-space: nowrap;
		border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 18%, transparent);
	}
	th {
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-foreground) 4%, var(--color-background));
	}
	th.num,
	td.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	tbody tr:hover {
		background: color-mix(in srgb, var(--color-primary) 6%, transparent);
	}
</style>

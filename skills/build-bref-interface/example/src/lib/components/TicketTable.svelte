<script lang="ts">
	import { Button, Checkbox, Icon, Pill, Surface } from 'bref-ui';
	import type { Color } from 'bref-ui/types';
	import {
		agents,
		channelLabels,
		priorityLabels,
		statusLabels,
		type Ticket,
		type TicketPriority,
		type TicketStatus
	} from '../data.js';

	let {
		tickets,
		selectedIds = $bindable([]),
		onOpen
	}: {
		tickets: Ticket[];
		selectedIds?: string[];
		onOpen: (ticket: Ticket) => void;
	} = $props();

	type PillColor = Exclude<Color, 'background'>;
	const statusColor: Record<TicketStatus, PillColor> = {
		open: 'info',
		pending: 'warning',
		resolved: 'success',
		closed: 'muted'
	};
	const priorityColor: Record<TicketPriority, PillColor> = {
		urgent: 'error',
		high: 'warning',
		medium: 'info',
		low: 'muted'
	};

	const agentName = (id: string | null) =>
		id ? (agents.find((a) => a.id === id)?.name ?? 'Unknown') : 'Unassigned';

	const formatUpdated = (iso: string) =>
		new Intl.DateTimeFormat('en', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'UTC'
		}).format(new Date(iso));

	const formatSla = (t: Ticket) => {
		if (t.status === 'resolved' || t.status === 'closed') return '—';
		if (t.slaHoursLeft < 0) return `Breached ${Math.abs(t.slaHoursLeft)}h ago`;
		return `${t.slaHoursLeft}h left`;
	};

	const allSelected = $derived(
		tickets.length > 0 && tickets.every((t) => selectedIds.includes(t.id))
	);
	const someSelected = $derived(!allSelected && tickets.some((t) => selectedIds.includes(t.id)));

	function toggleAll() {
		selectedIds = allSelected ? [] : tickets.map((t) => t.id);
	}

	function toggle(id: string) {
		selectedIds = selectedIds.includes(id)
			? selectedIds.filter((s) => s !== id)
			: [...selectedIds, id];
	}
</script>

<Surface variant="neutral" radius="medium" scroll aria-label="Tickets table" tabindex={0}>
	{#if tickets.length === 0}
		<div class="empty">
			<Icon name="inbox" size="x-large" color="muted" />
			<p>No tickets match these filters.</p>
		</div>
	{:else}
		<table>
			<thead>
				<tr>
					<th class="select">
						<Checkbox
							checked={allSelected}
							indeterminate={someSelected}
							onchange={toggleAll}
							aria-label="Select all visible tickets"
						/>
					</th>
					<th scope="col">Ticket</th>
					<th scope="col">Customer</th>
					<th scope="col">Status</th>
					<th scope="col">Priority</th>
					<th scope="col">Assignee</th>
					<th scope="col">SLA</th>
					<th scope="col">Updated</th>
					<th scope="col"><span class="visually-hidden">Actions</span></th>
				</tr>
			</thead>
			<tbody>
				{#each tickets as ticket (ticket.id)}
					<tr class:selected={selectedIds.includes(ticket.id)}>
						<td class="select">
							<Checkbox
								checked={selectedIds.includes(ticket.id)}
								onchange={() => toggle(ticket.id)}
								aria-label={`Select ${ticket.id}`}
							/>
						</td>
						<td>
							<div class="subject">{ticket.subject}</div>
							<div class="meta">{ticket.id} · {channelLabels[ticket.channel]}</div>
						</td>
						<td>
							<div>{ticket.customer}</div>
							<div class="meta">{ticket.email}</div>
						</td>
						<td class="nowrap">
							<Pill
								label={statusLabels[ticket.status]}
								color={statusColor[ticket.status]}
								variant="soft"
								size="small"
							/>
						</td>
						<td class="nowrap">
							<Pill
								label={priorityLabels[ticket.priority]}
								color={priorityColor[ticket.priority]}
								variant={ticket.priority === 'urgent' ? 'filled' : 'neutral'}
								size="small"
							/>
						</td>
						<td class:unassigned={!ticket.assigneeId}>{agentName(ticket.assigneeId)}</td>
						<td class:breached={ticket.slaHoursLeft < 0 && ticket.status !== 'resolved' && ticket.status !== 'closed'}>
							{formatSla(ticket)}
						</td>
						<td class="meta nowrap">{formatUpdated(ticket.updatedAt)}</td>
						<td>
							<Button
								icon={{ name: 'edit' }}
								size="small"
								variant="soft"
								aria-label={`Open ${ticket.id}`}
								onClick={() => onOpen(ticket)}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</Surface>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		color: var(--color-foreground);
	}
	th {
		text-align: left;
		font-weight: 600;
		color: var(--color-muted);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		position: sticky;
		top: 0;
		background: var(--color-background);
		z-index: 1;
	}
	th,
	td {
		padding: 0.625rem 0.75rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
		vertical-align: middle;
	}
	tbody tr:hover,
	tr.selected {
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	}
	.select {
		width: 2.5rem;
	}
	.subject {
		font-weight: 550;
	}
	.meta {
		color: var(--color-muted);
		font-size: 0.75rem;
	}
	.nowrap {
		white-space: nowrap;
	}
	/* Bref Pill uses overflow-wrap: anywhere, which lets auto-sized table columns
	   squeeze labels mid-word; keep pill labels whole inside cells. */
	.nowrap :global(*) {
		white-space: nowrap;
		overflow-wrap: normal;
	}
	.unassigned {
		color: var(--color-muted);
		font-style: italic;
	}
	.breached {
		color: var(--color-error);
		font-weight: 600;
	}
	.empty {
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		padding: 3rem 1rem;
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
</style>

<script lang="ts">
	import {
		Button,
		Combobox,
		Dialog,
		PillGroup,
		Select,
		Surface,
		Switch,
		Tabs,
		TextArea,
		TextInput
	} from 'bref-ui';
	import type { PillDataProps, TreeSectionProps } from 'bref-ui/types';
	import KpiCard from '#lib/components/KpiCard.svelte';
	import Sidebar from '#lib/components/Sidebar.svelte';
	import TicketTable from '#lib/components/TicketTable.svelte';
	import {
		CURRENT_AGENT_ID,
		agents,
		kpis,
		priorityLabels,
		statusLabels,
		teams,
		tickets as seedTickets,
		type Ticket,
		type TicketPriority,
		type TicketStatus
	} from '#lib/data.js';

	// ---- State -------------------------------------------------------------
	let tickets = $state<Ticket[]>(seedTickets.map((t) => ({ ...t, tags: [...t.tags] })));

	let queue = $state<string>('all');
	let status = $state<string>('all');
	let search = $state('');
	let priority = $state<string>('any');
	let assignee = $state<string | undefined>();
	let atRiskOnly = $state(false);
	let selectedIds = $state<string[]>([]);

	const currentAgent = agents.find((a) => a.id === CURRENT_AGENT_ID)!;

	// ---- Static option lists ----------------------------------------------
	const statusTabs = [
		{ id: 'all', label: 'All', icon: 'list_alt' },
		{ id: 'open', label: 'Open', icon: 'inbox' },
		{ id: 'pending', label: 'Pending', icon: 'hourglass_empty' },
		{ id: 'resolved', label: 'Resolved', icon: 'check_circle' },
		{ id: 'closed', label: 'Closed', icon: 'archive' }
	] as const;

	const priorityOptions = [
		{ id: 'any', label: 'Any priority' },
		...(Object.keys(priorityLabels) as TicketPriority[]).map((p) => ({
			id: p,
			label: priorityLabels[p]
		}))
	];

	const assigneeOptions = [
		{ id: 'unassigned', label: 'Unassigned', icon: { name: 'person_off' as const } },
		...agents.map((a) => ({ id: a.id, label: a.name }))
	];

	const statusOptions = (Object.keys(statusLabels) as TicketStatus[]).map((s) => ({
		id: s,
		label: statusLabels[s]
	}));
	const agentOptions = agents.map((a) => ({ id: a.id, label: a.name }));
	const teamOptions = teams.map((t) => ({ id: t.id, label: t.name }));

	// ---- Sidebar queues (counts are live) ---------------------------------
	const isActive = (t: Ticket) => t.status === 'open' || t.status === 'pending';
	const isBreached = (t: Ticket) => isActive(t) && t.slaHoursLeft < 0;

	const sections = $derived<TreeSectionProps[]>([
		{
			id: 'queues',
			label: 'Queues',
			items: [
				{ id: 'all', label: `All tickets (${tickets.length})`, icon: { name: 'inbox' } },
				{
					id: 'mine',
					label: `Assigned to me (${tickets.filter((t) => t.assigneeId === CURRENT_AGENT_ID && isActive(t)).length})`,
					icon: { name: 'person' }
				},
				{
					id: 'unassigned',
					label: `Unassigned (${tickets.filter((t) => !t.assigneeId && isActive(t)).length})`,
					icon: { name: 'person_off' }
				},
				{
					id: 'breached',
					label: `SLA breached (${tickets.filter(isBreached).length})`,
					icon: { name: 'priority_high' }
				}
			]
		},
		{
			id: 'teams',
			label: 'Teams',
			items: teams.map((team) => ({
				id: `team-${team.id}`,
				label: `${team.name} (${tickets.filter((t) => t.team === team.id && isActive(t)).length})`,
				icon: { name: 'group' }
			}))
		}
	]);

	// ---- Filtering ---------------------------------------------------------
	const filtered = $derived(
		tickets.filter((t) => {
			if (queue === 'mine' && t.assigneeId !== CURRENT_AGENT_ID) return false;
			if (queue === 'unassigned' && t.assigneeId) return false;
			if (queue === 'breached' && !isBreached(t)) return false;
			if (queue.startsWith('team-') && `team-${t.team}` !== queue) return false;
			if (status !== 'all' && t.status !== status) return false;
			if (priority !== 'any' && t.priority !== priority) return false;
			if (assignee === 'unassigned' && t.assigneeId) return false;
			if (assignee && assignee !== 'unassigned' && t.assigneeId !== assignee) return false;
			if (atRiskOnly && !(isActive(t) && t.slaHoursLeft < 4)) return false;
			const q = search.trim().toLowerCase();
			if (
				q &&
				![t.id, t.subject, t.customer, t.email, ...t.tags].some((f) => f.toLowerCase().includes(q))
			)
				return false;
			return true;
		})
	);

	// Drop selections that are no longer visible.
	const visibleSelected = $derived(selectedIds.filter((id) => filtered.some((t) => t.id === id)));

	const activeFilters = $derived.by<PillDataProps[]>(() => {
		const pills: PillDataProps[] = [];
		if (search.trim()) pills.push({ id: 'search', label: `“${search.trim()}”`, icon: { name: 'search' } });
		if (priority !== 'any')
			pills.push({ id: 'priority', label: `Priority: ${priorityLabels[priority as TicketPriority]}` });
		if (assignee)
			pills.push({
				id: 'assignee',
				label: `Assignee: ${assigneeOptions.find((o) => o.id === assignee)?.label ?? assignee}`
			});
		if (atRiskOnly) pills.push({ id: 'risk', label: 'SLA at risk', icon: { name: 'timer' } });
		return pills;
	});

	function clearFilter(id: string) {
		if (id === 'search') search = '';
		if (id === 'priority') priority = 'any';
		if (id === 'assignee') assignee = undefined;
		if (id === 'risk') atRiskOnly = false;
	}

	function resetFilters() {
		queue = 'all';
		status = 'all';
		search = '';
		priority = 'any';
		assignee = undefined;
		atRiskOnly = false;
	}

	// ---- Ticket mutations --------------------------------------------------
	const now = () => new Date().toISOString();

	function updateTickets(ids: string[], patch: Partial<Ticket>) {
		tickets = tickets.map((t) => (ids.includes(t.id) ? { ...t, ...patch, updatedAt: now() } : t));
	}

	function bulkAssignToMe() {
		updateTickets(visibleSelected, { assigneeId: CURRENT_AGENT_ID });
		selectedIds = [];
	}

	function bulkResolve() {
		updateTickets(visibleSelected, { status: 'resolved' });
		selectedIds = [];
	}

	// ---- Ticket detail dialog ----------------------------------------------
	let detailOpen = $state(false);
	let editing = $state<Ticket | null>(null);
	let editStatus = $state<string>('open');
	let editAssignee = $state<string>('');
	let reply = $state('');

	function openTicket(ticket: Ticket) {
		editing = ticket;
		editStatus = ticket.status;
		editAssignee = ticket.assigneeId ?? '';
		reply = '';
		detailOpen = true;
	}

	function saveTicket() {
		if (!editing) return;
		updateTickets([editing.id], {
			status: editStatus as TicketStatus,
			assigneeId: editAssignee || null
		});
		detailOpen = false;
	}

	// ---- New ticket dialog --------------------------------------------------
	let createOpen = $state(false);
	let newSubject = $state('');
	let newCustomer = $state('');
	let newEmail = $state('');
	let newPriority = $state<string>('medium');
	let newTeam = $state<string>('technical');
	let newDescription = $state('');

	const canCreate = $derived(newSubject.trim() !== '' && newCustomer.trim() !== '');

	function openCreate() {
		newSubject = '';
		newCustomer = '';
		newEmail = '';
		newPriority = 'medium';
		newTeam = 'technical';
		newDescription = '';
		createOpen = true;
	}

	function createTicket() {
		if (!canCreate) return;
		const nextNumber = Math.max(...tickets.map((t) => Number(t.id.slice(2)))) + 1;
		const created: Ticket = {
			id: `T-${nextNumber}`,
			subject: newSubject.trim(),
			customer: newCustomer.trim(),
			email: newEmail.trim(),
			status: 'open',
			priority: newPriority as TicketPriority,
			channel: 'web',
			team: newTeam as Ticket['team'],
			assigneeId: null,
			createdAt: now(),
			updatedAt: now(),
			slaHoursLeft: 24,
			csat: null,
			tags: []
		};
		tickets = [created, ...tickets];
		createOpen = false;
	}
</script>

<div class="shell">
	<Sidebar bind:selection={queue} {sections} agentName={currentAgent.name} />

	<main class="main">
		<header class="header">
			<div>
				<h1>Tickets</h1>
				<p class="subtitle">Monday, 9 November · {filtered.length} of {tickets.length} tickets shown</p>
			</div>
			<Button label="New ticket" icon={{ name: 'add' }} color="primary" variant="filled" onClick={openCreate} />
		</header>

		<section class="kpis" aria-label="Key metrics">
			{#each kpis as kpi (kpi.id)}
				<KpiCard {kpi} />
			{/each}
		</section>

		<Surface as="section" variant="soft" spacing="medium" radius="medium" aria-label="Ticket management">
			<Tabs items={statusTabs} bind:value={status} label="Ticket status" size="small" />

			<div class="filters">
				<label class="field grow">
					<span>Search</span>
					<TextInput
						bind:value={search}
						placeholder="Subject, customer, tag…"
						icon={{ name: 'search' }}
						size="small"
						wide
					/>
				</label>
				<div class="field">
					<label for="priority-filter">Priority</label>
					<Select id="priority-filter" items={priorityOptions} bind:value={priority} size="small" />
				</div>
				<div class="field">
					<span id="assignee-filter-label">Assignee</span>
					<Combobox
						aria-labelledby="assignee-filter-label"
						items={assigneeOptions}
						bind:value={assignee}
						placeholder="Anyone"
						size="small"
					/>
				</div>
				<label class="switch">
					<Switch bind:checked={atRiskOnly} size="small" />
					SLA at risk
				</label>
				<Button label="Reset" icon={{ name: 'restart_alt' }} size="small" onClick={resetFilters} />
			</div>

			{#if activeFilters.length}
				<PillGroup items={activeFilters} onDelete={clearFilter} size="small" variant="soft" aria-label="Active filters" />
			{/if}

			{#if visibleSelected.length}
				<Surface orientation="horizontal" spacing="small" variant="filled" color="primary" radius="small" aria-label="Bulk actions">
					<span class="bulk-count">{visibleSelected.length} selected</span>
					<Button label="Assign to me" icon={{ name: 'person' }} size="small" variant="soft" onClick={bulkAssignToMe} />
					<Button label="Mark resolved" icon={{ name: 'check_circle' }} size="small" variant="soft" onClick={bulkResolve} />
					<Button icon={{ name: 'close' }} size="small" aria-label="Clear selection" onClick={() => (selectedIds = [])} />
				</Surface>
			{/if}

			<div class="table-wrap">
				<TicketTable tickets={filtered} bind:selectedIds onOpen={openTicket} />
			</div>
		</Surface>
	</main>
</div>

<Dialog
	bind:open={detailOpen}
	header={{
		title: editing ? `${editing.id} · ${editing.subject}` : 'Ticket',
		description: editing ? `${editing.customer} · ${editing.email}` : undefined,
		icon: { name: 'confirmation_number' }
	}}
	size="large"
	footer={{
		primary: { label: 'Save', icon: { name: 'check_circle' }, onClick: saveTicket },
		secondary: { label: 'Cancel', onClick: () => (detailOpen = false) }
	}}
>
	{#if editing}
		<div class="form">
			<div class="row">
				<div class="field">
					<label for="edit-status">Status</label>
					<Select id="edit-status" items={statusOptions} bind:value={editStatus} />
				</div>
				<div class="field">
					<label for="edit-assignee">Assignee</label>
					<Select id="edit-assignee" items={agentOptions} bind:value={editAssignee} placeholder="Unassigned" />
				</div>
			</div>
			{#if editing.tags.length}
				<PillGroup items={editing.tags.map((tag) => ({ id: tag, label: tag }))} size="small" aria-label="Tags" />
			{/if}
			<label class="field">
				<span>Reply to customer</span>
				<TextArea bind:value={reply} rows={5} placeholder="Write a reply…" wide />
			</label>
		</div>
	{/if}
</Dialog>

<Dialog
	bind:open={createOpen}
	header={{ title: 'New ticket', description: 'Log a ticket on behalf of a customer.', icon: { name: 'add' } }}
	footer={{
		primary: { label: 'Create ticket', onClick: createTicket, disabled: !canCreate },
		secondary: { label: 'Cancel', onClick: () => (createOpen = false) }
	}}
>
	<div class="form">
		<label class="field">
			<span>Subject</span>
			<TextInput bind:value={newSubject} required wide />
		</label>
		<div class="row">
			<label class="field">
				<span>Customer</span>
				<TextInput bind:value={newCustomer} required wide />
			</label>
			<label class="field">
				<span>Email</span>
				<TextInput type="email" bind:value={newEmail} wide />
			</label>
		</div>
		<div class="row">
			<div class="field">
				<label for="new-priority">Priority</label>
				<Select id="new-priority" items={priorityOptions.slice(1)} bind:value={newPriority} />
			</div>
			<div class="field">
				<label for="new-team">Team</label>
				<Select id="new-team" items={teamOptions} bind:value={newTeam} />
			</div>
		</div>
		<label class="field">
			<span>Description</span>
			<TextArea bind:value={newDescription} rows={4} wide />
		</label>
	</div>
</Dialog>

<style>
	.shell {
		display: grid;
		grid-template-columns: 16rem minmax(0, 1fr);
		height: 100vh;
		background: var(--color-background);
		color: var(--color-foreground);
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem;
		overflow: auto;
		min-width: 0;
	}
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.subtitle {
		margin: 0.25rem 0 0;
		color: var(--color-muted);
		font-size: 0.875rem;
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: 1rem;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.75rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
	.grow {
		flex: 1 1 14rem;
	}
	.switch {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		min-height: 2.25rem;
	}
	.bulk-count {
		font-weight: 600;
		margin-right: auto;
	}
	.table-wrap {
		max-height: 32rem;
		display: flex;
		min-height: 0;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 1rem;
	}
	@media (max-width: 56rem) {
		.shell {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
			height: auto;
			min-height: 100vh;
		}
		.main {
			overflow: visible;
		}
	}
</style>

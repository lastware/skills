<script lang="ts">
	import { Button, Dialog, Icon, Pill, Progress, Spinner, Surface, Switch, Tabs, TextInput } from 'bref-ui';
	import type { TabItemDataProps } from 'bref-ui/types';
	import {
		formatDuration,
		initialJobs,
		liveScript,
		nextLogId,
		nowTime,
		statusMeta,
		type Job,
		type JobStatus,
		type LogLevel
	} from '#lib/agents.js';

	const MAX_RUNNING = 3;

	let jobs = $state<Job[]>(initialJobs());
	let selectedId = $state('job-4821');
	let filter = $state('all');
	let query = $state('');
	let follow = $state(true);
	let confirmOpen = $state(false);
	let pendingStopId = $state<string | null>(null);
	let tick = 0;

	const selected = $derived(jobs.find((job) => job.id === selectedId) ?? jobs[0]);
	const counts = $derived({
		all: jobs.length,
		running: jobs.filter((j) => j.status === 'running').length,
		queued: jobs.filter((j) => j.status === 'queued').length,
		finished: jobs.filter((j) => j.status === 'completed' || j.status === 'stopped' || j.status === 'failed').length
	});
	const totals = $derived({
		tokens: jobs.reduce((sum, j) => sum + j.tokens, 0),
		cost: jobs.reduce((sum, j) => sum + j.costUsd, 0)
	});
	const tabs: TabItemDataProps[] = $derived([
		{ id: 'all', label: `All ${counts.all}`, icon: 'list' },
		{ id: 'running', label: `Running ${counts.running}`, icon: 'bolt' },
		{ id: 'queued', label: `Queued ${counts.queued}`, icon: 'hourglass_empty' },
		{ id: 'finished', label: `Finished ${counts.finished}`, icon: 'done_all' }
	]);
	const visible = $derived(
		jobs.filter((job) => {
			const matchesFilter =
				filter === 'all' ||
				job.status === filter ||
				(filter === 'finished' && ['completed', 'stopped', 'failed'].includes(job.status));
			const q = query.trim().toLowerCase();
			const matchesQuery =
				!q || job.agent.includes(q) || job.task.toLowerCase().includes(q) || job.id.includes(q);
			return matchesFilter && matchesQuery;
		})
	);

	const log = (job: Job, level: LogLevel, message: string) => {
		job.logs.push({ id: nextLogId(), time: nowTime(), level, message });
		if (job.logs.length > 400) job.logs.splice(0, job.logs.length - 400);
	};

	const startQueued = () => {
		const running = jobs.filter((j) => j.status === 'running').length;
		const next = jobs.find((j) => j.status === 'queued');
		if (!next || running >= MAX_RUNNING) return;
		next.status = 'running';
		next.startedAt = nowTime();
		next.step = 'Planning';
		log(next, 'info', 'Picked up by worker w-21, planning 4 steps');
	};

	const requestStop = (id: string) => {
		pendingStopId = id;
		confirmOpen = true;
	};

	const stopJob = () => {
		const job = jobs.find((j) => j.id === pendingStopId);
		confirmOpen = false;
		if (!job || (job.status !== 'running' && job.status !== 'queued')) return;
		job.status = 'stopped';
		job.step = `Stopped by you at ${Math.round(job.progress * 100)}%`;
		log(job, 'warn', 'Stop requested by operator, sending SIGTERM to worker');
		log(job, 'info', 'Worker acknowledged, partial results saved');
		pendingStopId = null;
		startQueued();
	};

	const restartJob = (job: Job) => {
		job.status = 'queued';
		job.progress = 0;
		job.elapsed = 0;
		job.step = 'Waiting for a free worker';
		log(job, 'info', 'Re-queued by operator');
		startQueued();
	};

	// Simulate a live backend: advance running jobs and stream log lines.
	$effect(() => {
		const timer = setInterval(() => {
			tick++;
			for (const job of jobs) {
				if (job.status !== 'running') continue;
				job.elapsed += 1;
				job.tokens += 180 + Math.floor(Math.random() * 900);
				job.costUsd += job.model.includes('opus') ? 0.012 : job.model.includes('haiku') ? 0.001 : 0.004;
				job.progress = Math.min(1, job.progress + 0.003 + Math.random() * 0.008);
				if (Math.random() < 0.45) {
					const script = liveScript[job.agent] ?? [['info', 'Working…']];
					const [level, message] = script[(tick + job.logs.length) % script.length];
					log(job, level, message);
					job.step = message;
				}
				if (job.progress >= 1) {
					job.status = 'completed';
					job.step = 'Finished, results uploaded';
					log(job, 'done', 'All steps complete, results uploaded to artifacts/');
					startQueued();
				}
			}
		}, 1000);
		return () => clearInterval(timer);
	});

	// Keep the log panel pinned to the newest line while "Follow" is on.
	let logEl = $state<HTMLElement | null>(null);
	const captureLog = (node: HTMLElement) => {
		logEl = node;
		return () => (logEl = null);
	};
	$effect(() => {
		void selected.logs.length;
		void selected.id;
		if (follow && logEl) logEl.scrollTop = logEl.scrollHeight;
	});

	const activity = $derived(
		jobs
			.flatMap((job) => job.logs.slice(-4).map((line) => ({ ...line, agent: job.agent, jobId: job.id })))
			.sort((a, b) => b.id - a.id)
			.slice(0, 9)
	);

	const pending = $derived(jobs.find((j) => j.id === pendingStopId));
	const fmtTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : `${n}`);
	const isActive = (status: JobStatus) => status === 'running' || status === 'queued';
</script>

<div class="page">
	<header>
		<Surface orientation="horizontal" spacing="medium" class="bar">
			<div class="brand">
				<Icon name="smart_toy" size="large" color="primary" />
				<div>
					<h1>Agent Monitor</h1>
					<p class="muted">Production fleet · us-east-2</p>
				</div>
			</div>
			<div class="bar-right">
				<label class="search">
					<span class="sr-only">Search jobs</span>
					<TextInput
						bind:value={query}
						placeholder="Search agents, tasks, IDs"
						icon={{ name: 'search' }}
						size="small"
					/>
				</label>
				<Pill label="Live" color="success" variant="soft" icon={{ name: 'sensors' }} />
			</div>
		</Surface>
	</header>

	<section class="kpis" aria-label="Fleet summary">
		<Surface variant="soft" color="info" radius="small" spacing="medium">
			<span class="kpi-label"><Icon name="bolt" /> Running</span>
			<span class="kpi-value">{counts.running} <small class="muted">/ {MAX_RUNNING} slots</small></span>
		</Surface>
		<Surface variant="soft" color="muted" radius="small" spacing="medium">
			<span class="kpi-label"><Icon name="hourglass_empty" /> Queued</span>
			<span class="kpi-value">{counts.queued}</span>
		</Surface>
		<Surface variant="soft" color="primary" radius="small" spacing="medium">
			<span class="kpi-label"><Icon name="token" /> Tokens today</span>
			<span class="kpi-value">{fmtTokens(totals.tokens)}</span>
		</Surface>
		<Surface variant="soft" color="success" radius="small" spacing="medium">
			<span class="kpi-label"><Icon name="payments" /> Spend today</span>
			<span class="kpi-value">${totals.cost.toFixed(2)}</span>
		</Surface>
	</section>

	<main>
		<Surface as="section" variant="soft" color="muted" radius="small" spacing="medium" class="jobs" aria-label="Jobs">
			<div class="section-head">
				<h2>Jobs</h2>
				<Tabs items={tabs} bind:value={filter} label="Filter jobs by status" size="small" />
			</div>
			<table>
				<thead>
					<tr>
						<th>Agent / task</th>
						<th>Status</th>
						<th class="progress-col">Progress</th>
						<th class="num">Elapsed</th>
						<th class="num">Tokens</th>
						<th><span class="sr-only">Actions</span></th>
					</tr>
				</thead>
				<tbody>
					{#each visible as job (job.id)}
						<tr class:selected={job.id === selected.id}>
							<td>
								<button class="row-link" onclick={() => (selectedId = job.id)}>
									<span class="agent">{job.agent}</span>
									<span class="task muted">{job.task}</span>
								</button>
							</td>
							<td class="pill">
								<Pill
									label={statusMeta[job.status].label}
									color={statusMeta[job.status].color}
									variant="soft"
									size="small"
									icon={{ name: statusMeta[job.status].icon }}
								/>
							</td>
							<td class="progress-col">
								<div class="progress-cell">
									<Progress
										value={job.status === 'queued' ? undefined : job.progress}
										label={`${job.agent} progress`}
										size="small"
									/>
									<span class="pct">{job.status === 'queued' ? '—' : `${Math.round(job.progress * 100)}%`}</span>
								</div>
							</td>
							<td class="num">{formatDuration(job.elapsed)}</td>
							<td class="num">{fmtTokens(job.tokens)}</td>
							<td class="actions">
								{#if isActive(job.status)}
									<Button
										icon={{ name: 'stop' }}
										aria-label={`Stop ${job.id}`}
										variant="soft"
										color="error"
										size="small"
										onClick={() => requestStop(job.id)}
									/>
								{:else}
									<Button
										icon={{ name: 'replay' }}
										aria-label={`Restart ${job.id}`}
										variant="neutral"
										size="small"
										onClick={() => restartJob(job)}
									/>
								{/if}
							</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="empty muted">No jobs match this filter.</td></tr>
					{/each}
				</tbody>
			</table>

			<div class="activity">
				<h3><Icon name="monitor_heart" /> Recent activity</h3>
				<ul>
					{#each activity as item (item.id)}
						<li class={item.level}>
							<span class="time mono">{item.time}</span>
							<button class="agent-link" onclick={() => (selectedId = item.jobId)}>{item.agent}</button>
							<span class="msg">{item.message}</span>
						</li>
					{/each}
				</ul>
			</div>
		</Surface>

		<Surface as="section" variant="soft" color="muted" radius="small" spacing="medium" class="detail" aria-label="Selected job">
			<div class="detail-head">
				<div>
					<p class="muted mono">{selected.id} · {selected.model}</p>
					<h2>{selected.task}</h2>
				</div>
				<div class="detail-actions">
					{#if isActive(selected.status)}
						<Button
							label="Stop job"
							icon={{ name: 'stop' }}
							color="error"
							variant="filled"
							size="small"
							onClick={() => requestStop(selected.id)}
						/>
					{:else}
						<Button
							label="Restart"
							icon={{ name: 'replay' }}
							variant="soft"
							size="small"
							onClick={() => restartJob(selected)}
						/>
					{/if}
				</div>
			</div>

			<div class="status-line">
				<span class="pill">
					<Pill
						label={statusMeta[selected.status].label}
						color={statusMeta[selected.status].color}
						variant="soft"
						size="small"
						icon={{ name: statusMeta[selected.status].icon }}
					/>
				</span>
				{#if selected.status === 'running'}<Spinner size="small" />{/if}
				<span class="step">{selected.step}</span>
				<span class="pct big">{Math.round(selected.progress * 100)}%</span>
			</div>
			<Progress
				value={selected.status === 'queued' ? undefined : selected.progress}
				label="Selected job progress"
			/>

			<dl class="meta">
				<div><dt>Agent</dt><dd>{selected.agent}</dd></div>
				<div><dt>Started</dt><dd>{selected.startedAt}</dd></div>
				<div><dt>Elapsed</dt><dd>{formatDuration(selected.elapsed)}</dd></div>
				<div><dt>Tokens</dt><dd>{selected.tokens.toLocaleString('en-US')}</dd></div>
				<div><dt>Cost</dt><dd>${selected.costUsd.toFixed(2)}</dd></div>
			</dl>

			<div class="log-head">
				<h3><Icon name="terminal" /> Logs <small class="muted">{selected.logs.length} lines</small></h3>
				<label class="follow"><Switch bind:checked={follow} size="small" /> Follow</label>
			</div>
			<div class="log-frame">
				<Surface scroll height="fill" aria-label={`Logs for ${selected.id}`} class="log" {@attach captureLog}>
					<ol>
						{#each selected.logs as line (line.id)}
							<li class={line.level}>
								<span class="time">{line.time}</span>
								<span class="level">{line.level}</span>
								<span class="msg">{line.message}</span>
							</li>
						{/each}
					</ol>
				</Surface>
			</div>
		</Surface>
	</main>
</div>

<Dialog
	bind:open={confirmOpen}
	header={{
		title: `Stop ${pending?.agent ?? 'job'}?`,
		description: pending ? `${pending.id}: ${pending.task}` : undefined,
		icon: { name: 'warning' }
	}}
	footer={{
		primary: { label: 'Stop job', icon: { name: 'stop' }, color: 'error', onClick: stopJob },
		secondary: { label: 'Keep running', onClick: () => (confirmOpen = false) }
	}}
	size="small"
>
	<p>
		The worker receives SIGTERM and saves partial results. Progress so far
		({Math.round((pending?.progress ?? 0) * 100)}%) is kept, but the job won't resume on its own.
	</p>
</Dialog>

<style>
	.page {
		--line: color-mix(in srgb, var(--color-muted) 25%, transparent);
		height: 100vh;
		min-height: 44rem;
		box-sizing: border-box;
		padding: 1.25rem 1.5rem 1.5rem;
		display: grid;
		grid-template-rows: auto auto 1fr;
		gap: 1rem;
		color: var(--color-foreground);
		background: var(--color-background);
	}
	h1,
	h2,
	h3,
	p {
		margin: 0;
	}
	h1 {
		font-size: 1.35rem;
	}
	h2 {
		font-size: 1.05rem;
	}
	h3 {
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.muted {
		color: var(--color-muted);
	}
	.mono,
	.log-frame ol {
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	header :global(.bar) {
		justify-content: space-between;
		padding-inline: 0;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.brand p {
		font-size: 0.85rem;
	}
	.bar-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.search {
		width: 18rem;
	}
	.bar-right :global(*) {
		white-space: nowrap;
	}

	.kpis {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem;
	}
	.kpi-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--color-muted);
	}
	.kpi-value {
		font-size: 1.75rem;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}
	.kpi-value small {
		font-size: 0.85rem;
		font-weight: 400;
	}

	main {
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
		gap: 1rem;
		min-height: 0;
	}
	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th {
		text-align: left;
		font-weight: 500;
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-muted);
		padding: 0.5rem 0.6rem;
		border-bottom: 1px solid var(--line);
		white-space: nowrap;
	}
	td {
		padding: 0.6rem;
		border-bottom: 1px solid var(--line);
		vertical-align: middle;
	}
	tbody tr:hover {
		background: color-mix(in srgb, var(--color-foreground) 4%, transparent);
	}
	tbody tr.selected {
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		box-shadow: inset 3px 0 0 var(--color-primary);
	}
	.row-link {
		all: unset;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		cursor: pointer;
		max-width: 22rem;
	}
	.row-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
	.agent {
		font-weight: 600;
	}
	.task {
		font-size: 0.82rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	td.pill :global(*),
	.status-line .pill :global(*) {
		white-space: nowrap;
		overflow-wrap: normal;
	}
	.progress-col {
		width: 11rem;
	}
	.progress-cell {
		display: grid;
		grid-template-columns: 1fr 2.6rem;
		align-items: center;
		gap: 0.5rem;
	}
	.pct {
		font-variant-numeric: tabular-nums;
		text-align: right;
		font-size: 0.85rem;
	}
	.pct.big {
		font-size: 1.1rem;
		font-weight: 650;
		margin-left: auto;
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.actions {
		width: 2.5rem;
		text-align: right;
	}
	.empty {
		text-align: center;
		padding: 2rem;
	}

	main :global(.detail),
	main :global(.jobs) {
		min-height: 0;
		overflow: hidden;
	}
	.activity {
		margin-top: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 0;
		overflow: hidden;
	}
	.activity ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.85rem;
	}
	.activity li {
		display: grid;
		grid-template-columns: 4.4rem 7.5rem minmax(0, 1fr);
		gap: 0.6rem;
		align-items: baseline;
	}
	.activity .msg {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.activity .time {
		font-size: 0.78rem;
	}
	.agent-link {
		all: unset;
		cursor: pointer;
		font-weight: 600;
		color: var(--color-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.agent-link:focus-visible {
		outline: 2px solid var(--color-primary);
	}
	.follow {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.detail-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}
	.detail-head p {
		font-size: 0.8rem;
		margin-bottom: 0.25rem;
	}
	.detail-actions :global(*) {
		white-space: nowrap;
	}
	.status-line {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
	}
	.step {
		font-size: 0.88rem;
		color: var(--color-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}
	.meta {
		display: grid;
		grid-template-columns: 1.6fr 1fr 1fr 1.1fr 0.8fr;
		gap: 0.75rem;
		margin: 0;
		padding: 0.75rem 0;
		border-block: 1px solid var(--line);
	}
	.meta dt {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-muted);
	}
	.meta dd {
		margin: 0.15rem 0 0;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.log-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.log-head small {
		font-weight: 400;
		font-size: 0.8rem;
	}
	.log-frame {
		flex: 1;
		min-height: 12rem;
		border-radius: 0.5rem;
		background: color-mix(in srgb, var(--color-foreground) 6%, var(--color-background));
		border: 1px solid var(--line);
		overflow: hidden;
	}
	.log-frame :global(.log) {
		background: transparent;
	}
	.log-frame ol {
		list-style: none;
		margin: 0;
		padding: 0.75rem;
		font-size: 0.8rem;
		line-height: 1.55;
	}
	.log-frame li {
		display: grid;
		grid-template-columns: 4.6rem 3.2rem 1fr;
		gap: 0.5rem;
	}
	.time {
		color: var(--color-muted);
	}
	.level {
		text-transform: uppercase;
		font-size: 0.7rem;
		font-weight: 700;
		padding-top: 0.12rem;
		color: var(--color-info);
	}
	li.tool .level {
		color: var(--color-primary);
	}
	li.warn .level,
	li.warn .msg {
		color: var(--color-warning);
	}
	li.error .level,
	li.error .msg {
		color: var(--color-error);
	}
	li.done .level,
	li.done .msg {
		color: var(--color-success);
	}
	.log-frame .msg {
		overflow-wrap: anywhere;
	}
</style>

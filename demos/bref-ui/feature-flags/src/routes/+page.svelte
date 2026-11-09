<script lang="ts">
	import {
		Button,
		Dialog,
		Icon,
		Pill,
		PillChoiceGroup,
		Select,
		Surface,
		Switch,
		TextInput
	} from 'bref-ui';
	import {
		environments,
		flags as initialFlags,
		initialActivity,
		kinds,
		teams,
		type ActivityEntry,
		type EnvironmentId,
		type FeatureFlag,
		type FlagKind
	} from '#lib/flags.js';

	let flags = $state<FeatureFlag[]>(structuredClone(initialFlags));
	let activity = $state<ActivityEntry[]>([...initialActivity]);

	let query = $state('');
	let kindFilter = $state<string>('all');
	let owner = $state<string>('all');

	const kindItems = [
		{ id: 'all', label: 'All types' },
		...(Object.keys(kinds) as FlagKind[]).map((id) => ({ id, label: kinds[id].label }))
	];
	const ownerItems = [
		{ id: 'all', label: 'All teams' },
		...teams.map((t) => ({ id: t, label: t }))
	];

	const visible = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return flags.filter(
			(f) =>
				(kindFilter === 'all' || f.kind === kindFilter) &&
				(owner === 'all' || f.owner === owner) &&
				(!q ||
					f.name.toLowerCase().includes(q) ||
					f.key.includes(q) ||
					f.description.toLowerCase().includes(q))
		);
	});

	const enabledCount = (env: EnvironmentId) => flags.filter((f) => f.environments[env]).length;

	let pending = $state<{ flag: FeatureFlag; env: EnvironmentId } | null>(null);
	let confirmOpen = $state(false);

	const apply = (flag: FeatureFlag, env: EnvironmentId, enabled: boolean) => {
		flag.environments[env] = enabled;
		flag.updatedAt = 'Just now';
		activity.unshift({
			id: Date.now(),
			flagKey: flag.key,
			environment: env,
			enabled,
			actor: 'You',
			at: 'Just now'
		});
	};

	const request = (flag: FeatureFlag, env: EnvironmentId, enabled: boolean) => {
		if (flag.environments[env] === enabled) return;
		if (env === 'production' && enabled) {
			pending = { flag, env };
			confirmOpen = true;
			return;
		}
		apply(flag, env, enabled);
	};

	const confirm = () => {
		if (pending) apply(pending.flag, pending.env, true);
		confirmOpen = false;
	};

	const cancel = () => {
		confirmOpen = false;
	};

	const resetFilters = () => {
		query = '';
		kindFilter = 'all';
		owner = 'all';
	};

	const envLabel = (id: EnvironmentId) => environments.find((e) => e.id === id)?.label ?? id;
</script>

<div class="page">
	<header>
		<div class="title">
			<Icon name="flag" size="large" color="primary" />
			<div>
				<h1>Feature flags</h1>
				<p class="muted">Acme web app · {flags.length} flags across {environments.length} environments</p>
			</div>
		</div>
		<Button label="New flag" icon={{ name: 'add' }} color="primary" variant="filled" />
	</header>

	<section class="stats" aria-label="Enabled flags per environment">
		{#each environments as env (env.id)}
			<Surface variant="soft" color={env.id === 'production' ? 'primary' : 'muted'} radius="medium" spacing="medium" orientation="vertical">
				<span class="stat-label"><Icon name={env.icon} /> {env.label}</span>
				<span class="stat-value">{enabledCount(env.id)}<span class="muted"> / {flags.length} on</span></span>
			</Surface>
		{/each}
	</section>

	<div class="layout">
		<Surface variant="neutral" color="background" radius="medium" shadow="small" orientation="vertical">
			<div class="toolbar">
				<label class="search">
					<span class="sr-only">Search flags</span>
					<TextInput bind:value={query} placeholder="Search by name, key or description" icon={{ name: 'search' }} wide />
				</label>
				<PillChoiceGroup items={kindItems} bind:selection={kindFilter} size="small" aria-label="Filter by flag type" />
				<label class="owner" for="owner-select">
					<span class="sr-only">Owner team</span>
					<Select id="owner-select" items={ownerItems} bind:value={owner} placeholder="Owner team" size="small" />
				</label>
			</div>

			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th scope="col">Flag</th>
							<th scope="col">Type</th>
							<th scope="col">Owner</th>
							{#each environments as env (env.id)}
								<th scope="col" class="env">{env.label}</th>
							{/each}
							<th scope="col">Updated</th>
						</tr>
					</thead>
					<tbody>
						{#each visible as flag (flag.key)}
							<tr>
								<td>
									<div class="flag">
									<span class="name">{flag.name}</span>
									<code>{flag.key}</code>
									<span class="desc muted">{flag.description}</span>
									</div>
								</td>
								<td class="pill">
									<Pill label={kinds[flag.kind].label} color={kinds[flag.kind].color} variant="soft" size="small" />
								</td>
								<td class="nowrap">{flag.owner}</td>
								{#each environments as env (env.id)}
									<td class="env">
										<label class="toggle">
											<Switch
												size="small"
												aria-label={`${flag.name} in ${env.label}`}
												bind:checked={
													() => flag.environments[env.id],
													(v) => request(flag, env.id, Boolean(v))
												}
												onchange={(e) => {
													if (env.id === 'production' && e.currentTarget.checked) {
														e.currentTarget.checked = false;
													}
												}}
											/>
											<span class:on={flag.environments[env.id]}>{flag.environments[env.id] ? 'On' : 'Off'}</span>
										</label>
									</td>
								{/each}
								<td class="nowrap muted">{flag.updatedAt}</td>
							</tr>
						{:else}
							<tr>
								<td colspan={4 + environments.length} class="empty">
									<p>No flags match these filters.</p>
									<Button label="Clear filters" variant="soft" size="small" onClick={resetFilters} />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Surface>

		<aside>
			<Surface variant="soft" color="muted" radius="medium" spacing="medium" orientation="vertical" height="fill" scroll aria-label="Recent flag changes">
				<h2><Icon name="history" /> Recent changes</h2>
				<ol class="activity">
					{#each activity as entry (entry.id)}
						<li>
							<Icon name={entry.enabled ? 'toggle_on' : 'toggle_off'} color={entry.enabled ? 'success' : 'muted'} size="large" />
							<div>
								<p><strong>{entry.actor}</strong> turned <code>{entry.flagKey}</code> <strong>{entry.enabled ? 'on' : 'off'}</strong> in {envLabel(entry.environment)}</p>
								<span class="muted">{entry.at}</span>
							</div>
						</li>
					{/each}
				</ol>
			</Surface>
		</aside>
	</div>
</div>

<Dialog
	bind:open={confirmOpen}
	size="small"
	header={{
		title: 'Enable in production?',
		description: 'This change goes live for all production traffic immediately.',
		icon: { name: 'warning' }
	}}
	footer={{
		primary: { label: 'Enable in production', icon: { name: 'rocket_launch' }, color: 'warning', onClick: confirm },
		secondary: { label: 'Cancel', onClick: cancel }
	}}
>
	{#if pending}
		<p>
			You are about to turn on <strong>{pending.flag.name}</strong> (<code>{pending.flag.key}</code>) in
			<strong>Production</strong>.
		</p>
		<p class="muted">
			Staging is currently <strong>{pending.flag.environments.staging ? 'on' : 'off'}</strong> for this flag. Owner: {pending.flag.owner}.
		</p>
	{/if}
</Dialog>

<style>
	:global(body) {
		margin: 0;
		background: var(--color-background);
		color: var(--color-foreground);
	}
	.page {
		box-sizing: border-box;
		max-width: 88rem;
		margin: 0 auto;
		padding: 1.75rem 2rem 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	h1 + p {
		margin: 0.125rem 0 0;
	}
	h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		font-size: 1rem;
	}
	.muted {
		color: color-mix(in srgb, var(--color-foreground) 60%, transparent);
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}
	.stat-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
	}
	.stat-value {
		font-size: 1.75rem;
		font-weight: 600;
	}
	.stat-value .muted {
		margin-left: 0.25rem;
		font-size: 0.9rem;
		font-weight: 400;
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 18rem;
		gap: 1.25rem;
		align-items: stretch;
	}
	aside {
		align-self: start;
		position: sticky;
		top: 1rem;
		height: 36rem;
	}
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
	}
	.search {
		flex: 1 1 16rem;
	}
	.owner {
		min-width: 10rem;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th.env,
	td.env {
		padding-inline: 0.5rem;
	}
	th {
		text-align: left;
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.75rem 1rem;
		white-space: nowrap;
		color: color-mix(in srgb, var(--color-foreground) 60%, transparent);
	}
	td {
		padding: 0.75rem 1rem;
		border-top: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
		vertical-align: middle;
	}
	tbody tr:hover {
		background: color-mix(in srgb, var(--color-muted) 8%, transparent);
	}
	.flag {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 16rem;
	}
	.name {
		font-weight: 600;
	}
	code {
		font-size: 0.8rem;
		color: var(--color-primary);
	}
	.desc {
		font-size: 0.825rem;
	}
	.nowrap {
		white-space: nowrap;
	}
	td.pill :global(*) {
		white-space: nowrap;
		overflow-wrap: normal;
	}
	.env {
		text-align: center;
	}
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}
	.toggle span {
		width: 1.75rem;
		text-align: left;
		font-size: 0.8rem;
		color: color-mix(in srgb, var(--color-foreground) 55%, transparent);
	}
	.toggle span.on {
		color: var(--color-success);
		font-weight: 600;
	}
	.empty {
		text-align: center;
		padding: 2.5rem 1rem;
	}
	.activity {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}
	.activity li {
		display: flex;
		gap: 0.625rem;
		align-items: flex-start;
	}
	.activity p {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.4;
	}
	.activity .muted {
		font-size: 0.75rem;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	@media (max-width: 64rem) {
		.layout {
			grid-template-columns: 1fr;
		}
		aside {
			height: 20rem;
		}
	}
</style>

<script lang="ts">
	import { Icon, Surface, TreeView } from 'bref-ui';
	import type { TreeSectionProps } from 'bref-ui/types';

	let {
		selection = $bindable(),
		sections,
		agentName
	}: {
		selection?: string;
		sections: TreeSectionProps[];
		agentName: string;
	} = $props();
</script>

<aside class="sidebar">
	<Surface variant="soft" spacing="medium" height="fill">
		<div class="brand">
			<Icon name="support_agent" color="primary" size="large" />
			<span>Support desk</span>
		</div>
		<nav aria-label="Ticket queues" class="nav">
			<TreeView items={[]} {sections} label="Ticket queues" bind:selection size="small" />
		</nav>
		<div class="me">
			<Icon name="person" />
			<span>{agentName}</span>
		</div>
	</Surface>
</aside>

<style>
	.sidebar {
		height: 100%;
		min-height: 0;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 650;
		font-size: 1.125rem;
		color: var(--color-foreground);
	}
	.nav {
		flex: 1;
		overflow: auto;
	}
	.me {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-muted);
		font-size: 0.875rem;
	}
</style>

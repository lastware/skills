<!--
	Brand preview: every Bref color and variant, light and dark side by side.
	Copy to src/routes/brand-preview/+page.svelte, then screenshot /brand-preview.
	Uses only Bref UI 3.1.1 components and theme tokens; it needs no data.
-->
<script lang="ts">
	import { Button, Checkbox, Pill, Progress, Select, Surface, Switch, Tabs, TextInput } from 'bref-ui';
	import type { Color, Variant } from 'bref-ui/types';

	const modes = ['light', 'dark'] as const;
	const accents: Exclude<Color, 'background'>[] = ['primary', 'secondary', 'muted'];
	const statuses: Exclude<Color, 'background'>[] = ['info', 'success', 'warning', 'error'];
	const variants: Variant[] = ['filled', 'soft', 'neutral'];
	const tabs = [
		{ id: 'overview', label: 'Overview', icon: 'home' },
		{ id: 'activity', label: 'Activity', icon: 'notifications' },
		{ id: 'settings', label: 'Settings', icon: 'settings' }
	] as const;
	const plans = [
		{ id: 'starter', label: 'Starter' },
		{ id: 'team', label: 'Team' }
	];
	let tab = $state<string>('overview');
	let on = $state(true);
</script>

<div class="modes">
	{#each modes as mode (mode)}
		<section data-theme={mode} aria-label="{mode} mode">
			<p class="mode">{mode} mode</p>
			<h1>Your brand, in Bref</h1>
			<p>Body text in the foreground color, on the background color.</p>
			<p class="muted">Secondary text in the muted color.</p>

			{#each variants as variant (variant)}
				<div class="row">
					{#each accents as color (color)}
						<Button label="{color} {variant}" {color} {variant} />
					{/each}
				</div>
			{/each}

			<div class="row">
				{#each statuses as color (color)}
					{#each variants as variant (variant)}
						<Pill label={color} {color} {variant} size="small" />
					{/each}
				{/each}
			</div>

			<Surface variant="soft" radius="medium" spacing="medium" aria-label="{mode} controls">
				<Tabs items={tabs} bind:value={tab} label="{mode} sections" />
				<div class="fields">
					<label for="email-{mode}">Email</label>
					<TextInput id="email-{mode}" placeholder="you@example.com" icon={{ name: 'mail' }} />
					<label for="plan-{mode}">Plan</label>
					<Select id="plan-{mode}" items={plans} placeholder="Choose a plan" />
				</div>
				<div class="row">
					<Switch id="notify-{mode}" bind:checked={on} />
					<label for="notify-{mode}">Notifications</label>
					<Checkbox id="terms-{mode}" checked />
					<label for="terms-{mode}">Accept terms</label>
				</div>
				<Progress value={0.62} label="Setup progress" />
			</Surface>
		</section>
	{/each}
</div>

<style>
	.modes {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(30rem, 1fr));
		min-height: 100vh;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 2rem;
		background: var(--color-background);
		color: var(--color-foreground);
	}
	.mode {
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted);
	}
	.muted {
		color: var(--color-muted);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.fields {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.75rem 1rem;
		margin-block: 1rem;
	}
</style>

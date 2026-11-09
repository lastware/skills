import type { Color, IconName } from 'bref-ui/types';

export type EnvironmentId = 'development' | 'staging' | 'production';
export type FlagKind = 'release' | 'experiment' | 'ops' | 'permission';

export interface Environment {
	id: EnvironmentId;
	label: string;
	icon: IconName;
}

export interface FeatureFlag {
	key: string;
	name: string;
	description: string;
	kind: FlagKind;
	owner: string;
	updatedAt: string;
	environments: Record<EnvironmentId, boolean>;
}

export interface ActivityEntry {
	id: number;
	flagKey: string;
	environment: EnvironmentId;
	enabled: boolean;
	actor: string;
	at: string;
}

export const environments: readonly Environment[] = [
	{ id: 'development', label: 'Development', icon: 'code' },
	{ id: 'staging', label: 'Staging', icon: 'science' },
	{ id: 'production', label: 'Production', icon: 'rocket_launch' }
];

export const kinds: Record<FlagKind, { label: string; color: Exclude<Color, 'background'> }> = {
	release: { label: 'Release', color: 'primary' },
	experiment: { label: 'Experiment', color: 'info' },
	ops: { label: 'Ops', color: 'warning' },
	permission: { label: 'Permission', color: 'success' }
};

export const teams = ['Checkout', 'Growth', 'Platform', 'Search', 'Mobile'] as const;

export const flags: FeatureFlag[] = [
	{
		key: 'new-checkout-flow',
		name: 'New checkout flow',
		description: 'Single-page checkout with saved payment methods.',
		kind: 'release',
		owner: 'Checkout',
		updatedAt: '2h ago',
		environments: { development: true, staging: true, production: false }
	},
	{
		key: 'apple-pay',
		name: 'Apple Pay',
		description: 'Offer Apple Pay on supported Safari and iOS clients.',
		kind: 'release',
		owner: 'Checkout',
		updatedAt: 'Yesterday',
		environments: { development: true, staging: true, production: true }
	},
	{
		key: 'pricing-page-v3',
		name: 'Pricing page v3',
		description: 'A/B test of annual-first pricing layout.',
		kind: 'experiment',
		owner: 'Growth',
		updatedAt: '3d ago',
		environments: { development: true, staging: true, production: true }
	},
	{
		key: 'onboarding-checklist',
		name: 'Onboarding checklist',
		description: 'Guided setup checklist for new workspaces.',
		kind: 'experiment',
		owner: 'Growth',
		updatedAt: '5h ago',
		environments: { development: true, staging: false, production: false }
	},
	{
		key: 'search-semantic-ranking',
		name: 'Semantic ranking',
		description: 'Rank search results with embedding similarity.',
		kind: 'release',
		owner: 'Search',
		updatedAt: '1d ago',
		environments: { development: true, staging: true, production: false }
	},
	{
		key: 'read-only-mode',
		name: 'Read-only mode',
		description: 'Kill switch that blocks writes during maintenance.',
		kind: 'ops',
		owner: 'Platform',
		updatedAt: '2w ago',
		environments: { development: false, staging: false, production: false }
	},
	{
		key: 'rate-limit-v2',
		name: 'Rate limiter v2',
		description: 'Token-bucket limiter backed by the edge cache.',
		kind: 'ops',
		owner: 'Platform',
		updatedAt: '4d ago',
		environments: { development: true, staging: true, production: true }
	},
	{
		key: 'admin-audit-export',
		name: 'Audit log export',
		description: 'Let workspace admins export audit logs as CSV.',
		kind: 'permission',
		owner: 'Platform',
		updatedAt: '6d ago',
		environments: { development: true, staging: true, production: false }
	},
	{
		key: 'mobile-dark-icons',
		name: 'Dark app icons',
		description: 'Alternate app icons for dark mode on mobile.',
		kind: 'release',
		owner: 'Mobile',
		updatedAt: '1w ago',
		environments: { development: true, staging: false, production: false }
	},
	{
		key: 'beta-ai-summaries',
		name: 'AI summaries (beta)',
		description: 'Summaries on long threads for beta customers.',
		kind: 'permission',
		owner: 'Search',
		updatedAt: '8h ago',
		environments: { development: true, staging: true, production: true }
	}
];

export const initialActivity: ActivityEntry[] = [
	{ id: 10, flagKey: 'new-checkout-flow', environment: 'staging', enabled: true, actor: 'Lena K.', at: '2h ago' },
	{ id: 9, flagKey: 'onboarding-checklist', environment: 'development', enabled: true, actor: 'Sam R.', at: '5h ago' },
	{ id: 8, flagKey: 'beta-ai-summaries', environment: 'production', enabled: true, actor: 'Priya N.', at: '8h ago' },
	{ id: 7, flagKey: 'apple-pay', environment: 'production', enabled: true, actor: 'Lena K.', at: 'Yesterday' },
	{ id: 6, flagKey: 'search-semantic-ranking', environment: 'staging', enabled: true, actor: 'Omar T.', at: '1d ago' },
	{ id: 5, flagKey: 'onboarding-checklist', environment: 'staging', enabled: false, actor: 'Sam R.', at: '2d ago' },
	{ id: 4, flagKey: 'pricing-page-v3', environment: 'production', enabled: true, actor: 'Ines M.', at: '3d ago' },
	{ id: 3, flagKey: 'rate-limit-v2', environment: 'production', enabled: true, actor: 'Dev P.', at: '4d ago' },
	{ id: 2, flagKey: 'admin-audit-export', environment: 'staging', enabled: true, actor: 'Dev P.', at: '6d ago' },
	{ id: 1, flagKey: 'read-only-mode', environment: 'production', enabled: false, actor: 'Dev P.', at: '2w ago' }
];

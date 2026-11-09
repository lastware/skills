// Mocked customer-support data. Replace with real API calls later.

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketChannel = 'email' | 'chat' | 'phone' | 'web';

export interface Agent {
	id: string;
	name: string;
	team: TeamId;
}

export type TeamId = 'billing' | 'technical' | 'onboarding';

export interface Team {
	id: TeamId;
	name: string;
}

export interface Ticket {
	id: string;
	subject: string;
	customer: string;
	email: string;
	status: TicketStatus;
	priority: TicketPriority;
	channel: TicketChannel;
	team: TeamId;
	assigneeId: string | null;
	/** ISO timestamp */
	createdAt: string;
	/** ISO timestamp */
	updatedAt: string;
	/** Hours until the SLA deadline; negative means breached. */
	slaHoursLeft: number;
	/** Customer satisfaction, 1-5, only for resolved tickets. */
	csat: number | null;
	tags: string[];
}

export interface Kpi {
	id: string;
	label: string;
	value: string;
	/** Change versus previous period, as a signed percentage. */
	delta: number;
	/** Whether a positive delta is good news. */
	higherIsBetter: boolean;
	icon: 'confirmation_number' | 'timer' | 'sentiment_satisfied' | 'done_all';
	/** Optional normalized progress toward a target, 0-1. */
	progress?: number;
	progressLabel?: string;
}

export const CURRENT_AGENT_ID = 'a1';

export const teams: Team[] = [
	{ id: 'billing', name: 'Billing' },
	{ id: 'technical', name: 'Technical' },
	{ id: 'onboarding', name: 'Onboarding' }
];

export const agents: Agent[] = [
	{ id: 'a1', name: 'Maya Chen', team: 'technical' },
	{ id: 'a2', name: 'Liam Okafor', team: 'billing' },
	{ id: 'a3', name: 'Sofia Rossi', team: 'onboarding' },
	{ id: 'a4', name: 'Noah Schmidt', team: 'technical' },
	{ id: 'a5', name: 'Aisha Patel', team: 'billing' }
];

export const statusLabels: Record<TicketStatus, string> = {
	open: 'Open',
	pending: 'Pending',
	resolved: 'Resolved',
	closed: 'Closed'
};

export const priorityLabels: Record<TicketPriority, string> = {
	low: 'Low',
	medium: 'Medium',
	high: 'High',
	urgent: 'Urgent'
};

export const channelLabels: Record<TicketChannel, string> = {
	email: 'Email',
	chat: 'Chat',
	phone: 'Phone',
	web: 'Web form'
};

export const tickets: Ticket[] = [
	{
		id: 'T-1042',
		subject: 'Charged twice for annual plan',
		customer: 'Northwind Traders',
		email: 'ap@northwind.example',
		status: 'open',
		priority: 'urgent',
		channel: 'email',
		team: 'billing',
		assigneeId: 'a2',
		createdAt: '2026-11-09T07:12:00Z',
		updatedAt: '2026-11-09T09:40:00Z',
		slaHoursLeft: -1.5,
		csat: null,
		tags: ['refund', 'invoice']
	},
	{
		id: 'T-1041',
		subject: 'SSO login loops back to sign-in page',
		customer: 'Contoso Ltd',
		email: 'it@contoso.example',
		status: 'open',
		priority: 'high',
		channel: 'chat',
		team: 'technical',
		assigneeId: 'a1',
		createdAt: '2026-11-09T06:05:00Z',
		updatedAt: '2026-11-09T08:55:00Z',
		slaHoursLeft: 2,
		csat: null,
		tags: ['sso', 'auth']
	},
	{
		id: 'T-1040',
		subject: 'How do I invite my team?',
		customer: 'Fabrikam Studio',
		email: 'hello@fabrikam.example',
		status: 'pending',
		priority: 'low',
		channel: 'web',
		team: 'onboarding',
		assigneeId: 'a3',
		createdAt: '2026-11-08T16:30:00Z',
		updatedAt: '2026-11-09T08:10:00Z',
		slaHoursLeft: 20,
		csat: null,
		tags: ['how-to']
	},
	{
		id: 'T-1039',
		subject: 'Webhook deliveries failing with 502',
		customer: 'Tailspin Toys',
		email: 'dev@tailspin.example',
		status: 'open',
		priority: 'urgent',
		channel: 'email',
		team: 'technical',
		assigneeId: null,
		createdAt: '2026-11-08T22:47:00Z',
		updatedAt: '2026-11-09T05:20:00Z',
		slaHoursLeft: -4,
		csat: null,
		tags: ['api', 'webhooks']
	},
	{
		id: 'T-1038',
		subject: 'Request VAT number on invoices',
		customer: 'Adventure Works',
		email: 'finance@adventure.example',
		status: 'resolved',
		priority: 'medium',
		channel: 'email',
		team: 'billing',
		assigneeId: 'a5',
		createdAt: '2026-11-08T10:00:00Z',
		updatedAt: '2026-11-08T15:45:00Z',
		slaHoursLeft: 12,
		csat: 5,
		tags: ['invoice']
	},
	{
		id: 'T-1037',
		subject: 'CSV import drops rows with accents',
		customer: 'Wide World Importers',
		email: 'ops@wideworld.example',
		status: 'pending',
		priority: 'high',
		channel: 'phone',
		team: 'technical',
		assigneeId: 'a4',
		createdAt: '2026-11-08T09:15:00Z',
		updatedAt: '2026-11-09T07:30:00Z',
		slaHoursLeft: 5,
		csat: null,
		tags: ['import', 'bug']
	},
	{
		id: 'T-1036',
		subject: 'Onboarding call reschedule',
		customer: 'Litware Inc',
		email: 'pm@litware.example',
		status: 'closed',
		priority: 'low',
		channel: 'phone',
		team: 'onboarding',
		assigneeId: 'a3',
		createdAt: '2026-11-07T13:20:00Z',
		updatedAt: '2026-11-07T14:00:00Z',
		slaHoursLeft: 30,
		csat: 4,
		tags: ['scheduling']
	},
	{
		id: 'T-1035',
		subject: 'API rate limit too low for nightly sync',
		customer: 'Proseware',
		email: 'eng@proseware.example',
		status: 'open',
		priority: 'medium',
		channel: 'web',
		team: 'technical',
		assigneeId: 'a1',
		createdAt: '2026-11-07T11:00:00Z',
		updatedAt: '2026-11-08T17:25:00Z',
		slaHoursLeft: 9,
		csat: null,
		tags: ['api', 'limits']
	},
	{
		id: 'T-1034',
		subject: 'Downgrade plan at end of cycle',
		customer: 'Lucerne Publishing',
		email: 'admin@lucerne.example',
		status: 'resolved',
		priority: 'low',
		channel: 'chat',
		team: 'billing',
		assigneeId: 'a2',
		createdAt: '2026-11-06T15:40:00Z',
		updatedAt: '2026-11-07T09:00:00Z',
		slaHoursLeft: 40,
		csat: 3,
		tags: ['plan-change']
	},
	{
		id: 'T-1033',
		subject: 'Workspace setup checklist missing steps',
		customer: 'Coho Winery',
		email: 'owner@coho.example',
		status: 'open',
		priority: 'medium',
		channel: 'chat',
		team: 'onboarding',
		assigneeId: null,
		createdAt: '2026-11-06T08:30:00Z',
		updatedAt: '2026-11-08T12:00:00Z',
		slaHoursLeft: 1,
		csat: null,
		tags: ['docs']
	}
];

export const kpis: Kpi[] = [
	{
		id: 'open',
		label: 'Open tickets',
		value: '128',
		delta: 6.2,
		higherIsBetter: false,
		icon: 'confirmation_number'
	},
	{
		id: 'frt',
		label: 'First response time',
		value: '1h 12m',
		delta: -14.5,
		higherIsBetter: false,
		icon: 'timer',
		progress: 0.82,
		progressLabel: 'SLA met for 82% of tickets'
	},
	{
		id: 'csat',
		label: 'Customer satisfaction',
		value: '4.6 / 5',
		delta: 2.1,
		higherIsBetter: true,
		icon: 'sentiment_satisfied',
		progress: 0.92,
		progressLabel: '92% positive ratings'
	},
	{
		id: 'resolved',
		label: 'Resolved this week',
		value: '342',
		delta: 9.8,
		higherIsBetter: true,
		icon: 'done_all'
	}
];

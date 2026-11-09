import type { IconName } from 'bref-ui/types';

export type ModelId = 'claude-opus' | 'claude-sonnet' | 'claude-haiku' | 'gpt-4o' | 'gemini-pro';

export interface Model {
	id: ModelId;
	label: string;
}

export interface Tag {
	id: string;
	label: string;
	icon: IconName;
}

export interface Prompt {
	id: string;
	title: string;
	description: string;
	body: string;
	tags: string[];
	model: ModelId;
	author: string;
	updatedAt: string; // ISO date
	uses: number;
}

export const models: Model[] = [
	{ id: 'claude-opus', label: 'Claude Opus' },
	{ id: 'claude-sonnet', label: 'Claude Sonnet' },
	{ id: 'claude-haiku', label: 'Claude Haiku' },
	{ id: 'gpt-4o', label: 'GPT-4o' },
	{ id: 'gemini-pro', label: 'Gemini Pro' }
];

export const tags: Tag[] = [
	{ id: 'writing', label: 'Writing', icon: 'description' },
	{ id: 'code', label: 'Code', icon: 'code' },
	{ id: 'support', label: 'Support', icon: 'support_agent' },
	{ id: 'marketing', label: 'Marketing', icon: 'campaign' },
	{ id: 'analysis', label: 'Analysis', icon: 'analytics' },
	{ id: 'email', label: 'Email', icon: 'mail' },
	{ id: 'translation', label: 'Translation', icon: 'translate' },
	{ id: 'learning', label: 'Learning', icon: 'school' }
];

export const prompts: Prompt[] = [
	{
		id: 'p-01',
		title: 'Code review assistant',
		description: 'Reviews a diff for correctness bugs first, style nits last.',
		body: 'You are a senior engineer reviewing a pull request.\n\nReview the diff below. List correctness bugs first, then risky changes, then style nits. For each finding, quote the line and suggest a fix.\n\n<diff>\n{{diff}}\n</diff>',
		tags: ['code', 'analysis'],
		model: 'claude-opus',
		author: 'Lena Park',
		updatedAt: '2026-11-07',
		uses: 1284
	},
	{
		id: 'p-02',
		title: 'Refund request reply',
		description: 'Empathetic support reply that follows the refund policy.',
		body: 'Write a reply to the customer below. Acknowledge the problem, explain whether they qualify under our 30-day refund policy, and give clear next steps. Keep it under 120 words.\n\nCustomer message:\n{{message}}',
		tags: ['support', 'email'],
		model: 'claude-sonnet',
		author: 'Marco Ruiz',
		updatedAt: '2026-11-05',
		uses: 932
	},
	{
		id: 'p-03',
		title: 'Launch announcement',
		description: 'Turns release notes into a punchy product announcement.',
		body: 'Turn these release notes into a launch post for our blog. Lead with the user benefit, include one concrete example, and end with a call to action.\n\nRelease notes:\n{{notes}}',
		tags: ['marketing', 'writing'],
		model: 'claude-sonnet',
		author: 'Ava Chen',
		updatedAt: '2026-11-02',
		uses: 417
	},
	{
		id: 'p-04',
		title: 'SQL from plain English',
		description: 'Generates a Postgres query from a question and a schema.',
		body: 'Given the schema below, write a single PostgreSQL query that answers the question. Explain any assumptions in one sentence after the query.\n\nSchema:\n{{schema}}\n\nQuestion: {{question}}',
		tags: ['code', 'analysis'],
		model: 'gpt-4o',
		author: 'Lena Park',
		updatedAt: '2026-10-29',
		uses: 2210
	},
	{
		id: 'p-05',
		title: 'Meeting notes summary',
		description: 'Decisions, owners and deadlines from a raw transcript.',
		body: 'Summarize this meeting transcript. Output three sections: Decisions, Action items (owner + due date), and Open questions. Skip small talk.\n\n{{transcript}}',
		tags: ['writing', 'analysis'],
		model: 'claude-haiku',
		author: 'Sam Okafor',
		updatedAt: '2026-10-24',
		uses: 3105
	},
	{
		id: 'p-06',
		title: 'Localize UI strings',
		description: 'Translates interface copy while keeping placeholders intact.',
		body: 'Translate the following UI strings into {{language}}. Keep every {placeholder} unchanged, match the tone of a friendly productivity app, and keep each string within 10% of its original length.\n\n{{strings}}',
		tags: ['translation', 'code'],
		model: 'gemini-pro',
		author: 'Ava Chen',
		updatedAt: '2026-10-18',
		uses: 588
	},
	{
		id: 'p-07',
		title: 'Cold outreach email',
		description: 'Short, specific first-touch email for a B2B prospect.',
		body: 'Write a cold email to {{name}}, {{role}} at {{company}}. Reference one specific detail about their company, state one problem we solve, and ask for a 15-minute call. Max 90 words, no buzzwords.',
		tags: ['email', 'marketing'],
		model: 'claude-sonnet',
		author: 'Marco Ruiz',
		updatedAt: '2026-10-12',
		uses: 761
	},
	{
		id: 'p-08',
		title: 'Explain like a tutor',
		description: 'Step-by-step explanation with a check-your-understanding quiz.',
		body: 'Explain {{concept}} to a motivated beginner. Use one analogy, build up in three steps, and finish with two short quiz questions (answers hidden at the end).',
		tags: ['learning', 'writing'],
		model: 'claude-opus',
		author: 'Sam Okafor',
		updatedAt: '2026-10-03',
		uses: 349
	},
	{
		id: 'p-09',
		title: 'Bug report triage',
		description: 'Classifies incoming bug reports by severity and component.',
		body: 'Classify the bug report below. Return JSON with fields severity (S1–S4), component, reproducible (true/false) and a one-line summary.\n\n{{report}}',
		tags: ['support', 'code', 'analysis'],
		model: 'claude-haiku',
		author: 'Lena Park',
		updatedAt: '2026-09-27',
		uses: 4012
	}
];

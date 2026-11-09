import type { Color, IconName } from 'bref-ui/types';

export type JobStatus = 'running' | 'queued' | 'completed' | 'failed' | 'stopped';
export type LogLevel = 'info' | 'tool' | 'warn' | 'error' | 'done';

export interface LogLine {
	id: number;
	time: string;
	level: LogLevel;
	message: string;
}

export interface Job {
	id: string;
	agent: string;
	task: string;
	model: string;
	status: JobStatus;
	/** Normalized 0–1. */
	progress: number;
	startedAt: string;
	/** Elapsed seconds. */
	elapsed: number;
	tokens: number;
	costUsd: number;
	step: string;
	logs: LogLine[];
}

export const statusMeta: Record<JobStatus, { label: string; color: Exclude<Color, 'background'>; icon: IconName }> = {
	running: { label: 'Running', color: 'info', icon: 'bolt' },
	queued: { label: 'Queued', color: 'muted', icon: 'hourglass_empty' },
	completed: { label: 'Completed', color: 'success', icon: 'check_circle' },
	failed: { label: 'Failed', color: 'error', icon: 'error' },
	stopped: { label: 'Stopped', color: 'warning', icon: 'cancel' }
};

let logId = 0;
export const nextLogId = () => ++logId;

const at = (h: number, m: number, s: number) =>
	`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

const seed = (start: [number, number, number], lines: [LogLevel, string][]): LogLine[] =>
	lines.map(([level, message], i) => {
		const total = start[0] * 3600 + start[1] * 60 + start[2] + i * 7;
		return {
			id: nextLogId(),
			time: at(Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60),
			level,
			message
		};
	});

export const initialJobs = (): Job[] => [
	{
		id: 'job-4821',
		agent: 'research-scout',
		task: 'Compile competitor pricing report for Q4',
		model: 'claude-opus-5-5',
		status: 'running',
		progress: 0.62,
		startedAt: '14:02:11',
		elapsed: 1124,
		tokens: 184_220,
		costUsd: 3.41,
		step: 'Summarizing 14 of 22 sources',
		logs: seed(
			[14, 2, 11],
			[
				['info', 'Job accepted by worker pool us-east-2 (worker w-17)'],
				['info', 'Loaded plan: 5 steps, budget 400k tokens'],
				['tool', 'web.search("enterprise observability pricing 2026")'],
				['tool', 'web.fetch https://example.com/pricing (200, 48 KB)'],
				['info', 'Extracted 6 pricing tiers from vendor A'],
				['tool', 'web.fetch https://example.org/plans (200, 31 KB)'],
				['warn', 'Vendor C page requires login, falling back to cached copy'],
				['info', 'Summarizing 14 of 22 sources']
			]
		)
	},
	{
		id: 'job-4822',
		agent: 'code-fixer',
		task: 'Fix flaky test in payments/checkout.spec.ts',
		model: 'claude-sonnet-5',
		status: 'running',
		progress: 0.34,
		startedAt: '14:11:40',
		elapsed: 555,
		tokens: 61_902,
		costUsd: 0.58,
		step: 'Running test suite (attempt 3)',
		logs: seed(
			[14, 11, 40],
			[
				['info', 'Cloned repo acme/payments @ 9f3c2e1'],
				['tool', 'shell: npm ci (41s)'],
				['tool', 'shell: npx vitest run checkout.spec.ts'],
				['error', 'checkout.spec.ts > applies coupon: timeout after 5000ms'],
				['info', 'Hypothesis: race between cart hydration and coupon fetch'],
				['tool', 'edit: src/checkout/useCart.ts (+6 −2)'],
				['info', 'Running test suite (attempt 3)']
			]
		)
	},
	{
		id: 'job-4823',
		agent: 'inbox-triage',
		task: 'Label and route 312 support emails',
		model: 'claude-haiku-5',
		status: 'running',
		progress: 0.87,
		startedAt: '13:58:02',
		elapsed: 1373,
		tokens: 402_118,
		costUsd: 0.92,
		step: 'Routing batch 9 of 10',
		logs: seed(
			[13, 58, 2],
			[
				['info', 'Fetched 312 unread messages from support@'],
				['tool', 'classify(batch=1..8) → billing 41, bug 77, how-to 103, other 52'],
				['info', 'Escalated 3 messages tagged "outage" to on-call'],
				['info', 'Routing batch 9 of 10']
			]
		)
	},
	{
		id: 'job-4824',
		agent: 'data-etl',
		task: 'Backfill events table from S3 (Oct 2026)',
		model: 'claude-sonnet-5',
		status: 'failed',
		progress: 0.41,
		startedAt: '13:20:55',
		elapsed: 912,
		tokens: 38_410,
		costUsd: 0.31,
		step: 'Aborted at partition 2026-10-13',
		logs: seed(
			[13, 20, 55],
			[
				['info', 'Listing s3://acme-events/2026/10/ (31 partitions)'],
				['tool', 'warehouse.load(partition=2026-10-12) ok, 1.2M rows'],
				['error', 'warehouse.load(partition=2026-10-13): schema mismatch on column "props"'],
				['error', 'Retry budget exhausted (3/3), aborting job']
			]
		)
	},
	{
		id: 'job-4819',
		agent: 'release-notes',
		task: 'Draft release notes for v2.14.0',
		model: 'claude-opus-5-5',
		status: 'completed',
		progress: 1,
		startedAt: '12:45:30',
		elapsed: 402,
		tokens: 52_660,
		costUsd: 0.97,
		step: 'Draft posted to #releases',
		logs: seed(
			[12, 45, 30],
			[
				['tool', 'git.log v2.13.0..v2.14.0 (87 commits)'],
				['info', 'Grouped changes: 12 features, 31 fixes, 4 breaking'],
				['tool', 'slack.post #releases'],
				['done', 'Draft posted to #releases']
			]
		)
	},
	{
		id: 'job-4825',
		agent: 'research-scout',
		task: 'Weekly literature digest: retrieval evals',
		model: 'claude-sonnet-5',
		status: 'queued',
		progress: 0,
		startedAt: '—',
		elapsed: 0,
		tokens: 0,
		costUsd: 0,
		step: 'Waiting for a free worker',
		logs: seed([14, 20, 0], [['info', 'Queued behind 3 jobs (position 1)']])
	}
];

/** Plausible next log lines per agent, cycled by the simulator. */
export const liveScript: Record<string, [LogLevel, string][]> = {
	'research-scout': [
		['tool', 'web.fetch https://example.net/compare (200, 22 KB)'],
		['info', 'Normalized prices to USD/month'],
		['tool', 'notes.append("Vendor D: usage-based, $0.12/GB")'],
		['info', 'Cross-checking tier limits against docs'],
		['warn', 'Conflicting price for vendor B, keeping the newer source'],
		['tool', 'doc.write report.md (section 3/5)']
	],
	'code-fixer': [
		['tool', 'shell: npx vitest run checkout.spec.ts --repeat 20'],
		['info', '20/20 passed in 38.2s'],
		['tool', 'edit: src/checkout/coupon.ts (+3 −1)'],
		['info', 'Running full payments suite'],
		['tool', 'git.commit "fix(checkout): await cart hydration before coupon"'],
		['info', 'Opening pull request #2291']
	],
	'inbox-triage': [
		['tool', 'classify(batch=9) → billing 6, bug 9, how-to 14, other 3'],
		['info', 'Applied labels to 32 threads'],
		['tool', 'route → billing-team (6), eng-support (9)'],
		['info', 'Drafted 14 how-to replies from help center']
	]
};

export const formatDuration = (seconds: number) => {
	if (seconds <= 0) return '—';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${String(s).padStart(2, '0')}s`;
};

export const nowTime = () => {
	const d = new Date();
	return at(d.getHours(), d.getMinutes(), d.getSeconds());
};

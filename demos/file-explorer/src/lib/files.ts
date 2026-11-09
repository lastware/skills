import type { Color, IconName, TreeItemProps } from 'bref-ui/types';

export type FileKind = 'code' | 'markdown' | 'image' | 'data' | 'config' | 'document';

interface BaseNode {
	/** Unique path from the workspace root, also used as the tree id. */
	id: string;
	name: string;
	modified: string;
	owner: string;
}

export interface FolderNode extends BaseNode {
	type: 'folder';
	description?: string;
	children: FsNode[];
}

export interface ImageMeta {
	width: number;
	height: number;
	alt: string;
	/** Dominant tones, expressed as theme colors so swatches follow light/dark mode. */
	swatches: Color[];
	camera?: string;
}

export interface DocumentMeta {
	pages: number;
	summary: string;
}

export interface FileNode extends BaseNode {
	type: 'file';
	kind: FileKind;
	size: number;
	language?: string;
	tags?: string[];
	content?: string;
	image?: ImageMeta;
	document?: DocumentMeta;
	locked?: boolean;
}

export type FsNode = FolderNode | FileNode;

const code = (lines: string[]) => lines.join('\n');

export const workspace: FolderNode = {
	type: 'folder',
	id: 'acme-web',
	name: 'acme-web',
	owner: 'Léa Martin',
	modified: '2026-11-08T17:42:00Z',
	description: 'Marketing site and customer dashboard',
	children: [
		{
			type: 'folder',
			id: 'acme-web/src',
			name: 'src',
			owner: 'Léa Martin',
			modified: '2026-11-08T17:42:00Z',
			description: 'Application source',
			children: [
				{
					type: 'folder',
					id: 'acme-web/src/lib',
					name: 'lib',
					owner: 'Léa Martin',
					modified: '2026-11-08T17:42:00Z',
					children: [
						{
							type: 'file',
							id: 'acme-web/src/lib/api.ts',
							name: 'api.ts',
							kind: 'code',
							language: 'TypeScript',
							size: 2_431,
							owner: 'Léa Martin',
							modified: '2026-11-08T17:42:00Z',
							tags: ['networking'],
							content: code([
								"import { env } from '$env/dynamic/public';",
								'',
								'export interface Invoice {',
								'\tid: string;',
								'\tcustomer: string;',
								'\tamount: number;',
								"\tstatus: 'paid' | 'pending' | 'overdue';",
								'}',
								'',
								'// Fetch invoices for the signed-in account, newest first.',
								'export async function listInvoices(limit = 20): Promise<Invoice[]> {',
								'\tconst url = new URL(`/v2/invoices?limit=${limit}`, env.PUBLIC_API_URL);',
								"\tconst response = await fetch(url, { credentials: 'include' });",
								'\tif (!response.ok) {',
								'\t\tthrow new Error(`Invoices request failed: ${response.status}`);',
								'\t}',
								'\treturn response.json();',
								'}',
								'',
								'export const totalDue = (invoices: Invoice[]) =>',
								"\tinvoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0);"
							])
						},
						{
							type: 'file',
							id: 'acme-web/src/lib/format.ts',
							name: 'format.ts',
							kind: 'code',
							language: 'TypeScript',
							size: 812,
							owner: 'Noah Ferreira',
							modified: '2026-10-30T09:15:00Z',
							content: code([
								"const currency = new Intl.NumberFormat('en-US', {",
								"\tstyle: 'currency',",
								"\tcurrency: 'USD'",
								'});',
								'',
								'export const money = (value: number) => currency.format(value);',
								'',
								'// Round to the nearest percent for KPI tiles.',
								'export const percent = (value: number) => `${Math.round(value * 100)}%`;'
							])
						}
					]
				},
				{
					type: 'folder',
					id: 'acme-web/src/routes',
					name: 'routes',
					owner: 'Léa Martin',
					modified: '2026-11-07T14:03:00Z',
					children: [
						{
							type: 'file',
							id: 'acme-web/src/routes/+page.svelte',
							name: '+page.svelte',
							kind: 'code',
							language: 'Svelte',
							size: 1_604,
							owner: 'Léa Martin',
							modified: '2026-11-07T14:03:00Z',
							tags: ['ui'],
							content: code([
								'<script lang="ts">',
								"\timport { listInvoices, totalDue } from '$lib/api';",
								"\timport { money } from '$lib/format';",
								'',
								'\tconst invoices = listInvoices();',
								'</script>',
								'',
								'<h1>Billing</h1>',
								'{#await invoices then list}',
								'\t<p>Outstanding: {money(totalDue(list))}</p>',
								'{/await}'
							])
						}
					]
				}
			]
		},
		{
			type: 'folder',
			id: 'acme-web/docs',
			name: 'docs',
			owner: 'Amara Okafor',
			modified: '2026-11-06T11:20:00Z',
			description: 'Product and engineering notes',
			children: [
				{
					type: 'file',
					id: 'acme-web/docs/README.md',
					name: 'README.md',
					kind: 'markdown',
					language: 'Markdown',
					size: 1_948,
					owner: 'Amara Okafor',
					modified: '2026-11-06T11:20:00Z',
					tags: ['onboarding'],
					content: code([
						'# Acme Web',
						'',
						'The marketing site and the **customer dashboard** live in this repository. Both ship from `main` every weekday at 16:00 UTC.',
						'',
						'## Getting started',
						'',
						'- Install dependencies with `npm install`',
						'- Copy `.env.example` to `.env` and fill in the API URL',
						'- Run `npm run dev` and open the local URL it prints',
						'',
						'## Project layout',
						'',
						'Source code lives in `src/`, design assets in `design/`, and seed data for local development in `data/`.',
						'',
						'```',
						'npm run check   # types and svelte-check',
						'npm run build   # production bundle',
						'```',
						'',
						'## Ownership',
						'',
						'Billing belongs to **Team Ledger**; the marketing pages belong to **Team Growth**.'
					])
				},
				{
					type: 'file',
					id: 'acme-web/docs/CHANGELOG.md',
					name: 'CHANGELOG.md',
					kind: 'markdown',
					language: 'Markdown',
					size: 1_122,
					owner: 'Noah Ferreira',
					modified: '2026-11-04T08:47:00Z',
					content: code([
						'# Changelog',
						'',
						'## 2.4.0 · November 4',
						'',
						'- Invoices can be filtered by status',
						'- Overdue totals now include partial payments',
						'- Fixed the date picker closing on scroll',
						'',
						'## 2.3.1 · October 21',
						'',
						'- Faster first paint on the pricing page',
						'- Updated the `Intl` currency formatter for EUR accounts'
					])
				}
			]
		},
		{
			type: 'folder',
			id: 'acme-web/design',
			name: 'design',
			owner: 'Jun Park',
			modified: '2026-11-02T16:10:00Z',
			description: 'Exported marketing assets',
			children: [
				{
					type: 'file',
					id: 'acme-web/design/hero-banner.png',
					name: 'hero-banner.png',
					kind: 'image',
					size: 1_284_220,
					owner: 'Jun Park',
					modified: '2026-11-02T16:10:00Z',
					tags: ['marketing', 'homepage'],
					image: {
						width: 2400,
						height: 1200,
						alt: 'A laptop on a desk showing the billing dashboard, with a warm sunset behind the window.',
						swatches: ['primary', 'warning', 'secondary', 'foreground']
					}
				},
				{
					type: 'file',
					id: 'acme-web/design/team-offsite.jpg',
					name: 'team-offsite.jpg',
					kind: 'image',
					size: 3_906_511,
					owner: 'Jun Park',
					modified: '2026-10-18T13:55:00Z',
					tags: ['about page'],
					image: {
						width: 4032,
						height: 3024,
						alt: 'Twelve people smiling on a pine-covered hillside during the autumn team offsite.',
						swatches: ['success', 'info', 'warning', 'muted'],
						camera: 'Fujifilm X-T5 · 23 mm · f/2.8'
					}
				},
				{
					type: 'file',
					id: 'acme-web/design/logo.svg',
					name: 'logo.svg',
					kind: 'image',
					size: 4_310,
					owner: 'Jun Park',
					modified: '2026-09-29T10:00:00Z',
					tags: ['brand'],
					image: {
						width: 512,
						height: 512,
						alt: 'The Acme wordmark: a rounded triangle beside the word “acme” in lowercase.',
						swatches: ['primary', 'background']
					}
				}
			]
		},
		{
			type: 'folder',
			id: 'acme-web/data',
			name: 'data',
			owner: 'Noah Ferreira',
			modified: '2026-11-01T12:30:00Z',
			description: 'Seed data for local development',
			children: [
				{
					type: 'file',
					id: 'acme-web/data/customers.csv',
					name: 'customers.csv',
					kind: 'data',
					language: 'CSV',
					size: 18_544,
					owner: 'Noah Ferreira',
					modified: '2026-11-01T12:30:00Z',
					tags: ['seed'],
					content: code([
						'id,company,plan,seats,mrr,status',
						'C-1042,Northwind Labs,Enterprise,120,8400,Active',
						'C-1043,Blue Fern Studio,Team,14,420,Active',
						'C-1044,Kestrel Freight,Business,48,1920,Past due',
						'C-1045,Orchid Health,Enterprise,310,21700,Active',
						'C-1046,Paper Lantern,Team,6,180,Trial',
						'C-1047,Granite & Co,Business,32,1280,Cancelled'
					])
				},
				{
					type: 'file',
					id: 'acme-web/data/feature-flags.json',
					name: 'feature-flags.json',
					kind: 'config',
					language: 'JSON',
					size: 356,
					owner: 'Léa Martin',
					modified: '2026-10-27T15:00:00Z',
					content: code([
						'{',
						'\t"invoiceFilters": true,',
						'\t"newPricingPage": false,',
						'\t"partialPayments": true,',
						'\t"rolloutPercent": 25',
						'}'
					])
				}
			]
		},
		{
			type: 'file',
			id: 'acme-web/Q3-board-report.pdf',
			name: 'Q3-board-report.pdf',
			kind: 'document',
			size: 2_740_118,
			owner: 'Amara Okafor',
			modified: '2026-10-12T09:00:00Z',
			tags: ['confidential'],
			locked: true,
			document: {
				pages: 18,
				summary:
					'Quarterly results for the board: revenue grew 14% quarter over quarter, net retention reached 118%, and the self-serve funnel converted 3.1% of trials.'
			}
		},
		{
			type: 'file',
			id: 'acme-web/package.json',
			name: 'package.json',
			kind: 'config',
			language: 'JSON',
			size: 1_017,
			owner: 'Léa Martin',
			modified: '2026-11-08T17:40:00Z',
			content: code([
				'{',
				'\t"name": "acme-web",',
				'\t"version": "2.4.0",',
				'\t"private": true,',
				'\t"type": "module",',
				'\t"scripts": {',
				'\t\t"dev": "vite dev",',
				'\t\t"build": "vite build",',
				'\t\t"check": "svelte-check"',
				'\t}',
				'}'
			])
		},
		{
			type: 'file',
			id: 'acme-web/.env.example',
			name: '.env.example',
			kind: 'config',
			language: 'dotenv',
			size: 142,
			owner: 'Léa Martin',
			modified: '2026-09-15T08:00:00Z',
			content: code([
				'# Copy to .env and fill in for local development',
				'PUBLIC_API_URL=https://api.acme.test',
				'STRIPE_SECRET_KEY=',
				'SENTRY_DSN='
			])
		}
	]
};

const kindIcon: Record<FileKind, IconName> = {
	code: 'code',
	markdown: 'article',
	image: 'image',
	data: 'table_chart',
	config: 'data_object',
	document: 'picture_as_pdf'
};

export const kindLabel: Record<FileKind, string> = {
	code: 'Source code',
	markdown: 'Markdown',
	image: 'Image',
	data: 'Spreadsheet',
	config: 'Configuration',
	document: 'PDF document'
};

export const kindColor: Record<FileKind, Exclude<Color, 'background'>> = {
	code: 'primary',
	markdown: 'info',
	image: 'secondary',
	data: 'success',
	config: 'warning',
	document: 'error'
};

export const iconFor = (node: FsNode): IconName =>
	node.type === 'folder' ? 'folder' : kindIcon[node.kind];

/** Index every node by id for constant-time lookup. */
const index = new Map<string, FsNode>();
const visit = (node: FsNode) => {
	index.set(node.id, node);
	if (node.type === 'folder') node.children.forEach(visit);
};
visit(workspace);

export const findNode = (id: string | undefined): FsNode | undefined =>
	id ? index.get(id) : undefined;

/** Ancestors from the root down to (and including) the node. */
export const pathTo = (id: string): FsNode[] =>
	id
		.split('/')
		.map((_, i, parts) => index.get(parts.slice(0, i + 1).join('/')))
		.filter((node): node is FsNode => node !== undefined);

export const countFiles = (node: FsNode): number =>
	node.type === 'file' ? 1 : node.children.reduce((sum, c) => sum + countFiles(c), 0);

export const totalSize = (node: FsNode): number =>
	node.type === 'file' ? node.size : node.children.reduce((sum, c) => sum + totalSize(c), 0);

/** Convert nodes to TreeView items, keeping only matches (and their ancestors) for a query. */
export const toTreeItems = (nodes: FsNode[], query = ''): TreeItemProps[] => {
	const q = query.trim().toLowerCase();
	return nodes.flatMap((node): TreeItemProps[] => {
		if (node.type === 'folder') {
			const children = toTreeItems(node.children, q);
			if (q && !children.length && !node.name.toLowerCase().includes(q)) return [];
			return [{ id: node.id, label: node.name, icon: { name: 'folder' }, children }];
		}
		if (q && !node.name.toLowerCase().includes(q)) return [];
		return [{ id: node.id, label: node.name, icon: { name: iconFor(node) } }];
	});
};

export const formatSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	const units = ['KB', 'MB', 'GB'];
	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
};

const dateFormat = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	hour: 'numeric',
	minute: '2-digit',
	timeZone: 'UTC'
});

export const formatDate = (iso: string) => `${dateFormat.format(new Date(iso))} UTC`;

export const lineCount = (file: FileNode) => (file.content ? file.content.split('\n').length : 0);

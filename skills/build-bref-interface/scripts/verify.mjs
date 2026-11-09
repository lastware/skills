#!/usr/bin/env node
// Verify a Bref UI interface: real imports, no hard-coded colors, svelte-check, build.
// Run from the project root: node <skill-dir>/scripts/verify.mjs
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
let errors = 0;
let warnings = 0;
const fail = (msg) => (errors++, console.log(`  error    ${msg}`));
const warn = (msg) => (warnings++, console.log(`  warning  ${msg}`));

// 1. Real exports of the installed bref-ui
const indexPath = join(root, 'node_modules/bref-ui/src/lib/index.ts');
if (!existsSync(indexPath)) {
	console.log('bref-ui is not installed (node_modules/bref-ui missing). Run: npm install bref-ui');
	process.exit(1);
}
const version = JSON.parse(readFileSync(join(root, 'node_modules/bref-ui/package.json'), 'utf8')).version;
const exportsSet = new Set(
	[...readFileSync(indexPath, 'utf8').matchAll(/export\s*\{([^}]*)\}/g)].flatMap(([, names]) =>
		names.split(',').map((n) => n.trim().split(/\s+as\s+/).pop()).filter(Boolean)
	)
);
console.log(`bref-ui ${version}: ${exportsSet.size} exports`);

// 2. Scan source files
const files = [];
const walk = (dir) => {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) walk(path);
		else if (/\.(svelte|ts|js)$/.test(name)) files.push(path);
	}
};
if (existsSync(join(root, 'src'))) walk(join(root, 'src'));

let themeCount = 0;
console.log('\nStatic checks');
for (const file of files) {
	const rel = relative(root, file);
	const text = readFileSync(file, 'utf8');
	for (const [, names] of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"](?:bref-ui|#bref)['"]/g)) {
		for (const raw of names.split(',')) {
			const name = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0];
			if (name && !raw.trim().startsWith('type ') && !exportsSet.has(name)) {
				fail(`${rel}: "${name}" is not exported by bref-ui ${version}`);
			}
		}
	}
	themeCount += (text.match(/<Theme[\s/>]/g) ?? []).length;
	// Hard-coded colors anywhere except Theme palette props (palette={...} is the sanctioned place).
	const scrubbed = text.replace(/palette=\{\{[\s\S]*?\}\}/g, '');
	// 6/8-digit hex and rgb() anywhere; 3-digit hex only inside styles (words like #add are common in content).
	const styleText = [...scrubbed.matchAll(/<style[^>]*>([\s\S]*?)<\/style>|style=["{]([^"}]*)["}]/g)].map((m) => m[1] ?? m[2]).join('\n');
	const colors = [
		...(scrubbed.match(/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|\brgba?\(\s*\d/g) ?? []),
		...(styleText.match(/#[0-9a-fA-F]{3}\b(?![\w-])/g) ?? [])
	];
	if (colors.length && (rel.endsWith('.svelte') || /color|background|border/i.test(text))) {
		warn(`${rel}: hard-coded colors ${[...new Set(colors)].join(', ')}; use var(--color-*), color-mix() or the Theme palette`);
	}
}
if (themeCount === 0) fail('<Theme /> is not rendered; add it once in the root layout');
if (themeCount > 1) warn(`<Theme /> rendered ${themeCount} times; render it once at the app root`);
if (!errors && !warnings) console.log('  ok');

// 3. svelte-check and build
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const run = (label, cmd, args) => {
	console.log(`\n${label}: ${cmd} ${args.join(' ')}`);
	const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', env: (({ NO_COLOR, ...e }) => ({ ...e, FORCE_COLOR: '0' }))(process.env), shell: process.platform === 'win32' });
	const out = `${r.stdout}${r.stderr}`.replace(/\x1b\[[0-9;]*m/g, '').trim().split('\n');
	const shown = r.status === 0 ? out.filter((l) => /warn|error|✓|✔|COMPLETED/i.test(l) && !/\bkB\b|trace-warnings/.test(l)).slice(-15) : out;
	console.log(shown.map((l) => `  ${l}`).join('\n'));
	if (r.status !== 0) fail(`${label} failed (exit ${r.status})`);
};
if (pkg.scripts?.check) run('svelte-check', 'npm', ['run', 'check', '--silent']);
else run('svelte-check', 'sh', ['-c', 'npx svelte-kit sync && npx svelte-check']);
if (pkg.scripts?.build) run('build', 'npm', ['run', 'build', '--silent']);
else warn('no build script; production build not verified');

console.log(`\nResult: ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);

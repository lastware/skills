#!/usr/bin/env bun
// Runner for one agent test until the agent-tests CLI implements `eval` and `run`.
// Usage: bun run.ts <eval|run> <test-dir> [files...]
// Env:   AGENT_TESTS_CORE=/path/to/agent-tests/core   (required; tested with commit 498aa5e)
// Reads agent-tests.config.yaml from the current directory. Exits 1 on any flagged result.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const core = process.env.AGENT_TESTS_CORE;
const [mode, testDir, ...files] = process.argv.slice(2);
if (!core || !testDir || (mode !== 'eval' && mode !== 'run')) {
	console.error(
		'Usage: AGENT_TESTS_CORE=<agent-tests/core> bun run.ts <eval|run> <test-dir> [files...]'
	);
	process.exit(2);
}

const lib = await import(join(core, 'index.ts'));
if (!lib.AgentTests) {
	console.error(
		'This agent-tests checkout has no AgentTests export. Update it: git -C <agent-tests> pull'
	);
	process.exit(2);
}
const { AgentTests, Source } = lib;
const { parseYaml } = await import(join(core, 'src/config/parse.ts'));

const definition = parseYaml(readFileSync(join(testDir, 'test.yaml'), 'utf8'));
const config = parseYaml(readFileSync('agent-tests.config.yaml', 'utf8'));

// Trigger globs are OR'ed, so a leading "!" pattern matches every other file in the repo.
const negated = ((definition as any)?.triggers ?? []).flatMap((t: any) =>
	[t.glob ?? []].flat().filter((g: string) => g.startsWith('!')).map((g: string) => `${t.id}: ${g}`)
);
if (negated.length) {
	console.error(
		`Globs starting with "!" select every other file, they don't exclude:\n  ${negated.join('\n  ')}\n` +
			'Exclude inside a segment instead, e.g. src/**/!(logger).ts, and cover it with a skip eval.'
	);
	process.exit(2);
}

// Default: tracked files plus new untracked ones (the latest violation is often not committed yet).
const gitFiles = (...args: string[]) =>
	Bun.spawnSync(['git', 'ls-files', ...args]).stdout.toString().split('\n').filter(Boolean);
const paths = [
	...new Set(files.length ? files : [...gitFiles(), ...gitFiles('--others', '--exclude-standard')])
].filter((path) => !/(^|\/)\.agents\/tests\//.test(path));
const sources = paths.map((path) => new Source(path, async () => readFileSync(path, 'utf8')));

const suite = new AgentTests(mode === 'run' ? sources : [], [definition], config);
const [test] = suite.tests;

if (mode === 'eval') {
	const [{ result }] = await suite.eval(true);
	const total = result.flagged.length + result.cleared.length;
	console.log(`evals: ${result.cleared.length}/${total} matched their label`);
	process.exit(result.flagged.length ? 1 : 0);
}

const [{ check }] = await suite.run(false);
for (const { source, check: c } of check.flagged) {
	// Line hints: where the check's grep patterns match. Like the check, they run on the whole
	// file, so multi-line patterns point at the line where each match starts. Model-only checks have none.
	const text = readFileSync(source.path, 'utf8');
	const starts = new Set<number>();
	for (const pattern of c.grep ? [c.grep].flat() : []) {
		for (const m of text.matchAll(new RegExp(pattern, 'g')))
			starts.add(text.slice(0, m.index).split('\n').length);
	}
	const lines = [...starts].sort((a, b) => a - b);
	const where = lines.length ? `${source.path}:${lines.join(',')}` : source.path;
	console.log(`${where}  error  ${c.error}  (${test.id}/${c.id})`);
}
console.log(`${check.flagged.length} finding(s)`);
process.exit(check.flagged.length ? 1 : 0);

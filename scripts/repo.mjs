#!/usr/bin/env node
// Repo checks for mlgxiii/skills.
//   node scripts/repo.mjs check      fail if a skill, demo or plugin entry is missing a piece
//   node scripts/repo.mjs projects   print the JSON list of projects CI must verify
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const isDir = (p) => existsSync(join(root, p)) && statSync(join(root, p)).isDirectory();
const dirs = (p) => (isDir(p) ? readdirSync(join(root, p)).filter((d) => !d.startsWith('.') && isDir(`${p}/${d}`)) : []);

// skills/<package>/<skill>/SKILL.md
const skills = dirs('skills').flatMap((pkg) => dirs(`skills/${pkg}`).map((name) => ({ pkg, name, dir: `skills/${pkg}/${name}` })));
// demos/<package>/<demo>/
const demos = dirs('demos').flatMap((pkg) => dirs(`demos/${pkg}`).map((name) => ({ pkg, name, dir: `demos/${pkg}/${name}` })));

const hasVerify = (dir) => {
	if (!existsSync(join(root, dir, 'package.json'))) return false;
	return Boolean(JSON.parse(read(`${dir}/package.json`)).scripts?.verify);
};
const projects = [...skills.map((s) => `${s.dir}/example`).filter(isDir), ...demos.map((d) => d.dir)];

if (process.argv[2] === 'projects') {
	console.log(JSON.stringify(projects));
	process.exit(0);
}
if (process.argv[2] !== 'check') {
	console.error('usage: node scripts/repo.mjs check|projects');
	process.exit(2);
}

const errors = [];
const fail = (msg) => errors.push(msg);

const marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
const readme = read('README.md');
const listed = new Map(); // skill dir -> plugin name

const pluginNames = new Set();
for (const plugin of marketplace.plugins) {
	if (pluginNames.has(plugin.name)) fail(`marketplace.json: plugin "${plugin.name}" is listed twice`);
	pluginNames.add(plugin.name);
	const source = posix.normalize(plugin.source);
	if (!/^skills\/[^/]+$/.test(source)) fail(`marketplace.json: plugin "${plugin.name}" source must be "./skills/<package>", got "${plugin.source}"`);
	if (!isDir(source)) fail(`marketplace.json: plugin "${plugin.name}" source ${plugin.source} does not exist`);
	for (const s of plugin.skills ?? []) {
		const dir = posix.join(source, s);
		if (!existsSync(join(root, dir, 'SKILL.md'))) fail(`marketplace.json: plugin "${plugin.name}" lists ${s}, but ${dir}/SKILL.md does not exist`);
		listed.set(dir, plugin.name);
	}
}

const skillNames = new Map();
for (const s of skills) {
	const where = `${s.dir}/SKILL.md`;
	if (!existsSync(join(root, where))) {
		fail(`${s.dir}: missing SKILL.md`);
		continue;
	}
	const front = read(where).match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
	const name = front.match(/^name:\s*(.+)$/m)?.[1].trim();
	const description = front.match(/^description:\s*(.+)$/m)?.[1].trim();
	if (name !== s.name) fail(`${where}: frontmatter name is "${name}", but the folder is "${s.name}"`);
	if (!description) fail(`${where}: frontmatter needs a description`);
	if (skillNames.has(s.name)) fail(`${where}: skill name "${s.name}" is also used by ${skillNames.get(s.name)}`);
	skillNames.set(s.name, s.dir);

	if (!listed.has(s.dir)) fail(`${s.dir}: not listed under any plugin in .claude-plugin/marketplace.json`);
	if (!isDir(`${s.dir}/example`)) fail(`${s.dir}: needs an example/ project that CI verifies`);
	if (!readme.includes(`(${where})`)) fail(`README.md: add ${s.name} to the skills table, linking (${where})`);
}

for (const d of demos) {
	if (!isDir(`skills/${d.pkg}`)) fail(`${d.dir}: no skills/${d.pkg}/ package for this demo`);
}
for (const p of projects) {
	if (!hasVerify(p)) fail(`${p}: package.json needs a "verify" script that runs the skill's verifier`);
}

if (errors.length) {
	console.error(`Repo check failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
	process.exit(1);
}
console.log(`Repo check passed: ${skills.length} skill(s), ${marketplace.plugins.length} plugin(s), ${projects.length} project(s) to verify.`);

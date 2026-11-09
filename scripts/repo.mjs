#!/usr/bin/env node
// Repo checks for mlgxiii/skills.
//   node scripts/repo.mjs check      fail if a skill or demo is missing a piece
//   node scripts/repo.mjs projects   print the JSON list of projects CI must verify
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const isDir = (p) => existsSync(join(root, p)) && statSync(join(root, p)).isDirectory();
const dirs = (p) => (isDir(p) ? readdirSync(join(root, p)).filter((d) => !d.startsWith('.') && isDir(`${p}/${d}`)) : []);

// skills/<skill>/SKILL.md, checked by an example/ project (CI builds it) and/or tests/<skill>/ (npm test).
const skills = dirs('skills').map((name) => ({ name, dir: `skills/${name}` }));
// demos/<package>/<demo>/
const demos = dirs('demos').flatMap((pkg) => dirs(`demos/${pkg}`).map((name) => `demos/${pkg}/${name}`));
const projects = [...skills.map((s) => `${s.dir}/example`).filter((p) => existsSync(join(root, p, 'package.json'))), ...demos];

if (process.argv[2] === 'projects') {
	console.log(JSON.stringify(projects));
	process.exit(0);
}
if (process.argv[2] !== 'check') {
	console.error('usage: node scripts/repo.mjs check|projects');
	process.exit(2);
}

const errors = [];
const warnings = [];
const readme = read('README.md');

for (const s of skills) {
	const where = `${s.dir}/SKILL.md`;
	if (!existsSync(join(root, where))) {
		errors.push(`${s.dir}: missing SKILL.md`);
		continue;
	}
	const front = read(where).match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
	const name = front.match(/^name:\s*(.+)$/m)?.[1].trim();
	const description = front.match(/^description:\s*(.+)$/m)?.[1].trim();
	if (name !== s.name) errors.push(`${where}: frontmatter name is "${name}", but the folder is "${s.name}"`);
	if (!description) errors.push(`${where}: frontmatter needs a description`);
	if (!readme.includes(`(${where})`)) errors.push(`README.md: add ${s.name} to the skills table, linking (${where})`);
	if (!projects.includes(`${s.dir}/example`) && !isDir(`tests/${s.name}`))
		warnings.push(`${s.name}: nothing in this repo checks it yet (add ${s.dir}/example/ or tests/${s.name}/)`);
}

for (const p of projects) {
	if (!JSON.parse(read(`${p}/package.json`)).scripts?.verify) errors.push(`${p}: package.json needs a "verify" script that runs the skill's verifier`);
}
for (const t of dirs('tests')) {
	if (!isDir(`skills/${t}`)) errors.push(`tests/${t}: no skills/${t}/ for these tests`);
}

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
	console.error(`Repo check failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
	process.exit(1);
}
console.log(`Repo check passed: ${skills.length} skill(s), ${projects.length} project(s) to verify.`);

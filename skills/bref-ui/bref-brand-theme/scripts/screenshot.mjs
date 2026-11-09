#!/usr/bin/env node
// Build, serve and screenshot a SvelteKit app with headless Chrome, then stop the server.
// Run from the project root: node <skill-dir>/scripts/screenshot.mjs [path ...] [--out dir] [--size 1440,1000]
// Paths default to "/". Add query params to capture states, e.g. "/?file=docs/README.md" or "/?dialog=edit".
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
	const i = args.indexOf(name);
	return i === -1 ? fallback : args.splice(i, 2)[1];
};
const outDir = resolve(opt('--out', 'screenshots'));
const size = opt('--size', '1440,1000');
const paths = args.length ? args : ['/'];

const chrome = [
	process.env.CHROME_PATH,
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	'/Applications/Chromium.app/Contents/MacOS/Chromium',
	'google-chrome',
	'chromium',
	'chromium-browser'
].find((c) => c && (c.startsWith('/') ? existsSync(c) : spawnSync('which', [c]).status === 0));
if (!chrome) {
	console.log('No Chrome/Chromium found. Set CHROME_PATH, or use a browser tool to view the page.');
	process.exit(2);
}

console.log('Building…');
const build = spawnSync('npm', ['run', 'build', '--silent'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(1);

// A fresh server per run; vite preview caches the build it started with.
const port = 4900 + Math.floor(Math.random() * 500);
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
	stdio: 'ignore',
	detached: true
});
const stop = () => {
	try {
		process.kill(-server.pid);
	} catch {}
};
process.on('exit', stop);

const base = `http://localhost:${port}`;
let up = false;
for (let i = 0; i < 40 && !up; i++) {
	up = await fetch(base).then((r) => r.ok, () => false);
	if (!up) await new Promise((r) => setTimeout(r, 250));
}
if (!up) {
	console.log(`Preview server did not start on ${base}`);
	process.exit(1);
}

mkdirSync(outDir, { recursive: true });
for (const path of paths) {
	const name = (path.replace(/^\/+/, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'index') + '.png';
	const file = join(outDir, name);
	spawnSync(chrome, [
		'--headless=new',
		'--disable-gpu',
		'--hide-scrollbars',
		`--window-size=${size}`,
		'--virtual-time-budget=4000',
		`--screenshot=${file}`,
		`${base}${path.startsWith('/') ? path : `/${path}`}`
	], { stdio: 'ignore' });
	console.log(existsSync(file) ? `saved ${file}` : `failed ${path}`);
}
stop();
process.exit(0);

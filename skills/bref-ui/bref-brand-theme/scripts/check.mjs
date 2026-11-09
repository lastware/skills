#!/usr/bin/env node
// Checks a Bref UI brand palette the way Bref paints it, in light and dark mode. No dependencies: plain Node 18+.
//
//   node check.mjs <brand.json>                 report every text/background pair Bref will draw; exit 1 if one fails
//   node check.mjs <brand.json> --fix           print a corrected brand.json (same hues, adjusted lightness) to stdout
//   node check.mjs <brand.json> --fix --write   correct the file in place
//
// brand.json: { "palette": { "light": { "primary": "#…", … }, "dark": { … } } } or one shared palette.
// Roles you leave out keep Bref's defaults, and are checked too, because they sit next to yours.
//
// The pairs come from Bref 3.1.1's surface recipes (core/src/lib/theme/surfaces.svelte):
//   text     body text:  foreground on background
//   plain    a neutral Pill, Button or Icon in color C: mix(C 80%, foreground) on mix(C 2%, background)
//   soft     a soft Pill or Button:                     mix(C 80%, foreground) on mix(C 24%, background)
//   filled   a filled Pill or Button:                   background on C
// Every pair must reach WCAG AA for normal text, 4.5:1. Bref's labels are normal-size text.
import { readFileSync, writeFileSync } from 'node:fs';

export const ROLES = ['primary', 'secondary', 'background', 'foreground', 'muted', 'info', 'success', 'warning', 'error'];
const ACCENTS = ['primary', 'secondary', 'muted', 'info', 'success', 'warning', 'error'];
export const MIN = 4.5;

// Bref 3.1.1 defaults (core/src/lib/theme/colors.svelte).
export const DEFAULTS = {
	light: { primary: '#1d4ed8', secondary: '#c51630', background: '#f1eee7', foreground: '#151515', muted: '#696661', info: '#2563b8', success: '#34745a', warning: '#945c08', error: '#bc2436' },
	dark: { primary: '#92b4df', secondary: '#df97a5', background: '#18191c', foreground: '#eceef2', muted: '#acb0b8', info: '#a3c1d1', success: '#abc3a3', warning: '#d9bc82', error: '#dfa4a7' }
};

const HEX = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;
const rgb = (hex) => {
	let h = hex.slice(1);
	if (h.length === 3) h = [...h].map((c) => c + c).join('');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const hex = (c) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
// CSS color-mix(in srgb, a p%, b): straight interpolation of the gamma-encoded channels.
const mix = (a, p, b) => a.map((v, i) => v * p + b[i] * (1 - p));
const lum = (c) => {
	const [r, g, b] = c.map((v) => {
		const s = v / 255;
		return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
	const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
	return (x + 0.05) / (y + 0.05);
};

/** Normalize brand.json into { light, dark } with every role filled in. Throws on an invalid hex value. */
export function resolve(brand) {
	const palette = brand.palette ?? brand;
	const modes = 'light' in palette || 'dark' in palette ? palette : { light: palette, dark: palette };
	const out = {};
	for (const mode of ['light', 'dark']) {
		out[mode] = { ...DEFAULTS[mode] };
		for (const [role, value] of Object.entries(modes[mode] ?? {})) {
			if (!ROLES.includes(role)) throw new Error(`palette.${mode}.${role}: Bref has no "${role}" color. Use one of ${ROLES.join(', ')}.`);
			if (!HEX.test(value)) throw new Error(`palette.${mode}.${role}: "${value}" must be a #rgb or #rrggbb hex color.`);
			out[mode][role] = value;
		}
	}
	return out;
}

/** Every pair Bref draws for one role in one mode. */
function pairs(p, role) {
	const bg = rgb(p.background);
	const fg = rgb(p.foreground);
	if (role === 'background' || role === 'foreground') return [{ kind: 'text', role: 'foreground', ink: fg, paper: bg }];
	const c = rgb(p[role]);
	const ink = mix(c, 0.8, fg);
	return [
		{ kind: 'plain', role, ink, paper: mix(c, 0.02, bg) },
		{ kind: 'soft', role, ink, paper: mix(c, 0.24, bg) },
		{ kind: 'filled', role, ink: bg, paper: c }
	];
}

export function evaluate(resolved) {
	const results = [];
	for (const mode of ['light', 'dark']) {
		for (const role of ['foreground', ...ACCENTS]) {
			for (const pair of pairs(resolved[mode], role)) {
				const ratio = contrast(pair.ink, pair.paper);
				results.push({ mode, role, kind: pair.kind, ratio, ok: ratio >= MIN, ink: hex(pair.ink), paper: hex(pair.paper) });
			}
		}
	}
	return results;
}

// HSL helpers for --fix: keep the hue and saturation, move lightness.
const toHsl = ([r, g, b]) => {
	[r, g, b] = [r / 255, g / 255, b / 255];
	const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
	if (!d) return [0, 0, l];
	const s = d / (1 - Math.abs(2 * l - 1));
	const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return [(h * 60 + 360) % 360, s, l];
};
const fromHsl = ([h, s, l]) => {
	const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
	const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
	return [r, g, b].map((v) => (v + m) * 255);
};

/** Move one role's lightness away from the background, one step at a time, until all its pairs pass. */
function fixRole(p, role) {
	const passes = (q) => pairs(q, role).every((x) => contrast(x.ink, x.paper) >= MIN);
	if (passes(p)) return null;
	const target = role === 'background' ? 'foreground' : role;
	const [h, s, l] = toHsl(rgb(p[target]));
	const darker = lum(rgb(p.background)) > 0.18;
	for (let step = 1; step <= 100; step++) {
		const next = Math.min(1, Math.max(0, darker ? l - step / 100 : l + step / 100));
		const candidate = { ...p, [target]: hex(fromHsl([h, s, next])) };
		if (passes(candidate)) return { role: target, from: p[target], to: candidate[target] };
		if (next === 0 || next === 1) break;
	}
	return { role: target, from: p[target], to: null };
}

export function fix(brand) {
	const resolved = resolve(brand);
	const changes = [];
	for (const mode of ['light', 'dark']) {
		for (const role of ['foreground', ...ACCENTS]) {
			const change = fixRole(resolved[mode], role);
			if (!change) continue;
			changes.push({ mode, ...change });
			if (change.to) resolved[mode][change.role] = change.to;
		}
	}
	return { brand: { ...brand, palette: resolved }, changes };
}

function report(results) {
	const failed = results.filter((r) => !r.ok);
	for (const mode of ['light', 'dark']) {
		console.log(`\n${mode}`);
		for (const r of results.filter((x) => x.mode === mode)) {
			const label = r.kind === 'text' ? 'body text' : `${r.role} ${r.kind}`;
			console.log(`  ${r.ok ? '✓' : '✗'} ${label.padEnd(18)} ${r.ratio.toFixed(2).padStart(5)}:1  ${r.ink} on ${r.paper}`);
		}
	}
	console.log(failed.length ? `\n${failed.length} pair(s) below ${MIN}:1. Run with --fix for the nearest passing colors.` : `\nAll ${results.length} pairs reach ${MIN}:1 in light and dark mode.`);
	return failed.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);
	const file = args.find((a) => !a.startsWith('--'));
	if (!file) {
		console.error('usage: node check.mjs <brand.json> [--fix [--write]]');
		process.exit(2);
	}
	let brand;
	try {
		brand = JSON.parse(readFileSync(file, 'utf8'));
		resolve(brand);
	} catch (e) {
		console.error(`${file}: ${e.message}`);
		process.exit(1);
	}
	if (args.includes('--fix')) {
		const { brand: fixed, changes } = fix(brand);
		for (const c of changes) console.error(`${c.mode}.${c.role}: ${c.from} → ${c.to ?? 'no passing lightness at this hue; choose another color'}`);
		if (!changes.length) console.error('Nothing to fix.');
		const json = `${JSON.stringify(fixed, null, '\t')}\n`;
		if (args.includes('--write')) writeFileSync(file, json);
		else process.stdout.write(json);
		process.exit(changes.some((c) => !c.to) ? 1 : 0);
	}
	process.exit(report(evaluate(resolve(brand))) ? 1 : 0);
}

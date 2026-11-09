#!/usr/bin/env node
// Reads a website's brand colors and fonts from its HTML and CSS. No dependencies: plain Node 18+.
//
//   node extract.mjs <url | file.html | file.css …>
//
// Prints JSON: the theme-color meta, CSS custom properties that hold colors, every color ranked by how often it's
// used (split into accents and neutrals), and the font families with where they're loaded from.
// It reads what the page ships. It never guesses: mapping colors to Bref roles is your call, then check.mjs checks it.
import { existsSync, readFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (compatible; bref-brand-theme/1.0; +https://github.com/mlgxiii/skills)';
const MAX_SHEETS = 12;

const get = async (src) => {
	if (existsSync(src)) return readFileSync(src, 'utf8');
	const res = await fetch(src, { headers: { 'user-agent': UA, accept: 'text/html,text/css,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
	if (!res.ok) throw new Error(`${src}: HTTP ${res.status}`);
	return res.text();
};

const toHex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, Number(v)))).toString(16).padStart(2, '0')).join('')}`;
const hsl2hex = (h, s, l) => {
	s /= 100;
	l /= 100;
	const k = (n) => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
	return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
};
/** Every opaque color literal in a chunk of CSS, as lowercase #rrggbb. */
function colors(css) {
	const out = [];
	for (const m of css.matchAll(/#([\da-f]{8}|[\da-f]{6}|[\da-f]{3,4})\b/gi)) {
		let h = m[1].toLowerCase();
		if (h.length === 4 || h.length === 8) {
			const alpha = h.length === 4 ? h[3] + h[3] : h.slice(6);
			if (parseInt(alpha, 16) < 230) continue;
			h = h.length === 4 ? h.slice(0, 3) : h.slice(0, 6);
		}
		if (h.length === 3) h = [...h].map((c) => c + c).join('');
		out.push(`#${h}`);
	}
	for (const m of css.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/gi)) {
		const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
		if (a >= 0.9) out.push(toHex(m[1], m[2], m[3]));
	}
	for (const m of css.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)/gi)) {
		const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
		if (a >= 0.9) out.push(hsl2hex(+m[1], +m[2], +m[3]));
	}
	return out;
}
const saturation = (hex) => {
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
	const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
	return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
};
const lightness = (hex) => {
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
	return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
};

const sources = process.argv.slice(2);
if (!sources.length) {
	console.error('usage: node extract.mjs <url | file.html | file.css …>');
	process.exit(2);
}

const sheets = [];
const meta = {};
const fontLinks = new Set();
const errors = [];
for (const src of sources) {
	let text;
	try {
		text = await get(src);
	} catch (e) {
		errors.push(e.message);
		continue;
	}
	if (!/<html|<head|<link|<style/i.test(text)) {
		sheets.push({ from: src, css: text });
		continue;
	}
	meta.themeColor ??= text.match(/<meta[^>]+name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? text.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']theme-color["']/i)?.[1];
	meta.title ??= text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
	meta.icon ??= text.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1];
	for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) sheets.push({ from: `${src} <style>`, css: m[1] });
	const inline = [...text.matchAll(/style=["']([^"']+)["']/gi)].map((m) => m[1]).join(';\n');
	if (inline) sheets.push({ from: `${src} style=""`, css: inline });
	const links = [...text.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
	for (const tag of links) {
		const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
		if (!href) continue;
		if (/fonts\.googleapis\.com|use\.typekit\.net|fonts\.bunny\.net|rsms\.me\/inter/i.test(href)) fontLinks.add(new URL(href, src).href);
		if (!/rel=["'][^"']*stylesheet/i.test(tag) || sheets.length >= MAX_SHEETS || existsSync(src)) continue;
		const url = new URL(href, src).href;
		try {
			sheets.push({ from: url, css: await get(url) });
		} catch (e) {
			errors.push(e.message);
		}
	}
}

const all = sheets.map((s) => s.css).join('\n');
const count = new Map();
for (const c of colors(all)) count.set(c, (count.get(c) ?? 0) + 1);
const ranked = [...count].sort((a, b) => b[1] - a[1]).map(([hex, uses]) => ({ hex, uses, lightness: +lightness(hex).toFixed(2) }));

const variables = {};
for (const m of all.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) {
	const found = colors(m[2]);
	if (found.length === 1 && !variables[m[1]]) variables[m[1]] = found[0];
}

const families = new Map();
for (const m of all.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
	const first = m[1].split(',')[0].trim().replace(/^["']|["']$/g, '');
	if (!first || first.startsWith('var(') || /^(inherit|initial|unset|sans-serif|serif|monospace|system-ui)$/i.test(first)) continue;
	families.set(first, (families.get(first) ?? 0) + 1);
}
const fontFaces = [...new Set([...all.matchAll(/@font-face\s*{[^}]*font-family\s*:\s*["']?([^"';]+)/gi)].map((m) => m[1].trim()))];

console.log(
	JSON.stringify(
		{
			sources,
			title: meta.title,
			themeColor: meta.themeColor,
			icon: meta.icon,
			stylesheetsRead: sheets.map((s) => s.from),
			colorVariables: variables,
			accents: ranked.filter((c) => saturation(c.hex) >= 0.25 && c.lightness > 0.08 && c.lightness < 0.95).slice(0, 12),
			neutrals: ranked.filter((c) => saturation(c.hex) < 0.25 || c.lightness <= 0.08 || c.lightness >= 0.95).slice(0, 10),
			fonts: [...families].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([family, uses]) => ({ family, uses, selfHosted: fontFaces.includes(family) })),
			fontLinks: [...fontLinks],
			errors
		},
		null,
		2
	)
);
if (!sheets.length) process.exit(1);

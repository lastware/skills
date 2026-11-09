#!/usr/bin/env node
// Reads a website's brand colors and fonts from its HTML and CSS. No dependencies: plain Node 18+.
//
//   node extract.mjs <url | file.html | file.css …>
//
// Prints JSON:
//   themeColor        the <meta name="theme-color"> (often the brand color)
//   colorVariables    CSS custom properties that hold one color, split into light and dark mode
//                     (dark = rules under .dark, [data-theme=dark] or @media (prefers-color-scheme: dark))
//   accents/neutrals  every color literal, ranked by how often it's used
//   fonts             the font families set on body text, headings and code, plus every family ranked by use
//   fontLinks         Google Fonts / Typekit / Bunny stylesheets the page loads
// It reports what the page ships and never guesses: mapping colors to Bref roles is your call, then check.mjs checks it.
import { existsSync, readFileSync } from 'node:fs';

const USAGE = 'usage: node extract.mjs <url | file.html | file.css …>';
const UA = 'Mozilla/5.0 (compatible; bref-brand-theme/1.1; +https://github.com/mlgxiii/skills)';
const MAX_SHEETS = 12;

const args = process.argv.slice(2);
if (!args.length || args.includes('--help') || args.includes('-h')) {
	console.log(USAGE);
	process.exit(args.length ? 0 : 2);
}

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
const alphaOf = (a) => (a === undefined ? 1 : a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a));
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
	for (const m of css.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/gi))
		if (alphaOf(m[4]) >= 0.9) out.push(toHex(m[1], m[2], m[3]));
	for (const m of css.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)/gi))
		if (alphaOf(m[4]) >= 0.9) out.push(hsl2hex(+m[1], +m[2], +m[3]));
	return out;
}
const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const lightness = (hex) => {
	const c = channels(hex);
	return (Math.max(...c) + Math.min(...c)) / 2;
};
const saturation = (hex) => {
	const c = channels(hex), max = Math.max(...c), min = Math.min(...c), l = (max + min) / 2;
	return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
};

/** Flat list of style rules: { selector, context (enclosing selectors and at-rules), body }. Good enough for brand CSS. */
function rules(css) {
	css = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const out = [];
	const stack = [];
	let buf = '';
	for (const ch of css) {
		if (ch === '{') {
			stack.push(buf.trim().split(';').pop().trim());
			buf = '';
		} else if (ch === '}') {
			const selector = stack.pop();
			if (selector && !selector.startsWith('@') && buf.trim()) out.push({ selector, context: stack.join(' '), body: buf });
			buf = '';
		} else buf += ch;
	}
	return out;
}
const DARK = /\.dark\b|\.theme-dark\b|\[data-(?:theme|mode|color-scheme)=["']?dark|prefers-color-scheme:\s*dark/i;
const modeOf = (r) => (DARK.test(`${r.context} ${r.selector}`) ? 'dark' : 'light');
const declarations = (body) =>
	body
		.split(';')
		.map((d) => d.split(/:(.*)/s).map((x) => x?.trim()))
		.filter(([prop, value]) => prop && value);
const firstFamily = (value) => value.split(',')[0].trim().replace(/^["']|["']$/g, '').replace(/\s*!important$/, '');
const GENERIC = /^(inherit|initial|unset|sans-serif|serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace|-apple-system|cursive)$/i;
const roleOf = (selector) =>
	/(^|[\s,>])(code|pre|kbd|samp)\b|mono/i.test(selector) ? 'code'
	: /(^|[\s,>])h[1-6]\b|heading|title|display/i.test(selector) ? 'headings'
	: /(^|[\s,])(html|body|:root)\b/i.test(selector) ? 'text'
	: null;

// Fetch the page and its stylesheets.
const sheets = [];
const meta = {};
const fontLinks = new Set();
const errors = [];
for (const src of args) {
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
	if (inline) sheets.push({ from: `${src} style=""`, css: `[style]{${inline}}` });
	for (const tag of [...text.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0])) {
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
const parsed = rules(all);

// Colors: ranked literals, and color variables per mode (later declarations win, as in the cascade).
const count = new Map();
for (const c of colors(all)) count.set(c, (count.get(c) ?? 0) + 1);
const ranked = [...count].sort((a, b) => b[1] - a[1]).map(([hex, uses]) => ({ hex, uses, lightness: +lightness(hex).toFixed(2) }));
// Collect every custom property per mode, then resolve var() references like a browser would,
// so hsl(var(--hue), 10%, 12%) becomes a real color.
const raw = { light: {}, dark: {} };
for (const r of parsed) for (const [prop, value] of declarations(r.body)) if (prop.startsWith('--')) raw[modeOf(r)][prop] = value;
const resolveVars = (value, mode, depth = 0) =>
	depth > 6 ? value : value.replace(/var\((--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (_, name, fallback) => resolveVars(raw[mode][name] ?? raw.light[name] ?? fallback ?? '', mode, depth + 1));
const colorVariables = { light: {}, dark: {} };
for (const mode of ['light', 'dark']) {
	for (const [prop, value] of Object.entries(raw[mode])) {
		const resolved = resolveVars(value, mode);
		const found = colors(resolved);
		if (found.length === 1 && !/,/.test(resolved.replace(/\([^)]*\)/g, ''))) colorVariables[mode][prop] = found[0];
	}
}
// Font variables: custom properties whose value is a font family list (not a size or weight).
const fontVariables = {};
for (const [prop, value] of Object.entries(raw.light)) {
	const resolved = resolveVars(value, 'light').trim();
	if (/font|family|typeface/i.test(prop) && /^["']?[a-z]/i.test(resolved) && !/^(normal|bold|italic|\d)/i.test(resolved)) fontVariables[prop] = firstFamily(resolved);
}
// Drop dark entries identical to light ones: they tell you nothing.
for (const [k, v] of Object.entries(colorVariables.dark)) if (colorVariables.light[k] === v) delete colorVariables.dark[k];

// Fonts: by role (body text, headings, code), resolving var(--font-…) through the font variables.
const byRole = { text: new Map(), headings: new Map(), code: new Map() };
const families = new Map();
for (const r of parsed) {
	for (const [prop, value] of declarations(r.body)) {
		if (!/^font(-family)?$/i.test(prop)) continue;
		const resolved = resolveVars(value, modeOf(r)).trim();
		// The font shorthand ends with the family list, after the size and optional "/ line-height".
		const famValue = prop.toLowerCase() === 'font' ? resolved.match(/[\d.]+[a-z%]*(?:\s*\/\s*[\d.]+[a-z%]*)?\s+(["']?[a-z].*)$/i)?.[1] : resolved;
		if (!famValue) continue;
		const family = firstFamily(famValue);
		if (!family || GENERIC.test(family) || /^var\(/.test(family)) continue;
		families.set(family, (families.get(family) ?? 0) + 1);
		const role = roleOf(r.selector);
		if (role) byRole[role].set(family, (byRole[role].get(family) ?? 0) + 1);
	}
}
const top = (m) => [...m].sort((a, b) => b[1] - a[1]).map(([f]) => f);
const fontFaces = [...new Set([...all.matchAll(/@font-face\s*{[^}]*font-family\s*:\s*["']?([^"';]+)/gi)].map((m) => m[1].trim()))];

console.log(
	JSON.stringify(
		{
			sources: args,
			title: meta.title,
			themeColor: meta.themeColor,
			icon: meta.icon,
			stylesheetsRead: sheets.map((s) => s.from),
			colorVariables,
			accents: ranked.filter((c) => saturation(c.hex) >= 0.25 && c.lightness > 0.08 && c.lightness < 0.95).slice(0, 12),
			neutrals: ranked.filter((c) => saturation(c.hex) < 0.25 || c.lightness <= 0.08 || c.lightness >= 0.95).slice(0, 10),
			fonts: {
				text: top(byRole.text),
				headings: top(byRole.headings),
				code: top(byRole.code),
				variables: fontVariables,
				all: top(families).slice(0, 8).map((family) => ({ family, uses: families.get(family), selfHosted: fontFaces.includes(family) }))
			},
			fontLinks: [...fontLinks],
			errors
		},
		null,
		2
	)
);
if (!sheets.length) process.exit(1);

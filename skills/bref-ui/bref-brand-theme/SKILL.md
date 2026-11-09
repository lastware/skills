---
name: bref-brand-theme
description: Make a Bref UI (Svelte 5) app look like a brand by turning its colors and fonts, taken from a website, logo, screenshot, brand guide or hex codes, into a Bref Theme palette and font setup. Then check every text and background pair Bref will draw, in light and dark mode, for WCAG AA contrast, and fix the ones that fail without changing the hue. Use when the user wants Bref to match their brand, site or style, asks for a custom Bref theme or palette, or says Bref "doesn't look like my app".
---

# Match a brand in Bref UI

Turn a brand into Bref's theme: 9 color roles for light and dark mode, plus fonts.
Then prove that every button, pill and text color Bref draws from them stays
readable. Brand colors often fail contrast as they are. Bright oranges, greens
and yellows are the usual ones. Fix them by changing the lightness and keeping
the hue, and tell the user exactly what changed.

Tested with: `bref-ui@3.1.1`, `svelte@5.57`, `@sveltejs/kit@3`.

This skill's folder contains:

- `scripts/extract.mjs`: reads a site's colors, CSS variables and fonts.
- `scripts/check.mjs`: checks a palette the way Bref paints it, and `--fix` corrects it.
- `scripts/screenshot.mjs`: builds, serves and takes a screenshot of the app.
- `reference/brand-preview.svelte`: a page that shows every Bref color and
  variant in light and dark mode side by side.
- `example/`: a finished brand ("Kiln Coffee", fictional) to use as a reference.

## What Bref lets you brand

| Lever | How | Notes |
|---|---|---|
| Colors | `<Theme palette={…}>` | 9 roles: `primary`, `secondary`, `background`, `foreground`, `muted`, `info`, `success`, `warning`, `error`. Hex values only, as `{ light, dark }` or one shared palette. Roles you leave out keep Bref's defaults. |
| Body font | `--font-text` on `:root` | Bref sets `font-family: var(--font-text, var(--font-sans))` on `body`. |
| Heading font | plain CSS on `h1, h2, h3` | Bref doesn't style headings. |
| Corner rounding | `radius` on `Surface` and `Popover` only | Button, TextInput and Pill rounding is fixed in Bref 3.1.1. Don't override component CSS. Tell the user it's a Bref limit. |

Bref has no other theme tokens. Don't invent `--color-accent`, `--radius` or similar: Bref won't read them.

## 1. Check the project

- Read `package.json`. Bref UI needs **Svelte 5.56.1+**. Install it if it's
  missing (`npm install bref-ui`).
- Find where `<Theme>` is rendered, usually `src/routes/+layout.svelte`. It must
  be rendered once, at the root.
- Note the import alias for `src/lib`: `$lib`, or `#lib` under `"imports"` in `package.json`.

## 2. Collect the brand

Use whatever the user gives, in this order of trust:

1. **Hex codes or a brand guide**: use them as given.
2. **A website**: `node <skill-dir>/scripts/extract.mjs https://brand.example`.
   It prints:
   - the `theme-color`
   - CSS color variables for **light and dark mode**, with `var()` references
     resolved. Names like `--brand`, `--primary`, `--accent` or `--fg-accent`
     are strong hints. Use the dark values for the dark palette when the site has them.
   - colors ranked by use, split into accents and neutrals
   - fonts by role (`text`, `headings`, `code`), font variables, and font stylesheets
   The `theme-color` and the most used accent are usually the primary. Buttons
   and links on the page show the real call-to-action color. A site often
   darkens its logo color for text: prefer that darker shade for light mode.
3. **A logo or screenshot**: look at the image and read the dominant colors.
   Say that they're estimates.

If the brand only defines light colors, build the dark palette yourself in step 3.
Don't stop to ask unless you have nothing to go on.

## 3. Map the brand to Bref's roles

Write `src/lib/brand.json`:

```json
{
	"name": "Brand name",
	"source": "Where each color came from: site, guide, logo",
	"palette": {
		"light": { "primary": "#…", "secondary": "#…", "background": "#…", "foreground": "#…", "muted": "#…" },
		"dark":  { "primary": "#…", "secondary": "#…", "background": "#…", "foreground": "#…", "muted": "#…" }
	},
	"fonts": { "text": "…", "heading": "…" }
}
```

- **primary**: the brand's main action color (buttons, links, selected tabs, switches, progress).
- **secondary**: a second brand color, if there is one. If the brand has none,
  don't leave Bref's default: it's crimson (`#c51630`), which clashes with most
  brands and reads like an error. Pick the brand's second most used accent, or a
  deep neutral from the brand (for example its dark text color, tinted), and
  tell the user it's your choice. `check.mjs` prints a note when secondary is missing.
- **background / foreground**: the brand's page and text colors. A slightly
  tinted off-white and off-black usually feel more on-brand than pure white and black.
- **muted**: a neutral grey for secondary text, ideally tinted toward the brand.
- **info, success, warning, error**: keep Bref's defaults unless the brand
  defines them. Don't paint `error` in the brand color: people need to recognize
  red as an error and green as success.
- **Dark mode**: a dark background (not pure black), a light foreground, and
  the same hues made lighter. A brand's dark accent is usually too dark on a
  dark background. `--fix` will lighten it for you.

## 4. Check it, and fix what fails

```sh
node <skill-dir>/scripts/check.mjs src/lib/brand.json
```

It rebuilds the colors Bref really draws, using Bref's own surface formulas:
body text, plus every color role as neutral, soft and filled Buttons and Pills,
in both modes (44 pairs). Each pair must reach **4.5:1** (WCAG AA for normal
text). It exits 1 if any pair fails. Bref's own default palette passes all 44.

If it fails:

```sh
node <skill-dir>/scripts/check.mjs src/lib/brand.json --fix --write
```

`--fix` keeps each failing color's hue and saturation and changes only its
lightness: darker in light mode, lighter in dark mode, until all of that role's
pairs pass. It writes back only the roles you set and the ones it changed; the
rest stay Bref defaults. Rerun the check afterwards. If a color can't pass at its hue, the
script says so: pick a different shade with the user.

**Tell the user what changed**, for example: "Your orange `#ff6b2c` is too light
for white button text (2.7:1). In light mode Bref will use `#c03900`, the same
orange, darker. In dark mode your original orange passes and stays." If a color
must stay exact, such as a logo color, keep it for the logo and illustrations,
and never for text or as a Bref role that fails.

## 5. Apply it

In the root layout:

```svelte
<script lang="ts">
	import brand from '$lib/brand.json'; // or '#lib/brand.json'
	import { Theme } from 'bref-ui';
	import type { ThemeProps } from 'bref-ui/types';
	// check.mjs validates brand.json; JSON imports type hex values as plain strings.
	const palette = brand.palette as ThemeProps['palette'];
	let { children } = $props();
</script>

<Theme {palette}>{@render children()}</Theme>

<style>
	:global(:root) { --font-text: 'DM Sans Variable', var(--font-sans); }
	:global(h1, h2, h3) { font-family: 'Fraunces Variable', Georgia, serif; }
</style>
```

**Fonts.** Load them before you use them:
- Open-licensed fonts (Google Fonts and most fonts on Fontsource): prefer the
  variable package, `@fontsource-variable/<font>`, imported once in the layout;
  its family name ends in "Variable", for example `'DM Sans Variable'`. Check it
  exists with `npm view @fontsource-variable/<font> version`. If it doesn't
  (Fira Sans, DM Serif Display…), install `@fontsource/<font>` and import each
  weight you use: `import '@fontsource/fira-sans/400.css'`, plus `500.css` and
  `600.css`, the weights Bref's components use. The family name is the plain
  font name, for example `'Fira Sans'`.
- A display font that ships one weight (often 400): set `font-weight: 400` on
  the headings that use it. Otherwise the browser draws a fake bold.
- A commercial font that the brand self-hosts: don't copy its files from their
  site, because the brand's licence doesn't cover this project. Ask whether the user
  has a licence. If not, use the closest open-licensed match and say which one you chose.
- Always keep `var(--font-sans)` as the fallback.

## 6. Look at it

Copy `reference/brand-preview.svelte` to `src/routes/brand-preview/+page.svelte`,
then run:

```sh
npm run check
node <skill-dir>/scripts/screenshot.mjs /brand-preview --size 1440,1300
```

Open `screenshots/brand-preview.png`. It shows light and dark mode side by side.
Check that:
- the brand is recognizable: primary buttons, selected tab, switch and progress
  in the brand color
- the fonts loaded (no system font where a brand font should be)
- the status pills still read as info, success, warning and error

Then delete the preview route and the `screenshots/` folder, unless the user
wants to keep them. Don't leave files the user didn't ask for.

## 7. Report

Give the user:

- `brand.json`, and where each color came from
- a table with each brand color, the color Bref uses in light and dark mode,
  and the contrast before and after any fix
- the fonts, how they're loaded, and the licence situation
- what Bref couldn't match (for example Button corner rounding)
- the check result and the screenshot you reviewed

The check proves contrast for Bref's components. It doesn't check your own
custom CSS, images or charts, so say that.

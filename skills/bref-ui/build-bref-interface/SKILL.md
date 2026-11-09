---
name: build-bref-interface
description: Build or extend a Svelte 5 / SvelteKit interface (dashboard, admin panel, settings page, internal tool) with the Bref UI component library, using only the components and props it actually ships, and verify the result with svelte-check, a production build and a screenshot. Use when the user asks for a UI in a Svelte project, mentions bref-ui, or wants an agent-built interface that stays consistent.
---

# Build a Bref UI interface

Build the requested interface from real Bref UI components, prove it compiles,
then look at it. Bref UI is typed, so `svelte-check` rejects invented
components and invalid props. Make that check pass. Don't work around it.

Tested with: `bref-ui@3.1.1`, `svelte@5.57`, `@sveltejs/kit@3`.

This skill's folder contains:

- `reference/gotchas.md`: known traps, both compile errors and layout bugs.
  **Read it before building.**
- `scripts/verify.mjs`: checks the code (step 5).
- `scripts/screenshot.mjs`: builds, serves and takes a screenshot (step 5).
- `example/`: a finished support dashboard built with this skill, to use as a
  reference for structure.

## 1. Check the project

- Read `package.json`. Bref UI requires **Svelte 5.56.1+**. If the project
  uses Svelte 4 or React, stop and tell the user.
- If `bref-ui` is missing, run `npm install bref-ui` (or the project's package manager).
- If `package.json` has a `#bref` import, the project owns copied components.
  Import from `#bref` instead of `bref-ui` in every step below.
- Note the project's import alias for `src/lib`: `$lib`, or a `#lib` entry under
  `"imports"` in `package.json` (import as `#lib/data.js`, which resolves `.ts`).
- Render `<Theme>` **once** in the root layout, usually `src/routes/+layout.svelte`.
  Either wrap `{@render children()}` in it or place it beside it. `Theme`
  doesn't style `body`, so set the page background with tokens if needed.

## 2. Load the real API before planning

- **Usage and accessibility rules:** download the reference verbatim with
  `curl -sL https://feuersteiner.github.io/bref-ui/llms.txt`. Summarising
  fetch tools drop details.
- **Exact props for the installed version:**
  `node_modules/bref-ui/src/lib/<component>/types.ts`. These show which props
  are required.
- **Known traps:** `reference/gotchas.md` in this skill.

`bref-ui` exports components only. Import types (`Color`, `Size`, `IconName`,
`ThemeMode`, …) from `'bref-ui/types'`.

As of 3.1.1, the component set is:

| Need | Use |
|---|---|
| Actions, links | `Button` |
| Layout panels, cards, toolbars | `Surface` |
| Paint a native element like a surface | `surface({...})` class helper |
| Section switching | `Tabs` (bind `value`, render content yourself) |
| Navigation tree, grouped lists | `TreeView` |
| Choose from options | `Select`, `Combobox` (searchable), `PillChoiceGroup` |
| Text entry | `TextInput`, `TextArea` |
| Toggles | `Checkbox`, `Switch` |
| Status, tags | `Pill`, `PillGroup` |
| Feedback | `Progress` (value 0–1), `Spinner` |
| Overlays | `Dialog` (bind `open`), `Popover` |
| Icons | `Icon` (Material Symbols) |
| Theming | `Theme`, `ThemeModeToggle`, `paletteStyle`, and prebuilt themes in `bref-ui-themes` |

The shared prop values are: `Size` = `x-small|small|medium|large|x-large`,
`BaseSize` = `small|medium|large`, `Variant` = `neutral|soft|filled`, and
`Color` = `primary|secondary|foreground|background|muted|info|success|warning|error`.
`Pill`, `Button` and Dialog actions exclude `background`.

## 3. Plan

Write a short plan that maps each region of the UI to a component from the
table above, then proceed. Don't wait for approval unless the request is
ambiguous. For anything Bref doesn't ship, such as **tables, charts, KPI
numbers, avatars, breadcrumbs, code or markdown display, or a sidebar or app
shell**, name the native HTML you will use instead (`<table>`, `<svg>`,
`<nav>`, `<pre>`, a CSS grid).

Never import a component that isn't in the export list (`Card`, `Table`,
`Badge`, `Sidebar` and `Chart` don't exist). Never pull in a second UI library
to fill a gap unless the user asks for one.

## 4. Build

- Keep data in a typed module (for example `src/lib/data.ts`) and keep components
  presentational. Use Svelte 5 runes (`$state`, `$derived`, `$props`).
- Style native elements with Bref's theme tokens so they follow light and dark
  mode: `var(--color-foreground)`, `var(--color-muted)`, `var(--color-primary)`,
  `var(--color-success|warning|error|info)`, `var(--color-background)`. Or use
  the `surface()` helper. For borders, use
  `color-mix(in srgb, var(--color-muted) 25%, transparent)`.
  **Don't hard-code hex or rgb colors.** Pass brand colors to
  `<Theme palette={{ ... }} />` instead.
- Accessibility (Bref's docs require these):
  - `TextInput`/`TextArea`/`Switch`/`Checkbox`: give each a visible `<label>`.
  - `Select`: has no `aria-label`. Use `<label for>` with `id`, and a `placeholder`.
  - `Combobox`: `aria-label` or `aria-labelledby`.
  - `Tabs` and `TreeView`: `label`.
  - Icon-only `Button`: `aria-label`.
  - Scroll `Surface`: `aria-label`.
- If the UI has dialogs or other states that a page load doesn't show, make
  them reachable from the URL (for example `?dialog=edit` or `?file=…`). Then
  you can take screenshots of them, and users get links to them.

## 5. Verify, and don't skip this

From the project root, with paths relative to this SKILL.md:

```sh
node <skill-dir>/scripts/verify.mjs
```

It checks that every `bref-ui` import is a real export and that `<Theme>` is
rendered once. It flags hard-coded colors, then runs `svelte-check` and the
production build, and prints the full output of any step that fails. Fix every
error and rerun until it exits 0. svelte-check may report only the first
invalid prop on a tag, so new errors can show up after a fix. Never silence an
error with `// @ts-ignore`, `any`, or by dropping part of the request.

**Then look at it.** A passing build doesn't catch layout bugs.

```sh
node <skill-dir>/scripts/screenshot.mjs / "/?dialog=edit"   # one PNG per path, in ./screenshots/
```

It builds, starts a fresh preview server, takes a screenshot of each path with
headless Chrome at 1440×1000, and stops the server. Open each PNG and check for
squeezed or wrapped labels, overflow, boxes nested inside boxes, tiny or faint
icons, and large empty regions. Fix what you see, then rerun both scripts.

- If you have a browser tool, prefer it. It can click through interactions,
  which a screenshot can't.
- Headless Chrome won't go narrower than about 500px. To check mobile, use a
  browser tool that can resize, or measure `document.documentElement.scrollWidth`
  against `innerWidth` inside a 390px iframe.

## 6. Report

Give the user:

- the files created or changed
- the plan mapping: which regions use Bref components and which use native HTML, and why
- the verifier result and the screenshots you reviewed, with what you fixed after looking
- what you didn't check, such as interactions you didn't click through,
  dark mode, or mobile widths

A passing verifier shows that the code compiles with valid Bref APIs. A clean
screenshot shows that one state looks right. Neither proves the interactions
work, so don't claim they do.

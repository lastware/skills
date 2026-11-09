# Bref UI 3.1.1 gotchas

Every item below was hit by an agent building a real interface. **(type)** means
svelte-check rejects the code. **(visual)** means it compiles but looks wrong,
so only a screenshot catches it.

## Surface

- **(type)** `as` accepts only `div|section|span`. For `<nav>`, `<aside>`,
  `<header>`, `<main>` or `<ol>`, write the native element and put a `Surface`
  inside it.
- **(type)** It has no `gap`, `padding` or `align` props. Use `spacing`,
  `orientation`, `width`/`height` (`fit|fill`), `radius`, `shadow`, `scroll`,
  `variant`, `color`, `hover` and `glass`.
- **(visual)** The defaults are `color="background"` and `width="fill"`, and a
  Surface paints its own background. If you nest a Surface inside a `soft` or
  `filled` Surface, you get a second, differently tinted box. Use a native
  `<div>` for inner layout, or set the inner Surface to match the parent.
- **(visual)** On the `radius` scale, `large` is very round (2.5rem). Use
  `small` or `medium` for data panels and cards.
- `scroll` needs `height="fill"` and a parent with a constrained height. In
  flex layouts, give the parent `flex: 1; min-height: 0`. Give the scroll
  region an `aria-label`.
- To reach the DOM element (for example to auto-scroll a log), use
  `{@attach fn}`. Surface spreads attributes onto its root element.

## Styling Bref components

- **(visual)** A scoped CSS rule like `.log ol` doesn't match inside a Bref
  component, because the markup belongs to the component. Wrap the component
  in a native element and use `.wrapper :global(...)`.
- There's no border token. Use
  `color-mix(in srgb, var(--color-muted) 25%, transparent)`.
- `Theme` doesn't style `body`. Set the page background with tokens yourself if
  you need it.

## Colors

- **(type)** `Pill`, `Button` and `Dialog` actions take
  `Exclude<Color, 'background'>`, not `Color`. Type lookup maps as
  `Record<K, Exclude<Color, 'background'>>`. Dialog action colors accept
  status colors only.

## Button, Icon, Pill, Progress

- **(type)** On `Button`, use `onClick`, not `onclick`. An icon-only button
  takes `icon` and `aria-label`, and no `label`.
- **(type)** `Icon` `name` is the closed `IconName` union. Type dynamic icon
  fields as `IconName` from `'bref-ui/types'`.
- **(visual)** `Icon` draws a thin glyph at 1em, so prominent icons look tiny
  and faint. Set `size="large"` (or bigger) on header and card icons.
- **(type)** `Pill` requires `label` even when you pass children.
- **(visual)** `Pill` uses `overflow-wrap: anywhere`, so in table cells or
  tight flex rows it breaks labels mid-word ("Pendin / g"). On the container add
  `.cell :global(*) { white-space: nowrap; overflow-wrap: normal; }`.
- **(visual)** `Progress` `label` is only an accessible name and never shows on
  screen. Render the percentage as text yourself.

## Switch and Checkbox

- **(visual)** `Switch` children render inside the thumb as decoration. They are
  not the label. Put the visible text in a `<label>` next to the Switch.
- To confirm before a change (for example "turn on in production?"), bind with a
  getter and setter, `bind:checked={() => value, (next) => request(next)}`, and
  only update `value` after confirmation.

## Select and Combobox

- **(visual)** The `Select` trigger is `width: 100%`, so in a toolbar or header
  row it stretches across the whole row. Wrap it in a sized element:
  `<div class="filter"><Select … /></div>` with `.filter { width: 11rem; }`.
  `Combobox` has a `wide` prop instead.
- `Select` has no `aria-label`. Name it with `<label for>` plus `id`, and a
  `placeholder`.
- `Combobox` takes `aria-label` or `aria-labelledby`.
- `onChange` gives `string | string[]`. For single selection, cast it:
  `(v) => (mode = v as ThemeMode)`.

## Tabs and TreeView

- **(type)** Every `Tabs` item requires `icon`.
- **(type)** `TreeView` requires `items` even when you only use `sections`
  (pass `items={[]}`).
- `TreeView` expansion is not controlled from outside. It has only
  `defaultExpanded` on each node. For a filtered tree, recompute
  `defaultExpanded` and remount the tree with `{#key filter}`.
- Clicking a folder row selects the folder, so handle a folder in `selection`.
- There's no badge or count slot. Put counts in the label ("Billing (3)").

## Dialog

- **(type)** `header` is a required object, `{ title, description?, icon? }`.
- `footer` is a snippet, or `{ primary, secondary }` actions with `label`,
  `icon`, `onClick`, `disabled` and `color`.

## Theme

- Render `Theme` once, at the root. `ThemeModeToggle` takes a plain `mode` prop,
  not a binding, and renders nothing visible. To share the mode between the root
  toggle and a visible `Select`, export a `$state` object from a `.svelte.ts`
  module:

  ```ts
  // src/lib/theme-mode.svelte.ts
  import type { ThemeMode } from 'bref-ui/types';
  export const themeMode = $state<{ value: ThemeMode }>({ value: 'auto' });
  ```

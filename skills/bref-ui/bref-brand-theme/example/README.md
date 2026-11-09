# Kiln Coffee: bref-brand-theme example

A fictional coffee brand (ember orange, oak green, cream, Fraunces and DM Sans) applied to Bref UI with the `bref-brand-theme` skill.

- `src/lib/brand.json`: the brand palette after `check.mjs --fix`. In light mode the orange `#ff6b2c` became `#c03900` and the grey `#8a8179` became `#746d66`, so white button text stays readable. Dark mode keeps the original orange.
- `src/routes/+layout.svelte`: applies the palette with `<Theme>` and the fonts with `--font-text`.
- `src/routes/+page.svelte`: the skill's brand preview page.

```sh
npm ci
npm run verify   # contrast check, svelte-check, production build
```

---
name: extract-reads-dark-mode
skill: bref-brand-theme
description: extract.mjs reports dark-mode colors (resolving var() inside hsl()) and the font for text and headings.
check: node ../../../skills/bref-ui/bref-brand-theme/scripts/extract.mjs fixtures/site.css | tr -d ' \n'
expect: "dark":{"--brand":"#f96743","--bg":"#1c1e22"}
---
## Setup
A stylesheet whose dark mode lives under `.dark` and builds its background from `hsl(var(--hue), …)`.
## Pass
The dark brand and background colors come out as hex, separate from light mode.

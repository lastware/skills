---
name: fix-reaches-aa
skill: bref-brand-theme
description: --fix turns a failing brand into one that passes, keeping each color's hue.
check: node ../../../skills/bref-ui/bref-brand-theme/scripts/check.mjs --fix fixtures/brand.json | node ../../../skills/bref-ui/bref-brand-theme/scripts/check.mjs /dev/stdin
expect: All 44 pairs reach 4.5:1
---
## Setup
A brand whose orange primary and grey muted fail in light mode.
## Pass
The fixed palette passes every pair in both modes.

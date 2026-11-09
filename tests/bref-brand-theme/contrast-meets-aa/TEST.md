---
name: contrast-meets-aa
skill: bref-brand-theme
description: A brand palette passes only when every text and background pair Bref draws reaches 4.5:1.
check: node ../../../skills/bref-ui/bref-brand-theme/scripts/check.mjs {answer}
---
## Setup
A brand with a bright green primary and a yellow secondary on white.
## Pass
The checker accepts the palette after its colors were darkened to readable shades.
## Fail
The checker rejects the raw brand colors: white text on #ffd400 is 1.4:1.

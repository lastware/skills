---
name: dark-mode-is-checked
skill: bref-brand-theme
description: A palette that only works in light mode fails, because Bref users can switch to dark mode.
check: node ../../../skills/bref-ui/bref-brand-theme/scripts/check.mjs {answer}
---
## Setup
A navy primary that reads well on cream, reused unchanged on a near-black dark background.
## Pass
The dark palette lightens the navy, so it reads on the dark background too.
## Fail
The same navy in dark mode: navy text on near-black is below 4.5:1.

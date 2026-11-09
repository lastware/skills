---
name: palette-is-valid
skill: bref-brand-theme
description: Only Bref's nine roles with hex values are accepted, the same rule Bref's Theme enforces at runtime.
check: node ../../../skills/bref-ui/bref-brand-theme/scripts/check.mjs {answer}
---
## Setup
A palette written from a brand guide.
## Pass
Hex values on Bref role names.
## Fail
A color name ("orange") and a role Bref doesn't have ("accent"); Bref's Theme would throw on the first.

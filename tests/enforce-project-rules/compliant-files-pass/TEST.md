---
name: compliant-files-pass
skill: enforce-project-rules
description: The SKILL.md example passes its own evals; the earlier version, whose trigger grep skipped compliant files, does not.
needs: AGENT_TESTS_CORE
check: d=$(mktemp -d) && cp {answer} $d/test.yaml && cp fixtures/agent-tests.config.yaml $d/ && cd $d && AGENT_TESTS_CORE="$AGENT_TESTS_CORE" OPENAI_API_KEY=unused ANTHROPIC_API_KEY=unused bun $OLDPWD/../../../skills/agent-tests/enforce-project-rules/scripts/run.ts eval .
---
## Setup
The no-db-outside-repositories example from SKILL.md, without its `ask` rule so no model is called.
## Pass
good.json (the current example) matches 3/3. bad.json (the old example: `src/**/*.ts` plus a trigger grep) selects the repository file and skips the compliant route.

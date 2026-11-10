---
name: evals-catch-bad-globs
skill: enforce-project-rules
description: A test that excludes files with a leading "!" glob is refused; the same test with an in-segment exclusion passes its evals.
needs: AGENT_TESTS_CORE
check: d=$(mktemp -d) && cp {answer} $d/test.yaml && cp fixtures/agent-tests.config.yaml $d/ && cd $d && AGENT_TESTS_CORE="$AGENT_TESTS_CORE" OPENAI_API_KEY=unused ANTHROPIC_API_KEY=unused bun $OLDPWD/../../../skills/agent-tests/enforce-project-rules/scripts/run.ts eval .
---
## Setup
A no-console-log rule with one fail, one pass and one skip eval. The logger file is allowed to log.
## Pass
good.json excludes the logger with `src/**/!(logger).ts`: 3/3 evals match. bad.json uses `'!src/lib/logger.ts'`, which selects every other file, and run.ts refuses it.

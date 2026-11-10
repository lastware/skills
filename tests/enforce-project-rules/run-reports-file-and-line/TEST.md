---
name: run-reports-file-and-line
skill: enforce-project-rules
description: Checking a small app reports the one violation with its file and line, and not the allowed logger or the test's own files.
needs: AGENT_TESTS_CORE
check: cd fixtures/app && AGENT_TESTS_CORE="$AGENT_TESTS_CORE" OPENAI_API_KEY=unused ANTHROPIC_API_KEY=unused bun ../../../../../skills/agent-tests/enforce-project-rules/scripts/run.ts run .agents/tests/no-console-log src/pay.ts src/math.ts src/lib/logger.ts .agents/tests/no-console-log/test.yaml; true
expect: src/pay.ts:2  error
---
## Setup
An app with one direct console.log, a clean file, and the logger that is allowed to log.
## Pass
Exactly one finding, src/pay.ts line 2.

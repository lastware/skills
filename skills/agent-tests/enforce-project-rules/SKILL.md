---
name: enforce-project-rules
description: Turn a project rule your coding agent keeps breaking (from CLAUDE.md, AGENTS.md, a review comment, or a correction) into an agent test, a TEST.md plus test.yaml under .agents/tests/, prove it fails on a violation and passes on compliant code, then check the repository against it. Use when the user says things like "make this a rule", "stop the agent doing X again", or "check the codebase for X".
---

# Enforce project rules

Turn one rule into one agent test, prove it works, and then check the code with it.
An agent test only reports findings. Never change application code while
running a check. Fix code only when the user asks you to.

## Status of agent-tests (read first)

agent-tests is not released yet. Its CLI commands (`init`, `validate`, `eval`,
`run`…) exist but only print their arguments. The library does work, so this
skill runs it through `scripts/run.ts`, which needs Bun and a local checkout
of `feuersteiner/agent-tests`. Tested with commit `498aa5e` (10 November 2026).
If `run.ts` says the checkout has no `AgentTests` export, update the checkout.

The README describes `message`, `fix`, and `fast` / `smart` / `deep`. Those are
planned. Write `test.yaml` against the schema that the code accepts today,
shown below. Otherwise validation fails.

## Prerequisites

1. Install Bun: `bun --version` must succeed.
2. Get a checkout of agent-tests with its dependencies installed:
   `git clone https://github.com/feuersteiner/agent-tests && cd agent-tests && git checkout 498aa5e && bun install --ignore-scripts --frozen-lockfile --linker=hoisted`.
   Set `AGENT_TESTS_CORE=/path/to/agent-tests/core`.
3. Create `agent-tests.config.yaml` at the repository root, even if the rule
   uses only regex. Both models are required, and their key variables must be
   set in the environment:

   ```yaml
   decision:
     api: openai # openai | jev
     url: https://api.openai.com/v1
     model: <classifier model>
     apiKeyEnv: OPENAI_API_KEY
   reasoning:
     api: anthropic # openai | anthropic
     url: https://api.anthropic.com/v1
     model: <reasoning model>
     apiKeyEnv: ANTHROPIC_API_KEY
   trigger: { threshold: 0.5 }
   check: { threshold: 0.5 }
   ```

The keys are read at startup. A rule that uses only `glob` and `grep` never
calls a model, so for those any non-empty value works.

If a prerequisite is missing, say which one and stop. Don't report results
from a run that didn't happen.

## Workflow

1. **Pin down the rule.** Get it in one sentence that can be tested, for example
   "Database queries only happen in `src/lib/server/repositories/`". If the
   source is vague ("write clean code"), ask the user for the specific behavior
   or decline. Not every instruction can be tested. Scope the test to what the
   user asked. If the source rule is wider (CLAUDE.md says "all HTTP", the user
   said "in components"), test what the user asked and report the gap as a
   possible second test.
2. **Look at the repository.** Find where the rule applies (paths, file types)
   and collect one real violation and one real compliant example if they exist.
3. **Write `.agents/tests/<id>/TEST.md`.** Use prose: the rule, why it exists,
   examples, exceptions, and how to fix a violation. Describe the rule. Don't
   address the models that will read it.
4. **Write `.agents/tests/<id>/test.yaml`** in the current schema:

   ```yaml
   id: no-db-outside-repositories # lowercase kebab-case, matches the directory
   title: No database access outside repositories
   description: Database queries live in the repository layer.
   triggers: # optional; OR between triggers
     - id: server-code
       description: Server TypeScript outside the repository layer.
       glob: 'src/**/!(repositories)/*.ts' # AND within a trigger: glob, then grep, then ask
   checks: # at least one
     - id: query-outside-repository
       description: Flags direct query calls.
       error: Database query outside src/lib/server/repositories/.
       grep: '\b(prisma|db)\.\w+\.(find|create|update|delete)\w*\('
       ask: 'This file performs no database query itself; it only calls repository functions.'
   evals: # labeled examples: pass | fail | skip
     - {
         name: Route queries Prisma directly,
         path: src/routes/api/users/+server.ts,
         content: 'await prisma.user.findMany()',
         expect: fail
       }
     - {
         name: Route calls repository,
         path: src/routes/api/users/+server.ts,
         content: 'await usersRepo.list()',
         expect: pass
       }
     - {
         name: Repository itself,
         path: src/lib/server/repositories/users.ts,
         content: 'await prisma.user.findMany()',
         expect: skip
       }
   ```

   How a check decides: rules run in the order `grep`, then `ask`, then
   `reason`. A source **passes** at the first rule it passes. It is flagged
   only if it fails every rule present. `grep` fails when a pattern matches.
   `ask` and `reason` take a statement that must be true for the file to pass.
   Use `grep` alone when a pattern settles the question. Add `ask` (a
   classifier) or `reason` (an LLM) only when the rule needs judgment, and put
   grep in front of them so models run only on suspicious files.

   **How `grep` matches.** Each pattern is a JavaScript regex, built with
   `new RegExp(pattern)` and no flags, and tested against the **whole file**, not
   line by line. So `^` and `$` anchor to the file, and `.` doesn't cross
   newlines. A plain pattern also matches inside comments and strings: a comment
   like `// never call fetch() here` would be flagged. Exclude `//` comments with
   a lookbehind, `(?<!//[^\n]*)fetch\(`, and add a `pass` eval with the word
   in a comment. When a regex can't tell the difference, add `ask` after `grep`.

   **Globs** use minimatch syntax (`**`, `{ts,tsx}`, `!(…)`), with dotfiles
   included. Trigger `glob` patterns must exclude the files where the rule allows the
   behavior. Cover those files with a `skip` eval. Exclude **inside** a pattern
   with `!(…)`: `src/**/!(logger).ts`, `src/**/!(repositories)/*.ts`. Never
   start a pattern with `!`: patterns in a list are OR'ed, so `'!src/x.ts'`
   selects every other file in the repo. `run.ts` refuses such patterns.
   Don't add a trigger `grep` that compliant files can't match: they are then
   skipped instead of passing, and your `pass` evals fail.

   Run every command below **from the repository root** (`run.ts` reads
   `agent-tests.config.yaml` there), with the skill's real path, for example
   `bun .claude/skills/enforce-project-rules/scripts/run.ts`. Below it is
   written `<skill-dir>/scripts/run.ts`.

5. **Prove the test works.** Run
   `bun <skill-dir>/scripts/run.ts eval .agents/tests/<id>`. Include at least
   one `fail`, one `pass`, and one `skip` eval. In the output, `cleared` means
   the eval **matched its label**, even for a `fail` eval. `flagged` means it
   didn't. The script exits 1 if any eval didn't match. Repeat until every
   eval matches. Fix the test, not the labels. Change a label only if the user
   agrees it was wrong.
6. **Prove it can fail.** Break the test once on purpose: in a temporary copy
   outside `.agents/tests/`, loosen the pattern or remove an exclusion, and
   confirm at least one eval no longer matches. If every eval still matches,
   your evals don't test the rule: add the case they miss. Delete the copy.
7. **Check the code.** Run `bun <skill-dir>/scripts/run.ts run .agents/tests/<id>`.
   With no files, it checks every git-tracked file plus new untracked ones,
   since the latest violation is often not committed yet. Or list files after
   the directory. Each finding shows `file:line` (where the grep matched; none
   for model-only checks) and the check's `error`.
8. **Report.** Give the rule, the test path, eval results (N/N matched), the
   flagged files, and any gap between the user's request and the source rule.
   List anything you did not run. The test belongs in the repository: suggest
   committing `.agents/tests/<id>/` with `agent-tests.config.yaml`, but don't
   commit unless the user asks.

## Rules

- Never say an eval or check passed unless you ran it and saw the output.
- Never weaken a check, or delete an eval, to make results come out green.
- One rule per test. Split compound rules.
- Keep tests declarative: no scripts inside `.agents/tests/`.
- Don't commit API keys. `agent-tests.config.yaml` only names environment variables.

# Skills

Agent skills that do one job well, and prove it. Each skill is a folder: a
`SKILL.md` that teaches your agent the method, plus scripts that check its
work. Every check runs for real before we call a skill done.

Skills are grouped by the package they're built on.

### [Bref UI](https://github.com/feuersteiner/bref-ui) · `skills/bref-ui/`

| Skill | What it does | Checked by |
|---|---|---|
| [build-bref-interface](skills/bref-ui/build-bref-interface/SKILL.md) | Builds a Svelte 5 dashboard, admin panel or internal tool from real Bref UI `3.1.1` components, then verifies it with `svelte-check`, a production build and a screenshot | example + 4 demos, built in CI |
| [bref-brand-theme](skills/bref-ui/bref-brand-theme/SKILL.md) | Makes Bref UI look like your brand: colors and fonts from your site, logo or guidelines, with every button, pill and text color checked for WCAG AA contrast in light and dark mode | brand-contrast tests + an example, built in CI |

### [agent-tests](https://github.com/feuersteiner/agent-tests) · `skills/agent-tests/`

| Skill | What it does | Checked by |
|---|---|---|
| [enforce-project-rules](skills/agent-tests/enforce-project-rules/SKILL.md) | Turns a project rule your agent keeps breaking into an agent test, proves it catches violations, then checks the repo | the agent-tests evals it runs |
| [compile-agent-test](skills/agent-tests/compile-agent-test/SKILL.md) | Compiles an agent test's `TEST.md` into its `test.yaml`, then loops on validation and evals | the agent-tests validator it runs |
| [run-agent-tests](skills/agent-tests/run-agent-tests/SKILL.md) | Checks code against the project's agent tests and reports what breaks them, by file, line and rule | the agent-tests runner it runs |

### Standalone · `skills/standalone/`

No package needed: the scripts run on plain Node 18+, with no install, no API key and no network.

| Skill | What it does | Checked by |
|---|---|---|
| [tenderreply](skills/standalone/tenderreply/SKILL.md) | Answers a tender from a company's own documents, every line sourced, gaps instead of invented claims | quotes-are-real, no-invented-numbers, gaps-not-claims |
| [howlegacy](skills/standalone/howlegacy/SKILL.md) | Scores how legacy a company is (0–100) from its website, six signals, each with a quote | quotes-are-real, score-is-arithmetic, same-input-same-answer |
| [whatdidwedecide](skills/standalone/whatdidwedecide/SKILL.md) | Turns a messy conversation into decisions, owners and open questions, each quoted | quotes-are-real |
| [whatchanged](skills/standalone/whatchanged/SKILL.md) | Compares two versions of terms, a contract or a rule: code finds every changed clause, the agent explains each with the words before and after | no-silent-change, quotes-are-real, no-invented-change, watchlist-valid |

## Use a skill

A skill is a folder. Copy it into the folder your agent loads skills from.
For Claude Code, that's `.claude/skills/` in your project, or `~/.claude/skills/`
to use it in every project:

```sh
git clone --depth 1 https://github.com/mlgxiii/skills.git /tmp/skills
cp -R /tmp/skills/skills/standalone/tenderreply .claude/skills/
```

Any other agent that reads `SKILL.md` folders works the same way: copy the
folder into its skills directory, or point it at the `SKILL.md`.

What each group needs:
- **bref-ui:** a Svelte 5 project. The skills install `bref-ui` themselves.
- **agent-tests:** a checkout of [agent-tests](https://github.com/feuersteiner/agent-tests) and `AGENT_TESTS_CORE` pointing at its `core/`.
- **standalone:** Node 18+.

```sh
node skills/standalone/tenderreply/scripts/check.mjs quotes  answer.json tender.txt docs/*.txt
node skills/standalone/tenderreply/scripts/check.mjs numbers answer.json tender.txt docs/*.txt
node skills/standalone/howlegacy/scripts/score.mjs screens=3 workflows=4 data=2 people=1 pricing=4 era=3
```

## Built with build-bref-interface

Each app below was built by a fresh agent from a single sentence, then checked
by the skill's verifier and reviewed from a screenshot. Source in [`demos/bref-ui/`](demos/bref-ui).

| | |
|---|---|
| ![Support dashboard](skills/bref-ui/build-bref-interface/assets/support-dashboard.png) **Support dashboard:** *"Build a customer support dashboard with ticket management, filters, a sidebar and KPI cards."* | ![Agent monitor](demos/bref-ui/agent-monitor/screenshot.png) **AI agent monitor:** *"Build a monitoring page for my AI agents: running jobs, progress bars, logs, stop button."* |
| ![File explorer](demos/bref-ui/file-explorer/screenshot.png) **File explorer:** *"Build a file explorer with a folder tree on the left and a preview on the right."* | ![Prompt library](demos/bref-ui/prompt-library/screenshot.png) **Prompt library:** *"Build a prompt library: browse prompts by tag, search, edit in a dialog."* |
| ![Feature flags](demos/bref-ui/feature-flags/screenshot.png) **Feature flags:** *"Build a feature flags dashboard with on/off switches per environment."* | |

## Built with bref-brand-theme

![Kiln Coffee brand in Bref UI, light and dark mode](skills/bref-ui/bref-brand-theme/assets/kiln-preview.png)

A fictional coffee brand (ember orange, oak green, cream, Fraunces and DM Sans) applied to every Bref component. The brand's orange `#ff6b2c` gave white button text only 2.7:1, so in light mode the skill moved it to `#c03900`: the same hue, readable at 5.1:1. Source in [`skills/bref-ui/bref-brand-theme/example/`](skills/bref-ui/bref-brand-theme/example).

## Why every skill has checks

On `gpt-4.1-mini`, the first drafts of two skills failed their tests:
- **TenderReply:** claimed the company's Cyber Essentials Plus was "equivalent to ISO 27001". No document says that.
- **WhatDidWeDecide:** glued two lines from different speakers into one "quote".

Telling the model not to do this in the instructions changed nothing. Running the skill's checks and handing back the failures fixed both in one round. That's the method: the agent writes, the scripts check, the agent fixes.

Every skill:

1. Pins the package version it was tested with, if it's built on one.
2. Uses only the APIs that package really exports.
3. Ships a check the agent must run, and never reports success it didn't observe.
4. Is checked: in CI by an example project built from a clean install or by tests with a good and a bad answer, or, for the agent-tests skills, by the agent-tests validator and evals they run.

```sh
npm test                              # every check passes its good example and catches its bad one (no model)
OPENAI_API_KEY=... npm run try        # every skill on a real model, then its own checks, with one repair round
```

### Tests

Each test is a folder: `tests/<skill>/<test>/TEST.md`, plus `fixtures/` (inputs, a good answer and a bad one).

```markdown
---
name: gaps-not-claims
skill: tenderreply
description: When the documents don't prove what the tender asks, the response leaves a gap instead of claiming it.
check: node ../../../skills/standalone/tenderreply/scripts/check.mjs backed {answer} "ISO 27001" --in fixtures/company.txt
---
## Setup / ## Task / ## Pass / ## Fail
```

`check` must pass on `fixtures/good.json` and fail on `fixtures/bad.json`. A test without `check` needs a model, and `npm run try` runs it.

## WhatChanged: the monitor

The `whatchanged` skill also runs as a public monitor of the terms of service
and AI rules behind the tools people use: <https://mlgxiii.github.io/skills/>.

```sh
npm run watch                          # fetch every document in watch/, snapshot it, diff it against the last one
node scripts/backfill.mjs <id> 20260401  # or diff against an Internet Archive copy, to start with history
OPENAI_API_KEY=... npm run explain     # explain each diff with the skill, check it, repair it
npm run site                           # site/index.html
```

**Add a document:** open a pull request adding `watch/<id>.json`:

```json
{ "id": "cursor-terms", "name": "Cursor Terms of Service", "url": "https://cursor.com/terms-of-service", "kind": "terms" }
```

`kind` is one of `terms`, `privacy`, `ai-policy`, `pricing` or `regulation`. The `watchlist-valid` test checks it on the pull request, and the page lists it from the next weekly run (`.github/workflows/whatchanged.yml`). The monitor identifies itself, obeys robots.txt, waits between requests and skips pages that refuse it.

**How it stays honest and safe**
- Explanations are written by AI; the quotes are the documents' own words, checked against both versions. High-impact explanations stay hidden until a person reviews them: the weekly run opens an issue, and setting `"reviewed": true` in the change file publishes them.
- The weekly workflow runs this repository's code with an OpenAI key. A pull request from a fork that changes anything outside `watch/` fails the PR check on purpose, so that code gets a line-by-line review before merging.
- To ask for a document to be removed, open an issue.

**Try it:** the page has a "Compare two versions" box that runs the same diff in your browser, with no AI.

## Layout

```text
skills/<package>/<skill>/   # grouped by the package the skill is built on; "standalone" when none
  SKILL.md                  # instructions the agent follows
  scripts/                  # checks and helpers
  reference/                # extra detail the agent reads on demand
  example/                  # project CI verifies the skill against (optional)
tests/<skill>/<test>/       # TEST.md + fixtures, run by npm test
demos/<package>/<demo>/     # more apps built with a skill, also verified in CI
watch/ snapshots/ changes/  # the WhatChanged monitor's watchlist and history
scripts/                    # repo checks, tests runner, monitor
```

Copy only the `skills/<package>/<skill>/` folder you need. Every skill folder works on
its own: shared helpers like `check.mjs` are copied into each skill.

## Add a skill

1. Create `skills/<package>/<skill>/SKILL.md`, where `<package>` is the npm
   package the skill is built on, or `standalone`. Its frontmatter `name` must
   equal the folder name and be unique across the repo, and it needs a `description`.
2. Give it something CI can check: an `example/` project whose `package.json`
   has a `verify` script, and/or tests under `tests/<skill>/`.
3. Add a row to its package's table above that links its `SKILL.md`. For a new package, add a new table.
4. Optional: add demos under `demos/<package>/<demo>/`, each with a `verify` script.

Then run `node scripts/repo.mjs check`. It lists every step you missed. CI runs
the same check, the tests, and verifies every example and demo it finds, with
no workflow edits needed.

`npm run generate` writes skills for the config-driven micros straight from
their product definitions (it needs that source checked out next to this repo).

## License

MIT. The fixtures are fictional.

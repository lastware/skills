# Skills

Agent skills that do one job well, and prove it. Each skill is a folder: a
`SKILL.md` that teaches your agent the method, plus scripts that check its
work. Every check runs for real before a skill is published. More skills are
coming, one at a time.

## [Bref UI](https://github.com/feuersteiner/bref-ui) · `skills/bref-ui/`

| Skill | What it does | Checked by |
|---|---|---|
| [bref-brand-theme](skills/bref-ui/bref-brand-theme/SKILL.md) | Makes Bref UI look like your brand: colors and fonts from your site, logo or guidelines, with every button, pill and text color checked for WCAG AA contrast in light and dark mode | brand-contrast tests + an example, built in CI |

![Kiln Coffee brand in Bref UI, light and dark mode](skills/bref-ui/bref-brand-theme/assets/kiln-preview.png)

A fictional coffee brand (ember orange, oak green, cream, Fraunces and DM Sans) applied to every Bref component. The brand's orange `#ff6b2c` gave white button text only 2.7:1, so in light mode the skill moved it to `#c03900`: the same hue, readable at 5.1:1. Dark mode keeps the original orange. Source in [`skills/bref-ui/bref-brand-theme/example/`](skills/bref-ui/bref-brand-theme/example).

**How it works**
1. `extract.mjs` reads your site's colors (light and dark mode) and fonts (for text and headings).
2. The agent maps them to Bref's 9 color roles and your fonts.
3. `check.mjs` rebuilds the 44 text/background pairs Bref really draws from that palette, using Bref's own surface formulas, and requires 4.5:1 for each. Bref's default palette passes all 44.
4. When a brand color fails, `--fix` keeps its hue and changes only its lightness, and the agent tells you exactly what changed.
5. The agent screenshots a preview of every component in light and dark mode, and looks at it.

Tested by a fresh agent from one sentence, "Make this app match the svelte.dev brand": it found Svelte's orange, greys, dark mode and fonts, and darkened the orange for light mode to `#d63400`, next to the `#d43008` svelte.dev itself uses for text.

## Use a skill

A skill is a folder. Copy it into the folder your agent loads skills from.
For Claude Code, that's `.claude/skills/` in your project, or `~/.claude/skills/`
to use it in every project:

```sh
git clone --depth 1 https://github.com/mlgxiii/skills.git /tmp/skills
cp -R /tmp/skills/skills/bref-ui/bref-brand-theme .claude/skills/
```

Then ask your agent, for example: *"Make this app match our brand: https://our-site.example"*.

Any other agent that reads `SKILL.md` folders works the same way: copy the
folder into its skills directory, or point it at the `SKILL.md`. The scripts
need Node 18+ and nothing else.

## Why every skill has checks

Telling a model "keep text readable" or "don't invent things" in its
instructions isn't enough: it agrees, and then doesn't. Running a check and
handing the failures back works. That's the method: the agent writes, the
scripts check, the agent fixes.

Every skill:

1. Pins the package version it was tested with, if it's built on one.
2. Uses only the APIs that package really exports.
3. Ships a check the agent must run, and never reports success it didn't observe.
4. Is checked in CI, by an example project built from a clean install and by tests with a good and a bad answer.

```sh
npm test    # every check passes its good example and catches its bad one
```

Each test is a folder, `tests/<skill>/<test>/TEST.md`, plus `fixtures/`. The
`check` command must pass on `fixtures/good.json` and fail on
`fixtures/bad.json`. A test with `expect` must print that text instead.

## Layout

```text
skills/<package>/<skill>/   # grouped by the package the skill is built on; "standalone" when none
  SKILL.md                  # instructions the agent follows
  scripts/                  # checks and helpers
  reference/                # extra detail the agent reads on demand
  example/                  # project CI verifies the skill against
tests/<skill>/<test>/       # TEST.md + fixtures, run by npm test
scripts/                    # repo checks and the test runner
```

Copy only the `skills/<package>/<skill>/` folder you need. Every skill folder works on its own.

## License

MIT. The fixtures and example brands are fictional.

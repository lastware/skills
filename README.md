# Skills

Agent skills that check their own work.

## bref-brand-theme

Makes a [Bref UI](https://github.com/feuersteiner/bref-ui) app look like your brand, and keeps it readable.

Most brand colors fail contrast somewhere. Bright orange is the classic case: white text on `#ff6b2c` is 2.7:1, well under the 4.5:1 that WCAG asks for. You don't notice until someone can't read your buttons.

So the skill doesn't just copy your colors into Bref. It rebuilds all 44 text and background pairs Bref draws, in light and dark mode, and checks each one. When a color fails, it keeps the hue and changes only the lightness. That orange becomes `#c03900`: still orange, now 5.1:1.

![Kiln Coffee brand in Bref UI, light and dark mode](skills/bref-ui/bref-brand-theme/assets/kiln-preview.png)

Does it work? I gave a fresh agent one sentence: "Make this app match the svelte.dev brand." It found Svelte's colors, dark mode and fonts, and picked `#d63400` for light mode. svelte.dev itself uses `#d43008`.

[The skill](skills/bref-ui/bref-brand-theme/SKILL.md) · [The example above](skills/bref-ui/bref-brand-theme/example)

## Install

A skill is a folder. Copy it to where your agent looks for skills:

```sh
git clone --depth 1 https://github.com/mlgxiii/skills.git /tmp/skills
cp -R /tmp/skills/skills/bref-ui/bref-brand-theme .claude/skills/
```

Then ask: *"Make this app match our brand: https://our-site.example"*. Needs Node 18+, nothing else.

## Why the checks

Tell a model "keep text readable" and it agrees, then doesn't. Run a check and hand it the failures, and it fixes them. Every skill here works that way, and every check runs in CI (`npm test`).

More skills are coming, one at a time. MIT.

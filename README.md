# Consent Gate

> An open-source agent skill from [We Build for Good](https://webuildforgood.com)

A small vanilla JavaScript consent banner for Google Analytics 4 and Microsoft Clarity, plus a build step that validates your settings and a browser checklist to prove it on the live site.

* No GA4 or Clarity tag is added to the page before the visitor clicks "Allow analytics".
* "No thanks" and "Allow analytics" look the same and take one click each.
* The choice is remembered for about 13 months.
* A "Privacy choices" footer link lets visitors withdraw at any time: GA cookies are cleared and the page reloads.
* Analytics only runs on the hostnames you list, never on localhost or previews.

See [SKILL.md](SKILL.md) for setup and the limits.

## Quick start

```bash
git clone https://github.com/We-Build-For-Good/skill-consent-gate.git
cd skill-consent-gate
npm install && npm test
cp examples/consent.config.json /path/to/site/consent.config.json   # then edit it
node bin/build-consent-gate.mjs --config /path/to/site/consent.config.json --out /path/to/site/public/consent-gate.js
```

To use it as a Claude Code skill:

```bash
git clone https://github.com/We-Build-For-Good/skill-consent-gate.git ~/.claude/skills/consent-gate
```

## Contents

* `SKILL.md`: instructions for an AI assistant installing or auditing the banner.
* `assets/consent-gate.template.js`: the banner script (built with your settings by `bin/build-consent-gate.mjs`).
* `examples/consent.config.json`: settings to copy.
* `references/privacy-page-checklist.md`: what the privacy page must say.
* `references/verification.md`: how to prove it works in a browser.
* `test/`: jsdom tests.

## License

MIT License. Developed and maintained by [We Build for Good](https://webuildforgood.com).

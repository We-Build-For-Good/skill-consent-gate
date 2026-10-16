# Consent Gate: Zero-Tracker Privacy Architecture Protocol

> **An open-source AI engineering protocol from [We Build for Good](https://webuildforgood.com)**  
> *True privacy engineering. Zero analytics before consent.*

---

## Overview

`consent-gate` is an open-source privacy architecture and operational protocol for web applications and marketing sites.

It provides a production-tested consent banner and script pattern that guarantees:
* Exactly zero analytics network requests fire before explicit user opt-in.
* A prominent, working "No thanks" decline action.
* Reversible consent via an automated footer "Privacy choices" button.
* Automatic cookie clearing and reload upon withdrawal.

---

## Installation

### For Claude Code
```bash
git clone https://github.com/webuildforgood/skill-consent-gate.git ~/.claude/skills/consent-gate
```

### For Cursor
```bash
mkdir -p .cursor/skills
git clone https://github.com/webuildforgood/skill-consent-gate.git .cursor/skills/consent-gate
```

### For Antigravity / Open Agent Skills
```bash
mkdir -p .agents/skills
git clone https://github.com/webuildforgood/skill-consent-gate.git .agents/skills/consent-gate
```

---

## Repository Contents

* `SKILL.md`: Operational protocol for AI assistants installing and auditing consent gates.
* `assets/consent-gate.template.js`: Production-ready vanilla JavaScript consent template.
* `references/privacy-page-checklist.md`: Disclosure checklist for matching privacy policy pages.
* `references/verification.md`: Step-by-step browser verification suite.

---

## License

MIT License. Developed and maintained by [We Build for Good](https://webuildforgood.com).

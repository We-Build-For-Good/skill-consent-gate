# Changelog

## 2.0.0 (2026-10-20)

Fixes from a catalogue review.

- **Withdrawal link never appeared** with the documented `privacyUrl` of `/privacy`: 1.0.0 only added "Privacy choices" next to links ending in `privacy.html`. It now goes next to any footer privacy link, or into the footer.
- **"No thanks" was less prominent** than "Allow analytics" (only Allow had the filled brand colour). Both buttons are now styled the same.
- **GA cookies on the parent domain survived withdrawal**: 1.0.0 only expired them on the exact host. All parent domains are now covered, and GA consent is updated to denied before the reload.
- GA4 and Clarity are each optional; the banner only names what is configured. PostHog is no longer mentioned, because it was never supported.
- New `bin/build-consent-gate.mjs` fills the template from a validated JSON config. 1.0.0 had eight undocumented placeholders, and product text was inserted as raw HTML.
- Added jsdom tests (`npm test`).
- Docs: "data masking by default" corrected (the script does no masking; you add Clarity's attributes), private references removed.

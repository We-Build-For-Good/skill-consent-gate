---
name: consent-gate
description: Add or audit a consent banner that loads Google Analytics 4 and/or Microsoft Clarity only after the visitor clicks "Allow analytics". Gives "No thanks" the same weight as "Allow", remembers the choice for about 13 months, and adds a "Privacy choices" footer link that withdraws consent, clears GA cookies and reloads. Use when adding analytics to a site or checking an existing banner.
license: MIT
metadata:
  author: We Build for Good
  version: "2.0.0"
---

# Consent Gate

Many cookie banners load analytics before the visitor chooses, or hide "decline" behind a settings screen. This skill installs a small vanilla JavaScript banner that does neither, and a browser checklist to prove it on the live site.

## What the script does

1. **Production hosts only.** It does nothing unless the page's hostname is in `productionHosts`, so localhost and preview deploys never send analytics.
2. **Nothing before consent.** The GA4 and Clarity tags are added to the page only after "Allow analytics" is clicked (or a stored "granted" choice is found).
3. **Equal choices.** "No thanks" and "Allow analytics" are the same size and style, side by side, one click each.
4. **Remembered, then asked again.** The choice is stored in `localStorage` with a timestamp and expires after 390 days (about 13 months).
5. **Withdrawal on every page.** A "Privacy choices" link is added next to the footer's privacy link (or to the footer, or to a footer it creates). Choosing "No thanks" there tells GA and Clarity consent is denied, expires `_ga` cookies on the host and its parent domains, and reloads so no tag keeps running.

It does **not** mask anything itself. If you use Clarity, add Clarity's masking attributes (for example `data-clarity-mask="true"`) to every input and container that holds personal or sensitive content, verify them in Clarity, and describe exactly that coverage in `maskingSentence`.

It only manages GA4 and Clarity. Other tags (PostHog, Meta pixel, Hotjar) are not handled; any tag loaded another way bypasses the gate.

## Install

1. Copy `examples/consent.config.json` into the project and fill it in:

   | Field | Meaning |
   | :--- | :--- |
   | `prefix` | Short lowercase id used for element ids and attributes, e.g. `acme` |
   | `productName` | Shown in the banner title |
   | `productionHosts` | Exact live hostnames, e.g. `["acme.com", "www.acme.com"]` |
   | `privacyUrl` | Path or https URL of the privacy policy |
   | `storageKey` | Versioned key, e.g. `acme_consent_v1` (change the version to ask everyone again) |
   | `ga4MeasurementId` | `G-...`, or leave out |
   | `clarityProjectId` | Clarity project id, or leave out (at least one of the two is required) |
   | `maskingSentence` | Required with Clarity: what is masked, verified, not assumed |

2. Build the script (the build refuses invalid settings):

   ```bash
   node bin/build-consent-gate.mjs --config consent.config.json --out public/consent-gate.js
   ```

3. Load it in every page's `<head>`, and remove any GA4 or Clarity tag that was already in the HTML:

   ```html
   <script src="/consent-gate.js" defer></script>
   ```

4. Update the privacy page in the same change: `references/privacy-page-checklist.md`.

5. Prove it on the deployed site in a real browser: `references/verification.md`. Do not sign off from the source alone.

## Tests

`npm install && npm test` runs the built script in jsdom: no tags before consent, decline, stored choices, expiry, accept, GA-only, the withdrawal link, cookie clearing on the parent domain, equal button styles, HTML escaping and config validation. jsdom does not run the real GA or Clarity code, so step 5 is still required.

## What this skill does not do

* It does not make a site legally compliant on its own. Your privacy policy, other tags, and server-side processing matter too.
* It does not stop other scripts on the page from tracking.

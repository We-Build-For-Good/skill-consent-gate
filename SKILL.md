---
name: consent-gate
description: Privacy-first analytics architecture protocol. Enforces zero third-party network requests before explicit user consent, provides an equal-prominence "No thanks" option, guarantees 13-month persistence, and provides a self-installing reversible footer link that clears cookies and reloads upon withdrawal.
license: MIT
metadata:
  author: We Build for Good
  version: "1.0.0"
---

# Consent Gate: Zero-Tracker Privacy Architecture Protocol

Most web cookie banners are deceptive theater: they fire third-party analytics tags into the browser before the user has made a choice, or hide the decline button inside complex sub-menus.

The `consent-gate` protocol implements the gold standard of privacy engineering:
* **Zero Network Requests Prior to Consent**: Pre-consent, the page makes zero network requests to third-party analytics or telemetry domains.
* **Equal-Prominence "No Thanks"**: The decline action is as visible and accessible as the accept action.
* **Persistent & Reversible**: Consent choices persist for 13 months, and visitors can withdraw consent at any time via a self-installing "Privacy choices" footer control, which immediately clears tracking cookies and reloads the page.

---

## The Four Non-Negotiable Guarantees

1. **Host-Environment Gate**: The script checks the hostname and refuses to load analytics in local development (`localhost`, `127.0.0.1`) or staging preview environments.
2. **Deterministic Opt-In**: Tags are dynamically injected into the DOM only after the user clicks "Allow".
3. **Data Masking by Default**: For session recording tools, sensitive text inputs and user content containers must carry explicit privacy masking attributes (`data-clarity-mask="true"`).
4. **Immediate Cookie Purge on Withdrawal**: Clicking "Revoke Consent" immediately clears client-side tracking cookies and triggers a clean reload.

---

## Installation Workflow

### Step 1: Configuration Parameters
Gather the project parameters:
* `PRODUCTION_HOSTS`: Allowed live hostnames (e.g. `'example.com'`).
* `PRIVACY_URL`: Relative path to privacy policy (e.g. `'/privacy'`).
* `STORAGE_KEY`: Versioned local storage key (e.g. `'app_consent_v1'`).
* Analytics Stream / Project IDs (GA4, Clarity, or PostHog).

### Step 2: Include the Script
Load the template script in the HTML `<head>` with `defer`:
```html
<script src="/consent-gate.js" defer></script>
```

### Step 3: Empirical Verification
Run an automated verification sweep using headless browser tests:
1. Load the page with cold storage: verify that zero network requests leave for analytics domains.
2. Click "No thanks": verify the banner closes and no tags are injected.
3. Reload: verify the refusal persists and the banner stays hidden.
4. Click "Allow": verify tags inject dynamically and start collecting telemetry.
5. Click "Privacy choices" in the footer: verify consent is revoked, cookies are cleared, and the page resets.

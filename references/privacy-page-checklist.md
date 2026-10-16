# Privacy-page checklist  -  ship in the SAME change as the tags

The page must be true the moment the tags deploy. Every item below, in the
project's own voice (see live examples at the end).

## Required content

1. **Name both processors**: Google Analytics 4 and Microsoft Clarity, by name.
2. **State the legal basis as consent, conditionally worded**  -  the
   GreatInternet formulation is the benchmark: *"To measure site use with
   Google Analytics: your consent. Analytics stays off until you accept."*
   Never claim a processor is in use if its tag/env is not actually live.
3. **State what is NOT sent**  -  the BumpNotes formulation: *"We do not send
   names, email addresses, [domain-specific sensitive categories], notes,
   free text or account identifiers to analytics."* List the categories that
   matter for THIS product (health for BumpNotes, children's activity for
   RSA, etc.).
4. **Not used for advertising**  -  say it (the template enforces it:
   `ad_Storage` is always denied).
5. **Reversibility**: the choice can be changed any time via the footer
   "Privacy choices" link; describe what withdrawal does (analytics cookies
   cleared).
6. **Cookies/storage section**: the site stores the consent choice itself in
   local browser storage; if consent is granted, Google Analytics sets its
   `_ga*` cookies and Clarity its identifiers.
7. **Session recording disclosure** (Clarity is not just counters): say that
   interactions like clicks and scrolling are recorded, and that
   [masked content] is masked  -  matching the actual `data-clarity-mask`
   coverage, verified, not assumed.
8. **Last-updated date** changed in the same commit.

## Anti-patterns (each one found or nearly found in the 2026-08-29 audit)

- Claiming a processor before it's installed (page says "we use GA" while no
  tag exists and none is env-configured). Conditional wording fixes this.
- Installing tags while the page promises "no analytics" (the Photobooth
  trap  -  that page's promise is product positioning; changing it is
  Lizzie's call, not a side effect).
- Disclosure without mechanism (policy describes an "allow analytics"
  choice no banner actually offers  -  BumpNotes' state until its banner
  ships; acceptable only while collection is OFF).

## Live reference implementations (read them before writing)

- Banner + gating: bigpictureplanner.app (view-source of `clarity-consent.js`)
- Conditional privacy wording: greatinternet.app/legal/privacy
- Sensitive-data exclusion wording: bumpnotes.co.uk/privacy
- First-party analytics + footer consent + children's section: rainbowshapeart.com/privacy

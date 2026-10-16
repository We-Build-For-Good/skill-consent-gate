# Verification protocol  -  empirical, in a browser, against the served site

Use the Claude Browser tools (`preview_start {url}`, `javascript_tool`,
`read_network_requests`) or Playwright. Never verify from source alone:
client-rendered pages hide both banners and tags from curl (this misled the
2026-08-29 audit twice before browser reads corrected it). If checking a
production-host-gated script locally, serve a production build and
temporarily add the local host to `__PRODUCTION_HOSTS__` in a throwaway
copy  -  never commit that edit.

Run in order, in a fresh browser context (no stored consent):

## 1. Pre-consent silence (the load-bearing check)
Load the page, wait ~3s. Assert ZERO requests/script elements matching
`googletagmanager|google-analytics|clarity.ms`. In-page check:
```js
[...document.querySelectorAll('script[src]')].map(s=>s.src)
  .filter(s=>/gtag|clarity|googletagmanager/i.test(s))   // must be []
```
Also assert no `_ga*` cookies and no Clarity cookies exist.

## 2. Banner present and honest
The consent dialog is visible, names both processors, links the privacy
page, and offers BOTH choices in one click each ("No thanks" must not be
hidden behind a settings screen).

## 3. Decline path
Click "No thanks". Assert: banner gone; storage key holds
`{"value":"denied",...}`; still zero analytics scripts; reload → banner does
NOT reappear and still nothing loads.

## 4. Accept path (clear storage first, or use a fresh context)
Click "Allow analytics". Assert: both scripts inject
(`clarity.ms/tag/<id>` and `googletagmanager.com/gtag/js?id=G-...`); storage
key holds `granted` with a `decidedAt` timestamp; reload → tags load again
with no banner.

## 5. Withdrawal
With consent granted and tags loaded, open the footer "Privacy choices"
link, choose "No thanks". Assert: `_ga*` cookies cleared and the page
reloads (the reload is deliberate  -  it ends Clarity's active recording).

## 6. Production-host gate
On a preview/localhost hostname (unmodified script): script exits before
doing anything  -  no banner, no tags. This keeps test traffic out of the
evidence Mission Control will read.

## Recording the result

Write the per-check outcomes (with the observed script URLs and storage
values) into the repo's tracker entry for the packet. One consented test
visit will appear in the product's real analytics  -  note it.

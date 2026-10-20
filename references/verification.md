# Verification: prove it in a browser, on the deployed site

Use a real browser: Playwright, Puppeteer, or your agent's browser tools. Do not verify from source or `curl` alone: client-rendered pages hide both banners and tags from a plain HTTP fetch.

The script does nothing off its `productionHosts`, so test the live site, or serve a production build locally and add that host to a throwaway config. Never commit that config.

Start each run in a fresh browser context (no stored choice).

## 1. Nothing before consent (the check that matters most)

Load the page and wait about 3 seconds. There must be no requests to `googletagmanager.com`, `google-analytics.com` or `clarity.ms`, and no such scripts in the page:

```js
[...document.querySelectorAll('script[src]')].map(s => s.src)
  .filter(s => /googletagmanager|google-analytics|clarity\.ms/i.test(s))   // must be []
```

There must be no `_ga` cookies and no Clarity cookies.

## 2. The banner is honest

It is visible, names each configured processor, links the privacy page, and offers both choices with one click each.

## 3. Decline

Click "No thanks". The banner closes, the storage key holds `{"value":"denied",...}`, and no analytics scripts load. Reload: the banner stays closed and nothing loads.

## 4. Accept (fresh context)

Click "Allow analytics". The configured scripts load (`clarity.ms/tag/<id>`, `googletagmanager.com/gtag/js?id=G-...`), the storage key holds `granted` with a `decidedAt` timestamp, and after a reload the tags load with no banner.

## 5. Withdraw

With consent granted, click "Privacy choices" in the footer and choose "No thanks". The `_ga` cookies are gone (check the parent domain too) and the page reloads. The reload is deliberate: it stops Clarity's recording.

## 6. Non-production hosts

On a preview URL or localhost with the real config, nothing happens: no banner, no tags. This keeps test traffic out of your analytics.

## Record the result

Write down each check's outcome with the script URLs and storage values you saw. Your consented test visit will appear in the real analytics; note it.

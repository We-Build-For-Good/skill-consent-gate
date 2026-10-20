# Privacy page checklist: ship it in the same change as the tags

The privacy page must be true the moment the tags go live.

## Required content

1. **Name each processor** you actually configured: Google Analytics 4, Microsoft Clarity, or both.
2. **State the legal basis as consent**, for example: "To measure site use with Google Analytics: your consent. Analytics stays off until you accept." Never name a processor whose tag is not configured.
3. **Say what is not sent**, for example: "We do not send names, email addresses, notes, free text or account identifiers to analytics." List the categories that matter for this product.
4. **Not used for advertising.** The script always denies `ad_storage`; say so.
5. **How to change your mind**: the "Privacy choices" link in the footer, and what withdrawal does (analytics cookies cleared, page reloads).
6. **Cookies and storage**: the choice itself is kept in the browser's local storage; with consent, Google Analytics sets `_ga` cookies and Clarity sets its own identifiers.
7. **Session recording** (Clarity only): say that clicks and scrolling are recorded, and describe the masking you have verified, matching `maskingSentence`.
8. **Last-updated date**, changed in the same commit.

## Anti-patterns

* Naming a processor before it is installed. Conditional wording fixes this.
* Adding tags while the page still promises "no analytics". Changing that promise is a product decision, not a side effect.
* Describing an "allow analytics" choice that no banner offers.

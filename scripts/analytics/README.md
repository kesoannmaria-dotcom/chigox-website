# CHIGOX GA4 and Consent Mode V2

This integration is intentionally privacy-first:

- Consent defaults are queued before Google Tag Manager can load.
- GTM does not load until analytics consent is granted.
- `page_view` remains owned by GTM; the website does not send a second page view.
- Custom events only use the approved non-PII parameters.
- `generate_lead` is emitted only after `/api/inquiry` returns an HTTP success with `{ "ok": true }`.

## Repeatable checks

Run the static integration validator:

```sh
node scripts/analytics/validate-analytics.mjs
node scripts/analytics/apply-analytics.mjs
```

The second command is a dry run and must report zero changed files.

Run the browser checks while the repository is served at `http://127.0.0.1:4173`:

```sh
NODE_PATH=/absolute/path/to/node_modules node scripts/analytics/browser-check.mjs
```

The browser test stubs GTM, GA4, and `/api/inquiry`; it does not send test leads or analytics to Production.

## Required GTM container review

The public version of `GTM-TNKTN3MB` currently exposes settings that must be corrected in Google Tag Manager before Production release:

1. Disable automatic collection of user-provided data, including email, phone, and address.
2. Disable automatic form-interaction measurement, or explicitly exclude CHIGOX inquiry forms.
3. Disable automatic outbound-click measurement, or explicitly exclude WhatsApp and email links tracked by `chigox-analytics.js`.
4. Keep exactly one automatic `page_view` source in the existing GA4 Google tag for `G-42NVY5M2RM`.
5. Require `analytics_storage` consent for the GA4 configuration and event tags.
6. Require the appropriate advertising consent fields for any future advertising tags.
7. Do not create variables from form values, customer names, email addresses, phone numbers, company names, or messages.
8. Preview and verify the container before publishing a new GTM version. Container publication is a separate approval step.

## Tag Assistant Preview verification

Use only dummy data on the Cloudflare Preview deployment:

1. Open GTM Preview for `GTM-TNKTN3MB` and connect the Cloudflare Preview URL.
2. Before making a choice, confirm that no GTM container is loaded and no GA4 request is sent.
3. Select **Reject all**, reload, and confirm that GTM and GA4 remain absent.
4. Select **Accept all**, then confirm one GTM container and one `page_view`.
5. Test one quote CTA, WhatsApp link, and email link. Confirm one event for each action and only these parameters: `page_path`, `page_language`, `product_code`, `cta_location`, and `form_type` where applicable.
6. Submit the API inquiry form with approved dummy data. Confirm `form_start` once and `generate_lead` once after the success response.
7. Repeat with a rejected API response and confirm that `generate_lead` is absent.
8. Submit or interact with a `mailto:` form and confirm that `generate_lead` is absent.
9. Reopen **Cookie settings**, withdraw analytics consent, reload, and confirm that GTM no longer loads.

## GA4 DebugView verification

After the GTM safety settings above are published to a Preview-safe container version:

1. Enable GTM Preview and GA4 debug mode for the Cloudflare Preview URL.
2. Accept analytics cookies.
3. Confirm one `page_view` and each deliberately triggered custom event in DebugView.
4. Inspect event parameters and confirm that no names, emails, phone numbers, WhatsApp URLs, company names, messages, form values, or query strings are present.
5. Reject or withdraw analytics consent and confirm that subsequent actions do not appear.

Until the GTM container safety settings and DebugView evidence are complete, GA4 data receipt is not considered verified and the integration is not ready for Production.

# CHIGOX inquiry form — Preview implementation

**Status:** Local code and mocked tests only. Not deployed to Cloudflare Pages. No production account, DNS record, database, API key or secret was created.

## Approved delivery format

- Internal notification sender: `CHIGOX Website <inquiries@send.chigox.com>`
- Internal notification recipient: `sales@chigox.com`
- Customer email: `Reply-To` only; never used as `From`
- Message formats: responsive HTML table plus a plain-text fallback
- Customer-supplied text is UTF-8 and HTML-escaped before rendering
- The internal table is not sent to the customer. It may remain quoted below a normal sales reply, depending on the email client.

## Request sequence

1. The browser collects only the visible form fields, page path, page language and privacy-safe attribution fields.
2. A D1-backed 15-minute rate limit is checked. This is persistent and does not rely on Pages Function process memory.
3. Cloudflare Turnstile is verified server-side through Siteverify.
4. The server requires `success`, an allowed `hostname`, and `action=inquiry_form`.
5. Cloudflare's single-use token result is enforced and the token hash is also inserted into D1 with a unique constraint for concurrent replay protection. The raw token is not stored.
6. D1 inserts the inquiry and token hash in one batch transaction. A non-personal inquiry ID is created first.
7. Only after persistent storage succeeds does the Function call Resend.
8. Resend receives the fixed CHIGOX sender, fixed CHIGOX recipient, customer `Reply-To`, HTML table and text fallback. An idempotency key prevents duplicate notification emails.
9. D1 records whether notification delivery was accepted or failed.
10. The browser can emit `generate_lead` only when the response says `lead_saved=true`. It sends only `page_path` and `page_language` to the analytics layer, and only after analytics consent.

If Resend is temporarily unavailable after the inquiry has already been saved, the lead remains in D1 and is marked `notification_status=failed`. A retry/alert mechanism should be added before broad production rollout so sales cannot miss a saved inquiry.

## Data stored in D1

Operational inquiry data:

- non-personal inquiry ID and browser submission ID
- submission timestamp
- customer name, email, company/type, product and message
- page path, page language and landing path
- referrer origin/path with query and fragment removed
- allow-listed `utm_source`, `utm_medium` and `utm_campaign`
- country code supplied by Cloudflare, when available
- verified Turnstile hostname and action
- email-notification status and provider message ID

The raw IP address, raw Turnstile token, full referrer query, full landing-page query, name, email, company and message are not sent to GA4.

## Implemented files

- `functions/api/inquiry.js`: Pages Function, validation, persistent save, Turnstile verification, Resend call and email rendering
- `assets/js/inquiry-form.js`: shared form client; currently not referenced by production pages
- `migrations/0001_inquiries.sql`: D1 schema, replay table and persistent rate-limit table
- `_routes.json`: invokes Pages Functions only for `/api/inquiry`
- `.dev.vars.example`: key names only; contains no secret values
- `tests/inquiry-function.test.mjs`: mocked server-side regression tests
- `package.json`: local test command

## Current form inventory and rollout boundary

The current static source contains 273 `inquiry-form`/`mailto:` occurrences. None were changed in this Preview branch. Attaching the shared script to every language and product page at once is intentionally deferred.

Recommended rollout:

1. Preview-only test page.
2. English contact page plus one approved product page.
3. Verify saved D1 row, Turnstile, notification email, Reply-To, success/failure UI and consent behavior.
4. Review translated status messages.
5. Expand in controlled batches after Roy approval.

## Roy must complete before a real Preview deployment

### Cloudflare D1

1. Create separate Preview and Production D1 databases.
2. Bind each database to the Pages project as `INQUIRY_DB` in its corresponding environment.
3. Apply `migrations/0001_inquiries.sql` to each database.
4. Decide who can view/export/delete inquiry records.

### Cloudflare Turnstile

1. Create a CHIGOX-owned Turnstile widget.
2. Configure Preview hostname(s) and `www.chigox.com` separately as appropriate.
3. Set the public site key as `TURNSTILE_SITE_KEY`.
4. Store `TURNSTILE_SECRET_KEY` as an encrypted Cloudflare secret.
5. Set `TURNSTILE_ALLOWED_HOSTNAMES` separately for Preview and Production.

### Resend and DNS

1. Create or use a Roy-controlled Resend account.
2. Add and verify the sending subdomain `send.chigox.com` using only the DNS records Resend provides.
3. Create separate Preview and Production API keys.
4. Store each `RESEND_API_KEY` as an encrypted Cloudflare secret.
5. Do not paste the API key into source code, HTML, GitHub issues, commits or chat.

### Other required settings

- Generate a separate strong `RATE_LIMIT_SECRET` for each environment and store it as an encrypted Cloudflare secret.
- Set `INQUIRY_ENV=preview` or `production` as a non-secret variable.
- Confirm the inquiry retention period.
- Confirm the privacy contact email or alias.
- Approve Privacy Policy text naming Cloudflare and Resend as inquiry processors.
- Confirm the internal process for access, correction and deletion requests.

## Tests completed locally

- valid Turnstile result → persistent save → HTML table notification
- Turnstile validation failure → no save, no email, no `generate_lead`
- expired/reused Turnstile result → no save, no email
- hostname mismatch → rejected
- action mismatch → rejected
- concurrent duplicate token at D1 → transaction rejected, no email
- D1 persistence failure → no email, no `generate_lead`
- Resend failure after save → inquiry retained and marked failed
- honeypot submission → no lead
- persistent rate limit → excessive attempts blocked before Siteverify
- HTML injection in customer fields → escaped in the email
- UTF-8 apostrophe preserved; mojibake string not produced

Run with:

```bash
npm test
```

## Not included or deployed

- no real Cloudflare binding or secret
- no real Resend call or email
- no production Turnstile widget
- no production GA4/GTM event
- no modifications to the 273 existing forms
- no production deployment

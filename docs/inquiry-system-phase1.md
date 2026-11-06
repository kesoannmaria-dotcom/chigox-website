# CHIGOX Inquiry System Phase 1

Phase 1 upgrades the existing `/api/inquiry` path without migrating the
remaining `mailto:` forms. It is intended for Cloudflare Pages Preview only
until Roy approves the next phase.

## Request flow

1. The browser requests the public Turnstile Site Key from `GET /api/inquiry`.
2. The customer completes Turnstile and submits the form.
3. The API validates Turnstile, field formats and length limits.
4. D1 stores the inquiry with a unique idempotency key.
5. Resend sends the notification using the inquiry ID as its idempotency key.
6. A failed notification remains in D1 as `notification_pending`.
7. A protected retry call sends due notifications without creating new
   inquiry records.

D1 storage is mandatory. Email configuration is not required to accept and
store an inquiry, but missing email configuration leaves the notification in
the retry queue.

## Preview resources

Create an independent Preview D1 database and apply:

```text
migrations/0001_create_contact_inquiries.sql
```

Bind it to Preview as:

```text
INQUIRY_DB
```

The API intentionally does not fall back to a generic `DB` binding. If
`INQUIRY_DB` is missing, both submission and notification retry fail closed
without writing to another database.

Configure these Preview-only variables and secrets:

```text
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
RESEND_API_KEY
INQUIRY_FROM_EMAIL
INQUIRY_NOTIFICATION_TO
INQUIRY_RETRY_SECRET
```

`TURNSTILE_SITE_KEY` is public and is returned to the browser only when the
Site Key, Secret and D1 binding are all present. The Turnstile Secret, Resend
key and retry secret are never returned by the API.

The Turnstile widget must allow the Preview hostname. Tokens are accepted only
when Siteverify reports action `inquiry` and the verified hostname matches the
request hostname.

## Notification retry

Call the Preview endpoint from a trusted scheduler or manually:

```http
POST /api/inquiry-retry
Authorization: Bearer <INQUIRY_RETRY_SECRET>
```

The endpoint processes due `pending`, `notification_pending`, and stale
`sending` rows. It never returns customer data. Resend receives
`Idempotency-Key: chigox-inquiry-<inquiry_id>` to prevent duplicate
notifications during retries.

Before Production approval, connect this endpoint to a Cloudflare scheduled
trigger or equivalent authenticated Preview scheduler. Do not put the retry
secret in client code.

## Local verification

```sh
node --test tests/inquiry-api.test.mjs
node scripts/i18n/i18n.test.mjs
sqlite3 /tmp/chigox-inquiry.db < migrations/0001_create_contact_inquiries.sql
git diff --check
```

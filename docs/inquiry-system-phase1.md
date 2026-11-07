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
7. A dedicated Preview Worker calls the protected retry endpoint every five
   minutes and sends due notifications without creating new inquiry records.
8. After eight unsuccessful attempts, the record becomes
   `notification_failed` and remains available for manual handling.

D1 storage is mandatory. Email configuration is not required to accept and
store an inquiry, but missing email configuration leaves the notification in
the retry queue.

## Preview resources

Create an independent Preview D1 database and apply:

```text
migrations/0001_create_contact_inquiries.sql
migrations/0002_add_notification_failed.sql
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

The scheduler is an independent Cloudflare Worker because Pages Functions do
not receive Scheduled Events. Its configuration lives in:

```text
workers/inquiry-retry-preview/
```

The Worker runs every five minutes and calls only the allowlisted branch
Preview endpoint:

```http
POST /api/inquiry-retry
Authorization: Bearer <INQUIRY_RETRY_SECRET>
```

The Worker has no D1 or Resend binding. It cannot retry from its public HTTP
handler, which always returns `404`. The same independent retry secret must be
configured in the Worker and the Pages Preview environment.

The endpoint processes due `notification_pending` rows and `sending` rows
whose claim is at least 15 minutes old. It never returns customer data. The
batch is capped at 25 records per invocation. Resend receives
`Idempotency-Key: chigox-inquiry-<inquiry_id>` to prevent duplicate
notifications during retries, while the D1 claim prevents two scheduler runs
from sending the same inquiry concurrently.

Retry delays after failed attempts are 5 minutes, 15 minutes, 1 hour, 3 hours,
12 hours, 24 hours, 48 hours and 72 hours. The eighth failure is permanent and
stores the final error in D1. Do not put the retry secret in client code.

Deploy only the Preview Worker environment:

```sh
npx wrangler deploy --env preview \
  --config workers/inquiry-retry-preview/wrangler.toml
```

## Local verification

```sh
node --test tests/inquiry-api.test.mjs tests/inquiry-retry-worker.test.mjs
node scripts/i18n/i18n.test.mjs
sqlite3 /tmp/chigox-inquiry.db < migrations/0001_create_contact_inquiries.sql
sqlite3 /tmp/chigox-inquiry.db < migrations/0002_add_notification_failed.sql
git diff --check
```

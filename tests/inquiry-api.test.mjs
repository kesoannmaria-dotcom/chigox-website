import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { afterEach } from "node:test";

import {
  MAX_NOTIFICATION_ATTEMPTS,
  getNotificationRetryDelayMinutes,
  onRequestGet,
  onRequestPost,
  retryPendingNotifications,
  validateInquiry,
  verifyTurnstile
} from "../functions/api/inquiry.js";
import {
  onRequestGet as retryGet,
  onRequestPost as retryPost
} from "../functions/api/inquiry-retry.js";

const originalFetch = globalThis.fetch;
const OFFICIAL_TEST_SITE_KEY = "1x00000000000000000000AA";
const OFFICIAL_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";
const PREVIEW_API_URL =
  "https://4c3b7534.chigox-website.pages.dev/api/inquiry";

afterEach(() => {
  globalThis.fetch = originalFetch;
});

class MockD1 {
  constructor({ failInsert = false } = {}) {
    this.failInsert = failInsert;
    this.rows = [];
  }

  prepare(sql) {
    const database = this;
    const normalized = sql.replace(/\s+/g, " ").trim();
    let values = [];
    return {
      bind(...nextValues) {
        values = nextValues;
        return this;
      },
      async run() {
        if (normalized.startsWith("INSERT INTO contact_inquiries")) {
          if (database.failInsert) throw new Error("D1 insert failed");
          const [
            inquiryId,
            idempotencyKey,
            payloadHash,
            customerName,
            email,
            country,
            company,
            productCode,
            message,
            language,
            pageUrl,
            landingPage,
            utmSource,
            utmMedium,
            utmCampaign
          ] = values;
          if (database.rows.some((row) => row.idempotency_key === idempotencyKey)) {
            return { meta: { changes: 0 } };
          }
          database.rows.push({
            inquiry_id: inquiryId,
            idempotency_key: idempotencyKey,
            payload_hash: payloadHash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            customer_name: customerName,
            email,
            country,
            company,
            product_code: productCode,
            message,
            language,
            page_url: pageUrl,
            landing_page: landingPage,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            status: "new",
            notification_status: "pending",
            notification_attempts: 0,
            notification_next_attempt_at: null,
            notification_failed_at: null,
            notification_last_error: null,
            stale_sending: false
          });
          return { meta: { changes: 1 } };
        }

        if (normalized.includes("SET notification_status = 'sending'")) {
          const row = database.rows.find((candidate) => candidate.inquiry_id === values[0]);
          if (
            !row ||
            !(
              ["pending", "notification_pending"].includes(
                row.notification_status
              ) ||
              (row.notification_status === "sending" && row.stale_sending)
            )
          ) {
            return { meta: { changes: 0 } };
          }
          row.notification_status = "sending";
          row.updated_at = new Date().toISOString();
          row.stale_sending = false;
          return { meta: { changes: 1 } };
        }

        if (normalized.includes("SET notification_status = 'sent'")) {
          const [attempts, providerId, inquiryId] = values;
          const row = database.rows.find((candidate) => candidate.inquiry_id === inquiryId);
          row.notification_status = "sent";
          row.notification_attempts = attempts;
          row.notification_provider_id = providerId;
          row.notification_next_attempt_at = null;
          row.notification_last_error = null;
          return { meta: { changes: 1 } };
        }

        if (normalized.includes("SET notification_status = 'notification_pending'")) {
          const [attempts, nextAttemptAt, error, inquiryId] = values;
          const row = database.rows.find((candidate) => candidate.inquiry_id === inquiryId);
          row.notification_status = "notification_pending";
          row.notification_attempts = attempts;
          row.notification_next_attempt_at = nextAttemptAt;
          row.notification_last_error = error;
          return { meta: { changes: 1 } };
        }

        if (normalized.includes("SET notification_status = 'notification_failed'")) {
          const [attempts, error, inquiryId] = values;
          const row = database.rows.find((candidate) => candidate.inquiry_id === inquiryId);
          row.notification_status = "notification_failed";
          row.notification_attempts = attempts;
          row.notification_next_attempt_at = null;
          row.notification_last_error = error;
          row.notification_failed_at = new Date().toISOString();
          return { meta: { changes: 1 } };
        }

        throw new Error(`Unhandled run SQL: ${normalized}`);
      },
      async first() {
        if (normalized.includes("WHERE idempotency_key = ?")) {
          return (
            database.rows.find((row) => row.idempotency_key === values[0]) || null
          );
        }
        throw new Error(`Unhandled first SQL: ${normalized}`);
      },
      async all() {
        if (
          normalized.startsWith("SELECT * FROM contact_inquiries") &&
          normalized.includes("notification_attempts < ?")
        ) {
          const [maxAttempts, limit] = values;
          const now = Date.now();
          return {
            results: database.rows
              .filter(
                (row) =>
                  (row.notification_status === "notification_pending" ||
                    (row.notification_status === "sending" &&
                      row.stale_sending)) &&
                  row.notification_attempts < maxAttempts &&
                  (!row.notification_next_attempt_at ||
                    Date.parse(row.notification_next_attempt_at) <= now)
              )
              .slice(0, limit)
          };
        }
        throw new Error(`Unhandled all SQL: ${normalized}`);
      }
    };
  }
}

const baseEnv = (db = new MockD1()) => ({
  INQUIRY_DB: db,
  TURNSTILE_SITE_KEY: "production-site-key",
  TURNSTILE_SECRET_KEY: "production-secret-key",
  TURNSTILE_ALLOWED_HOSTNAMES: "preview.example",
  RESEND_API_KEY: "preview-resend-key",
  INQUIRY_FROM_EMAIL: "CHIGOX Preview <preview@example.com>",
  INQUIRY_NOTIFICATION_TO: "preview-recipient@example.com",
  INQUIRY_RETRY_SECRET: "preview-retry-secret"
});

const previewTestEnv = (db = new MockD1()) => ({
  ...baseEnv(db),
  TURNSTILE_SITE_KEY: OFFICIAL_TEST_SITE_KEY,
  TURNSTILE_SECRET_KEY: OFFICIAL_TEST_SECRET_KEY,
  TURNSTILE_TEST_MODE: "cloudflare-preview"
});

const payload = (overrides = {}) => ({
  name: "Pedro Gomez",
  email: "pedro@example.com",
  country: "CO",
  company: "Clinic Example",
  product_code: "CGU-LCP",
  message: "Please send configuration and quotation.",
  language: "es",
  page_url: "https://preview.example/contact-us/",
  landing_page: "https://preview.example/products/ultrasound/",
  utm_source: "google",
  utm_medium: "organic",
  utm_campaign: "preview-test",
  idempotency_key: "test-inquiry-key-0001",
  turnstileToken: "valid-turnstile-token",
  ...overrides
});

const requestFor = (
  body,
  headers = {},
  url = "https://preview.example/api/inquiry"
) => {
  const request = new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
  Object.defineProperty(request, "cf", { value: { country: "CO" } });
  return request;
};

const configRequestFor = (url = "https://preview.example/api/inquiry") =>
  new Request(url, { headers: { accept: "application/json" } });

const installFetch = ({
  turnstileSuccess = true,
  resendSuccess = true,
  resendDelayMs = 0
} = {}) => {
  const calls = { turnstile: 0, resend: 0, resendHeaders: [] };
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes("siteverify")) {
      calls.turnstile += 1;
      return Response.json({
        success: turnstileSuccess,
        action: turnstileSuccess ? "inquiry" : "",
        hostname: "preview.example"
      });
    }
    if (String(url).includes("api.resend.com")) {
      calls.resend += 1;
      calls.resendHeaders.push(options.headers);
      if (resendDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, resendDelayMs));
      }
      return resendSuccess
        ? Response.json({ id: "email-preview-1" })
        : Response.json({ message: "temporary failure" }, { status: 503 });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  return calls;
};

test("GET exposes the public site key only when D1 and both Turnstile keys exist", async () => {
  const ready = await onRequestGet({
    request: configRequestFor(),
    env: baseEnv()
  });
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).turnstileSiteKey, "production-site-key");

  const unavailable = await onRequestGet({
    request: configRequestFor(),
    env: { TURNSTILE_SITE_KEY: "site-only" }
  });
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).code, "CONFIG_UNAVAILABLE");

  const previewReady = await onRequestGet({
    request: configRequestFor(PREVIEW_API_URL),
    env: previewTestEnv()
  });
  assert.equal(previewReady.status, 200);
  assert.equal((await previewReady.json()).turnstileSiteKey, OFFICIAL_TEST_SITE_KEY);
});

test("legacy DB binding is never used when INQUIRY_DB is missing", async () => {
  const legacyDatabase = new MockD1();
  const env = {
    ...baseEnv(),
    INQUIRY_DB: undefined,
    DB: legacyDatabase
  };

  const config = await onRequestGet({ request: configRequestFor(), env });
  assert.equal(config.status, 503);
  assert.equal((await config.json()).code, "CONFIG_UNAVAILABLE");

  const calls = installFetch();
  const submission = await onRequestPost({
    request: requestFor(payload()),
    env
  });
  assert.equal(submission.status, 503);
  assert.equal((await submission.json()).code, "CONFIG_UNAVAILABLE");
  assert.equal(legacyDatabase.rows.length, 0);
  assert.equal(calls.turnstile, 0);
  assert.equal(calls.resend, 0);

  await assert.rejects(
    retryPendingNotifications(env),
    /INQUIRY_DB is not configured/
  );
});

test("normal submission saves first and records a sent notification", async () => {
  const db = new MockD1();
  const calls = installFetch();
  const response = await onRequestPost({
    request: requestFor(payload()),
    env: baseEnv(db)
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.notificationStatus, "sent");
  assert.equal(db.rows.length, 1);
  assert.equal(db.rows[0].status, "new");
  assert.equal(db.rows[0].notification_status, "sent");
  assert.equal(calls.turnstile, 1);
  assert.equal(calls.resend, 1);
  assert.match(
    calls.resendHeaders[0]["idempotency-key"],
    /^chigox-inquiry-/
  );
});

test("missing and failed Turnstile tokens never save or notify", async () => {
  const missingDb = new MockD1();
  installFetch();
  const missing = await onRequestPost({
    request: requestFor(payload({ turnstileToken: "" })),
    env: baseEnv(missingDb)
  });
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).code, "VERIFICATION_REQUIRED");
  assert.equal(missingDb.rows.length, 0);

  const failedDb = new MockD1();
  const calls = installFetch({ turnstileSuccess: false });
  const failed = await onRequestPost({
    request: requestFor(payload()),
    env: baseEnv(failedDb)
  });
  assert.equal(failed.status, 400);
  assert.equal((await failed.json()).code, "VERIFICATION_FAILED");
  assert.equal(failedDb.rows.length, 0);
  assert.equal(calls.resend, 0);
});

test("Turnstile action and hostname must match the inquiry request", async () => {
  const request = requestFor(payload());
  const wrongAction = await verifyTurnstile(
    request,
    baseEnv(),
    "token",
    async () => Response.json({ success: true, action: "login", hostname: "preview.example" })
  );
  assert.equal(wrongAction.code, "VERIFICATION_FAILED");

  const wrongHost = await verifyTurnstile(
    request,
    baseEnv(),
    "token",
    async () => Response.json({ success: true, action: "inquiry", hostname: "other.example" })
  );
  assert.equal(wrongHost.code, "VERIFICATION_FAILED");
});

test("official Preview test response accepts example.com without an action", async () => {
  const result = await verifyTurnstile(
    requestFor(payload(), {}, PREVIEW_API_URL),
    previewTestEnv(),
    "dummy-token",
    async () => Response.json({ success: true, hostname: "example.com" })
  );
  assert.deepEqual(result, { ok: true });
});

test("official Preview test response still fails when success is false", async () => {
  const result = await verifyTurnstile(
    requestFor(payload(), {}, PREVIEW_API_URL),
    previewTestEnv(),
    "dummy-token",
    async () => Response.json({ success: false, hostname: "example.com" })
  );
  assert.equal(result.code, "VERIFICATION_FAILED");
});

test("official Preview test response strictly requires example.com and no action", async () => {
  const wrongHostname = await verifyTurnstile(
    requestFor(payload(), {}, PREVIEW_API_URL),
    previewTestEnv(),
    "dummy-token",
    async () =>
      Response.json({ success: true, hostname: "4c3b7534.chigox-website.pages.dev" })
  );
  assert.equal(wrongHostname.code, "VERIFICATION_FAILED");

  const unexpectedAction = await verifyTurnstile(
    requestFor(payload(), {}, PREVIEW_API_URL),
    previewTestEnv(),
    "dummy-token",
    async () =>
      Response.json({ success: true, hostname: "example.com", action: "inquiry" })
  );
  assert.equal(unexpectedAction.code, "VERIFICATION_FAILED");
});

test("official test keys and test mode are rejected on Production", async () => {
  const productionRequest = requestFor(
    payload(),
    {},
    "https://www.chigox.com/api/inquiry"
  );
  const result = await verifyTurnstile(
    productionRequest,
    previewTestEnv(),
    "dummy-token",
    async () => Response.json({ success: true, hostname: "example.com" })
  );
  assert.equal(result.code, "CONFIG_UNAVAILABLE");

  const testModeDisabled = previewTestEnv();
  delete testModeDisabled.TURNSTILE_TEST_MODE;
  const testKeysWithoutMode = await verifyTurnstile(
    productionRequest,
    testModeDisabled,
    "dummy-token",
    async () => Response.json({ success: true, hostname: "example.com" })
  );
  assert.equal(testKeysWithoutMode.code, "CONFIG_UNAVAILABLE");
});

test("production verification fails closed for wrong action or hostname", async () => {
  const productionRequest = requestFor(
    payload(),
    {},
    "https://www.chigox.com/api/inquiry"
  );
  const productionEnv = {
    ...baseEnv(),
    TURNSTILE_ALLOWED_HOSTNAMES: "chigox.com,www.chigox.com"
  };
  const wrongAction = await verifyTurnstile(
    productionRequest,
    productionEnv,
    "token",
    async () =>
      Response.json({ success: true, action: "login", hostname: "www.chigox.com" })
  );
  assert.equal(wrongAction.code, "VERIFICATION_FAILED");

  const wrongHostname = await verifyTurnstile(
    productionRequest,
    productionEnv,
    "token",
    async () =>
      Response.json({ success: true, action: "inquiry", hostname: "other.example" })
  );
  assert.equal(wrongHostname.code, "VERIFICATION_FAILED");
});

test("missing token, secret, or invalid Preview test configuration fails closed", async () => {
  const previewRequest = requestFor(payload(), {}, PREVIEW_API_URL);
  const missingToken = await verifyTurnstile(
    previewRequest,
    previewTestEnv(),
    "",
    async () => Response.json({ success: true, hostname: "example.com" })
  );
  assert.equal(missingToken.code, "VERIFICATION_REQUIRED");

  const missingSecret = await verifyTurnstile(
    previewRequest,
    { ...previewTestEnv(), TURNSTILE_SECRET_KEY: "" },
    "dummy-token",
    async () => Response.json({ success: true, hostname: "example.com" })
  );
  assert.equal(missingSecret.code, "CONFIG_UNAVAILABLE");

  const wrongMode = await verifyTurnstile(
    previewRequest,
    { ...previewTestEnv(), TURNSTILE_TEST_MODE: "true" },
    "dummy-token",
    async () => Response.json({ success: true, hostname: "example.com" })
  );
  assert.equal(wrongMode.code, "CONFIG_UNAVAILABLE");

  const mismatchedSecret = await verifyTurnstile(
    previewRequest,
    { ...previewTestEnv(), TURNSTILE_SECRET_KEY: "production-secret-key" },
    "dummy-token",
    async () => Response.json({ success: true, hostname: "example.com" })
  );
  assert.equal(mismatchedSecret.code, "CONFIG_UNAVAILABLE");
});

test("invalid email and missing required fields are rejected before storage", async () => {
  const invalidEmail = validateInquiry({
    ...payload(),
    email: "not-an-email",
    productCode: "CGU-LCP",
    pageUrl: "",
    landingPage: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: ""
  });
  assert.equal(invalidEmail.code, "EMAIL_INVALID");

  const missingName = validateInquiry({
    ...payload(),
    name: "",
    productCode: "CGU-LCP",
    pageUrl: "",
    landingPage: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: ""
  });
  assert.equal(missingName.code, "NAME_REQUIRED");
});

test("duplicate submissions create one row and one email", async () => {
  const db = new MockD1();
  const calls = installFetch();
  const env = baseEnv(db);
  const first = await onRequestPost({
    request: requestFor(payload()),
    env
  });
  const second = await onRequestPost({
    request: requestFor(payload()),
    env
  });
  const secondResult = await second.json();

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(secondResult.duplicate, true);
  assert.equal(db.rows.length, 1);
  assert.equal(calls.resend, 1);
});

test("D1 failure returns an error and Resend is not called", async () => {
  const db = new MockD1({ failInsert: true });
  const calls = installFetch();
  const response = await onRequestPost({
    request: requestFor(payload()),
    env: baseEnv(db)
  });
  const result = await response.json();

  assert.equal(response.status, 503);
  assert.equal(result.code, "STORAGE_UNAVAILABLE");
  assert.equal(calls.resend, 0);
});

test("Resend failure keeps the inquiry and a retry sends it once", async () => {
  const db = new MockD1();
  const failedCalls = installFetch({ resendSuccess: false });
  const env = baseEnv(db);
  const response = await onRequestPost({
    request: requestFor(payload()),
    env
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.notificationStatus, "notification_pending");
  assert.equal(db.rows.length, 1);
  assert.equal(db.rows[0].notification_status, "notification_pending");
  assert.equal(failedCalls.resend, 1);
  const firstRetryDelay =
    Date.parse(db.rows[0].notification_next_attempt_at) - Date.now();
  assert.ok(firstRetryDelay > 4.9 * 60 * 1000);
  assert.ok(firstRetryDelay <= 5 * 60 * 1000);

  db.rows[0].notification_next_attempt_at = new Date(0).toISOString();
  const retryCalls = installFetch();
  const retry = await retryPendingNotifications(env);
  assert.deepEqual(retry, {
    checked: 1,
    sent: 1,
    pending: 0,
    failed: 0,
    skipped: 0
  });
  assert.equal(db.rows[0].notification_status, "sent");
  assert.equal(retryCalls.resend, 1);
});

test("notification retry delays start at five minutes and back off", () => {
  assert.equal(getNotificationRetryDelayMinutes(1), 5);
  assert.equal(getNotificationRetryDelayMinutes(2), 15);
  assert.equal(getNotificationRetryDelayMinutes(3), 60);
  assert.equal(getNotificationRetryDelayMinutes(4), 180);
  assert.equal(getNotificationRetryDelayMinutes(5), 720);
  assert.equal(getNotificationRetryDelayMinutes(6), 1440);
  assert.equal(getNotificationRetryDelayMinutes(7), 2880);
  assert.equal(getNotificationRetryDelayMinutes(8), 4320);
});

test("retry excludes untouched pending rows and recovers stale sending rows", async () => {
  const db = new MockD1();
  db.rows.push(
    {
      inquiry_id: "initial-pending",
      notification_status: "pending",
      notification_attempts: 0
    },
    {
      inquiry_id: "stale-sending",
      notification_status: "sending",
      notification_attempts: 1,
      stale_sending: true,
      customer_name: "Test",
      email: "test@example.com",
      message: "Test",
      product_code: "CGU-C"
    }
  );
  const calls = installFetch();
  const result = await retryPendingNotifications(baseEnv(db));

  assert.equal(calls.resend, 1);
  assert.equal(db.rows[0].notification_status, "pending");
  assert.equal(db.rows[1].notification_status, "sent");
  assert.deepEqual(result, {
    checked: 1,
    sent: 1,
    pending: 0,
    failed: 0,
    skipped: 0
  });
});

test("the eighth failed attempt becomes a permanent notification failure", async () => {
  const db = new MockD1();
  db.rows.push({
    inquiry_id: "max-attempt-row",
    notification_status: "notification_pending",
    notification_attempts: MAX_NOTIFICATION_ATTEMPTS - 1,
    notification_next_attempt_at: new Date(0).toISOString(),
    customer_name: "Test",
    email: "test@example.com",
    message: "Test",
    product_code: "CGU-C"
  });
  const calls = installFetch({ resendSuccess: false });
  const result = await retryPendingNotifications(baseEnv(db));

  assert.equal(calls.resend, 1);
  assert.equal(db.rows[0].notification_status, "notification_failed");
  assert.equal(db.rows[0].notification_attempts, MAX_NOTIFICATION_ATTEMPTS);
  assert.equal(db.rows[0].notification_next_attempt_at, null);
  assert.ok(db.rows[0].notification_failed_at);
  assert.deepEqual(result, {
    checked: 1,
    sent: 0,
    pending: 0,
    failed: 1,
    skipped: 0
  });

  const second = await retryPendingNotifications(baseEnv(db));
  assert.equal(second.checked, 0);
  assert.equal(calls.resend, 1);
});

test("concurrent retry tasks claim one row and send one email", async () => {
  const db = new MockD1();
  db.rows.push({
    inquiry_id: "concurrent-row",
    notification_status: "notification_pending",
    notification_attempts: 1,
    notification_next_attempt_at: new Date(0).toISOString(),
    customer_name: "Test",
    email: "test@example.com",
    message: "Test",
    product_code: "CGU-C"
  });
  const calls = installFetch({ resendDelayMs: 10 });
  const env = baseEnv(db);
  const results = await Promise.all([
    retryPendingNotifications(env),
    retryPendingNotifications(env)
  ]);

  assert.equal(calls.resend, 1);
  assert.equal(db.rows[0].notification_status, "sent");
  assert.equal(results.reduce((total, result) => total + result.sent, 0), 1);
});

test("retry endpoint requires its Preview secret", async () => {
  const unauthorized = await retryPost({
    request: new Request("https://preview.example/api/inquiry-retry", {
      method: "POST"
    }),
    env: baseEnv()
  });
  assert.equal(unauthorized.status, 401);

  const method = retryGet();
  assert.equal(method.status, 405);
});

test("client script contains localized feedback for all nine languages", async () => {
  const source = await readFile(
    new URL("../assets/js/inquiry-turnstile.js", import.meta.url),
    "utf8"
  );
  const requiredCodes = [
    "CONFIG_UNAVAILABLE",
    "VERIFICATION_REQUIRED",
    "VERIFICATION_FAILED",
    "NAME_REQUIRED",
    "EMAIL_REQUIRED",
    "EMAIL_INVALID",
    "MESSAGE_REQUIRED",
    "FIELD_TOO_LONG",
    "INVALID_LANGUAGE",
    "INVALID_PAGE_URL",
    "INVALID_IDEMPOTENCY_KEY",
    "IDEMPOTENCY_CONFLICT",
    "STORAGE_UNAVAILABLE",
    "RATE_LIMITED"
  ];
  for (const language of ["en", "es", "tr", "de", "it", "pl", "ko", "fr", "pt"]) {
    assert.match(source, new RegExp(`\\n    ${language}: \\{`));
  }
  for (const code of requiredCodes) {
    assert.equal(
      source.match(new RegExp(`\\n      ${code}:`, "g"))?.length,
      9,
      `${code} must be localized for all nine languages`
    );
  }
});

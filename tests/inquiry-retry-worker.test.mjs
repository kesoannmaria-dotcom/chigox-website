import assert from "node:assert/strict";
import test from "node:test";

import worker, {
  resolveRetryEndpoint,
  runScheduledRetry
} from "../workers/inquiry-retry-preview/src/index.js";

const baseEnv = () => ({
  TARGET_RETRY_URL:
    "https://codex-inquiry-system-phase1.chigox-website.pages.dev/api/inquiry-retry",
  EXPECTED_PREVIEW_HOST:
    "codex-inquiry-system-phase1.chigox-website.pages.dev",
  INQUIRY_RETRY_SECRET: "test-secret"
});

test("retry worker accepts only the configured CHIGOX Preview endpoint", () => {
  assert.equal(
    resolveRetryEndpoint(baseEnv()),
    baseEnv().TARGET_RETRY_URL
  );
  for (const target of [
    "https://www.chigox.com/api/inquiry-retry",
    "https://chigox-website.pages.dev/api/inquiry-retry",
    "https://codex-inquiry-system-phase1.chigox-website.pages.dev/api/inquiry",
    "http://codex-inquiry-system-phase1.chigox-website.pages.dev/api/inquiry-retry"
  ]) {
    assert.throws(
      () => resolveRetryEndpoint({ ...baseEnv(), TARGET_RETRY_URL: target }),
      /approved CHIGOX Preview endpoint/
    );
  }
});

test("scheduled retry sends one authenticated request and returns a summary", async () => {
  const calls = [];
  const result = await runScheduledRetry(baseEnv(), async (url, options) => {
    calls.push({ url, options });
    return Response.json({
      ok: true,
      checked: 2,
      sent: 1,
      pending: 1,
      failed: 0,
      skipped: 0
    });
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.authorization, "Bearer test-secret");
  assert.deepEqual(result, {
    checked: 2,
    sent: 1,
    pending: 1,
    failed: 0,
    skipped: 0
  });
});

test("scheduled retry fails closed for missing secret or endpoint failure", async () => {
  await assert.rejects(
    runScheduledRetry({ ...baseEnv(), INQUIRY_RETRY_SECRET: "" }),
    /INQUIRY_RETRY_SECRET/
  );
  await assert.rejects(
    runScheduledRetry(baseEnv(), async () =>
      Response.json({ ok: false }, { status: 401 })
    ),
    /HTTP 401/
  );
});

test("the Worker public fetch handler cannot run retries", async () => {
  const response = await worker.fetch();
  assert.equal(response.status, 404);
});

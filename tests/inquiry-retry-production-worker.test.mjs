import assert from "node:assert/strict";
import test from "node:test";

import worker, {
  resolveRetryEndpoint,
  runScheduledRetry
} from "../workers/inquiry-retry-production/src/index.js";

const PRODUCTION_RETRY_URL = "https://www.chigox.com/api/inquiry-retry";

const baseEnv = () => ({
  TARGET_RETRY_URL: PRODUCTION_RETRY_URL,
  INQUIRY_RETRY_SECRET: "test-secret"
});

test("production retry worker accepts only the fixed Production endpoint", () => {
  assert.equal(resolveRetryEndpoint(baseEnv()), PRODUCTION_RETRY_URL);

  for (const target of [
    "",
    "https://chigox.com/api/inquiry-retry",
    "https://www.chigox.com/api/inquiry",
    "https://www.chigox.com/api/inquiry-retry?limit=25",
    "http://www.chigox.com/api/inquiry-retry",
    "https://codex-inquiry-system-phase1.chigox-website.pages.dev/api/inquiry-retry"
  ]) {
    assert.throws(
      () => resolveRetryEndpoint({ ...baseEnv(), TARGET_RETRY_URL: target }),
      /Production retry target/
    );
  }
});

test("production retry worker sends one authenticated request", async () => {
  const calls = [];
  const result = await runScheduledRetry(baseEnv(), async (url, options) => {
    calls.push({ url, options });
    return Response.json({
      ok: true,
      checked: 25,
      sent: 20,
      pending: 3,
      failed: 1,
      skipped: 1
    });
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, PRODUCTION_RETRY_URL);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.authorization, "Bearer test-secret");
  assert.equal(
    calls[0].options.headers["user-agent"],
    "chigox-inquiry-retry-production/1.0"
  );
  assert.deepEqual(result, {
    checked: 25,
    sent: 20,
    pending: 3,
    failed: 1,
    skipped: 1
  });
});

test("production retry worker fails closed", async () => {
  await assert.rejects(
    runScheduledRetry({ ...baseEnv(), INQUIRY_RETRY_SECRET: "" }),
    /INQUIRY_RETRY_SECRET/
  );
  await assert.rejects(
    runScheduledRetry(baseEnv(), async () =>
      Response.json({ ok: false }, { status: 404 })
    ),
    /HTTP 404/
  );
});

test("production retry worker public fetch handler returns 404", async () => {
  const response = await worker.fetch();
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Not found");
});

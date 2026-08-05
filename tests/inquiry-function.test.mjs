import test from "node:test";
import assert from "node:assert/strict";

import {
  handleInquiryPost,
  renderInquiryEmail,
} from "../functions/api/inquiry.js";

const HOST = "preview.chigox.pages.dev";
const API_URL = `https://${HOST}/api/inquiry`;

class FakeStatement {
  constructor(db, sql, parameters = []) {
    this.db = db;
    this.sql = sql;
    this.parameters = parameters;
  }

  bind(...parameters) {
    return new FakeStatement(this.db, this.sql, parameters);
  }

  first() {
    return this.db.first(this);
  }

  run() {
    return this.db.run(this);
  }
}

class FakeD1 {
  constructor(options = {}) {
    this.events = options.events || [];
    this.rateCount = options.rateCount || 1;
    this.failPersist = options.failPersist || false;
    this.duplicateToken = options.duplicateToken || false;
    this.savedStatements = [];
    this.notificationUpdates = [];
  }

  prepare(sql) {
    return new FakeStatement(this, sql);
  }

  async first(statement) {
    if (statement.sql.includes("inquiry_rate_limits")) {
      this.events.push("rate-limit");
      return { submission_count: this.rateCount };
    }
    throw new Error(`Unexpected first(): ${statement.sql}`);
  }

  async run(statement) {
    if (statement.sql.includes("UPDATE inquiries")) {
      this.events.push(`notification:${statement.parameters[0]}`);
      this.notificationUpdates.push(statement.parameters);
      return { success: true };
    }
    throw new Error(`Unexpected run(): ${statement.sql}`);
  }

  async batch(statements) {
    this.events.push("persist");
    if (this.failPersist) throw new Error("D1 persistence unavailable");
    if (this.duplicateToken) throw new Error("UNIQUE constraint failed: used_turnstile_tokens.token_hash");
    this.savedStatements = statements;
    return statements.map(() => ({ success: true }));
  }
}

function makeBody(overrides = {}) {
  return {
    submission_id: "3f87ba18-7551-4f0e-8f24-086240349321",
    name: "Sample <Buyer>",
    email: "buyer@example.com",
    company: "Example Veterinary Clinic",
    product: "CGU-LC Wireless Convex Linear Ultrasound Scanner",
    message: "I’m considering an ultrasound system.\nPlease send a configuration.",
    website: "",
    turnstile_token: "valid-turnstile-token",
    page_path: "/products/ultrasound/cgu-lc/?private=value",
    page_language: "en",
    landing_page: "/products/ultrasound/cgu-lc/?email=private@example.com",
    referrer: "https://www.google.com/search?q=private-query",
    utm_source: "google",
    utm_medium: "organic",
    utm_campaign: "",
    ...overrides,
  };
}

function makeRequest(body = makeBody()) {
  const request = new Request(API_URL, {
    method: "POST",
    headers: {
      origin: `https://${HOST}`,
      "content-type": "application/json; charset=utf-8",
      "cf-connecting-ip": "203.0.113.42",
    },
    body: JSON.stringify(body),
  });
  Object.defineProperty(request, "cf", { value: { country: "CO" } });
  return request;
}

function makeEnv(db) {
  return {
    INQUIRY_DB: db,
    TURNSTILE_SITE_KEY: "public-test-site-key",
    TURNSTILE_SECRET_KEY: "secret-test-key",
    TURNSTILE_ALLOWED_HOSTNAMES: HOST,
    RATE_LIMIT_SECRET: "private-rate-limit-secret",
    RESEND_API_KEY: "private-resend-test-key",
    INQUIRY_ENV: "preview",
  };
}

function makeFetch(options = {}) {
  const calls = [];
  const events = options.events || [];
  const fetchImpl = async (url, request) => {
    calls.push({ url: String(url), request });
    if (String(url).includes("siteverify")) {
      events.push("turnstile");
      return Response.json(options.turnstile || {
        success: true,
        hostname: HOST,
        action: "inquiry_form",
        "error-codes": [],
      });
    }
    if (String(url).includes("api.resend.com")) {
      events.push("resend");
      if (options.resendFailure) return Response.json({ message: "test failure" }, { status: 500 });
      return Response.json({ id: "resend-preview-id" });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  return { calls, fetchImpl };
}

async function responseJson(response) {
  return JSON.parse(await response.text());
}

const dependencies = {
  now: "2026-08-05T08:00:00.000Z",
  uuid: "12345678-1234-4234-9234-1234567890ab",
};

test("valid inquiry is verified, persisted, then emailed as an HTML table", async () => {
  const events = [];
  const db = new FakeD1({ events });
  const mocked = makeFetch({ events });
  const response = await handleInquiryPost(
    { request: makeRequest(), env: makeEnv(db) },
    { ...dependencies, fetchImpl: mocked.fetchImpl },
  );
  const result = await responseJson(response);

  assert.equal(response.status, 201);
  assert.deepEqual(result, {
    ok: true,
    lead_saved: true,
    lead_id: "INQ-20260805-12345678",
    notification_sent: true,
    analytics_event: "generate_lead",
    page_path: "/products/ultrasound/cgu-lc/",
    page_language: "en",
  });
  assert.deepEqual(events, ["rate-limit", "turnstile", "persist", "resend", "notification:sent"]);

  const resendCall = mocked.calls.find((call) => call.url.includes("api.resend.com"));
  const resendPayload = JSON.parse(resendCall.request.body);
  assert.equal(resendPayload.from, "CHIGOX Website <inquiries@send.chigox.com>");
  assert.deepEqual(resendPayload.to, ["sales@chigox.com"]);
  assert.equal(resendPayload.reply_to, "buyer@example.com");
  assert.match(resendPayload.html, /Customer information/);
  assert.match(resendPayload.html, /Sample &lt;Buyer&gt;/);
  assert.doesNotMatch(resendPayload.html, /Sample <Buyer>/);
  assert.match(resendPayload.html, /I’m considering an ultrasound system/);
  assert.doesNotMatch(resendPayload.html, /Iâ€™m/);
  assert.match(resendPayload.html, /\/products\/ultrasound\/cgu-lc\//);
  assert.doesNotMatch(resendPayload.html, /private@example\.com/);
  assert.equal(resendCall.request.headers["idempotency-key"], "chigox-INQ-20260805-12345678");

  const serializedResponse = JSON.stringify(result);
  assert.doesNotMatch(serializedResponse, /buyer@example\.com|Sample <Buyer>|Veterinary Clinic/);
});

test("failed Turnstile validation never persists or emails", async () => {
  const events = [];
  const db = new FakeD1({ events });
  const mocked = makeFetch({
    events,
    turnstile: { success: false, "error-codes": ["invalid-input-response"] },
  });
  const response = await handleInquiryPost(
    { request: makeRequest(), env: makeEnv(db) },
    { ...dependencies, fetchImpl: mocked.fetchImpl },
  );
  const result = await responseJson(response);

  assert.equal(response.status, 422);
  assert.equal(result.error, "turnstile_failed");
  assert.deepEqual(events, ["rate-limit", "turnstile"]);
});

test("reused or expired Turnstile token is rejected", async () => {
  const events = [];
  const db = new FakeD1({ events });
  const mocked = makeFetch({
    events,
    turnstile: { success: false, "error-codes": ["timeout-or-duplicate"] },
  });
  const response = await handleInquiryPost(
    { request: makeRequest(), env: makeEnv(db) },
    { ...dependencies, fetchImpl: mocked.fetchImpl },
  );
  const result = await responseJson(response);

  assert.equal(response.status, 422);
  assert.equal(result.error, "turnstile_duplicate");
  assert.deepEqual(events, ["rate-limit", "turnstile"]);
});

test("Turnstile hostname and action must match the configured form", async (t) => {
  for (const scenario of [
    {
      name: "hostname mismatch",
      turnstile: { success: true, hostname: "wrong.example.com", action: "inquiry_form" },
      error: "turnstile_hostname_mismatch",
    },
    {
      name: "action mismatch",
      turnstile: { success: true, hostname: HOST, action: "login_form" },
      error: "turnstile_action_mismatch",
    },
  ]) {
    await t.test(scenario.name, async () => {
      const db = new FakeD1();
      const mocked = makeFetch({ turnstile: scenario.turnstile });
      const response = await handleInquiryPost(
        { request: makeRequest(), env: makeEnv(db) },
        { ...dependencies, fetchImpl: mocked.fetchImpl },
      );
      const result = await responseJson(response);
      assert.equal(response.status, 422);
      assert.equal(result.error, scenario.error);
      assert.equal(mocked.calls.filter((call) => call.url.includes("api.resend.com")).length, 0);
    });
  }
});

test("persistence failure prevents email and generate_lead response", async () => {
  const events = [];
  const db = new FakeD1({ events, failPersist: true });
  const mocked = makeFetch({ events });
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await handleInquiryPost(
      { request: makeRequest(), env: makeEnv(db) },
      { ...dependencies, fetchImpl: mocked.fetchImpl },
    );
    const result = await responseJson(response);
    assert.equal(response.status, 503);
    assert.equal(result.error, "save_failed");
    assert.equal(result.analytics_event, undefined);
    assert.deepEqual(events, ["rate-limit", "turnstile", "persist"]);
  } finally {
    console.error = originalError;
  }
});

test("database uniqueness protection rejects a concurrent duplicate token", async () => {
  const events = [];
  const db = new FakeD1({ events, duplicateToken: true });
  const mocked = makeFetch({ events });
  const response = await handleInquiryPost(
    { request: makeRequest(), env: makeEnv(db) },
    { ...dependencies, fetchImpl: mocked.fetchImpl },
  );
  const result = await responseJson(response);
  assert.equal(response.status, 409);
  assert.equal(result.error, "duplicate_submission");
  assert.deepEqual(events, ["rate-limit", "turnstile", "persist"]);
});

test("email provider failure does not erase an already saved lead", async () => {
  const events = [];
  const db = new FakeD1({ events });
  const mocked = makeFetch({ events, resendFailure: true });
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await handleInquiryPost(
      { request: makeRequest(), env: makeEnv(db) },
      { ...dependencies, fetchImpl: mocked.fetchImpl },
    );
    const result = await responseJson(response);
    assert.equal(response.status, 201);
    assert.equal(result.lead_saved, true);
    assert.equal(result.notification_sent, false);
    assert.equal(result.analytics_event, "generate_lead");
    assert.deepEqual(events, ["rate-limit", "turnstile", "persist", "resend", "notification:failed"]);
  } finally {
    console.error = originalError;
  }
});

test("honeypot submission is silently accepted without creating a lead", async () => {
  const events = [];
  const db = new FakeD1({ events });
  const mocked = makeFetch({ events });
  const response = await handleInquiryPost(
    { request: makeRequest(makeBody({ website: "https://spam.example" })), env: makeEnv(db) },
    { ...dependencies, fetchImpl: mocked.fetchImpl },
  );
  const result = await responseJson(response);
  assert.equal(response.status, 202);
  assert.equal(result.lead_saved, false);
  assert.deepEqual(events, []);
});

test("persistent rate limit blocks excessive attempts before Turnstile", async () => {
  const events = [];
  const db = new FakeD1({ events, rateCount: 6 });
  const mocked = makeFetch({ events });
  const response = await handleInquiryPost(
    { request: makeRequest(), env: makeEnv(db) },
    { ...dependencies, fetchImpl: mocked.fetchImpl },
  );
  const result = await responseJson(response);
  assert.equal(response.status, 429);
  assert.equal(result.error, "rate_limited");
  assert.deepEqual(events, ["rate-limit"]);
});

test("email template escapes all customer-supplied HTML", () => {
  const html = renderInquiryEmail({
    inquiryId: "INQ-TEST",
    createdAt: "2026-08-05T08:00:00.000Z",
    name: '<img src=x onerror="alert(1)">',
    email: "buyer@example.com",
    company: "<script>alert(1)</script>",
    product: "<b>CGU-LC</b>",
    message: "<a href='bad'>click</a>",
    visitorCountry: "CO",
    landingPage: "/products/cgu-lc/",
    utmSource: "google",
    utmMedium: "organic",
    utmCampaign: "",
    pageLanguage: "en",
  });
  assert.doesNotMatch(html, /<script>|<img src=x|<b>CGU-LC<\/b>|<a href='bad'>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

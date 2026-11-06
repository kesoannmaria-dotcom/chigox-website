const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TURNSTILE_SITEVERIFY_ENDPOINT =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACTION = "inquiry";
const TURNSTILE_PREVIEW_TEST_MODE = "cloudflare-preview";
const TURNSTILE_PREVIEW_HOST_SUFFIX = ".chigox-website.pages.dev";
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";
const TURNSTILE_TEST_SITE_KEYS = new Set([
  TURNSTILE_TEST_SITE_KEY,
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF"
]);
const TURNSTILE_TEST_SECRET_KEYS = new Set([
  TURNSTILE_TEST_SECRET_KEY,
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA"
]);
const DEFAULT_PRODUCTION_HOSTNAMES = new Set(["chigox.com", "www.chigox.com"]);
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_NOTIFICATION_ATTEMPTS = 8;
const RETRY_DELAYS_MINUTES = [5, 15, 60, 180, 720, 1440, 2880, 4320];

const FIELD_LIMITS = Object.freeze({
  name: 160,
  email: 254,
  country: 120,
  company: 180,
  productCode: 180,
  message: 4000,
  language: 16,
  pageUrl: 2048,
  landingPage: 2048,
  utmSource: 200,
  utmMedium: 200,
  utmCampaign: 240,
  idempotencyKey: 128
});

const ERROR_MESSAGES = Object.freeze({
  CONFIG_UNAVAILABLE: "Inquiry service is temporarily unavailable. Please try again later.",
  VERIFICATION_REQUIRED: "Please complete the security verification.",
  VERIFICATION_FAILED: "Security verification failed. Please try again.",
  INVALID_REQUEST: "The inquiry could not be read. Please check the form and try again.",
  NAME_REQUIRED: "Name is required.",
  EMAIL_REQUIRED: "Email is required.",
  EMAIL_INVALID: "Please enter a valid email address.",
  MESSAGE_REQUIRED: "Message is required.",
  FIELD_TOO_LONG: "One or more fields are too long.",
  INVALID_LANGUAGE: "The selected language is invalid.",
  INVALID_PAGE_URL: "The page address is invalid.",
  INVALID_IDEMPOTENCY_KEY: "The request identifier is invalid.",
  IDEMPOTENCY_CONFLICT: "This request identifier was already used for different content.",
  STORAGE_UNAVAILABLE: "Your inquiry could not be saved. Please try again.",
  RATE_LIMITED: "Too many requests. Please wait and try again."
});

export const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff"
    }
  });

const cleanText = (value) =>
  String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim();

const compactText = (value) => cleanText(value).replace(/\s+/g, " ");

const escapeHtml = (value) =>
  cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const readEnv = (env, ...names) => {
  for (const name of names) {
    const value = env?.[name];
    if (value) return String(value).trim();
  }
  return "";
};

const getInquiryDatabase = (env) => env?.INQUIRY_DB || null;

const requireInquiryDatabase = (env) => {
  const database = getInquiryDatabase(env);
  if (!database) {
    throw new Error("D1 binding INQUIRY_DB is not configured");
  }
  return database;
};

const getTurnstileSecret = (env) =>
  readEnv(
    env,
    "TURNSTILE_SECRET_KEY",
    "TURNSTILE_SECRET",
    "CF_TURNSTILE_SECRET",
    "CF_TURNSTILE_SECRET_KEY",
    "CLOUDFLARE_TURNSTILE_SECRET",
    "CLOUDFLARE_TURNSTILE_SECRET_KEY"
  );

const getTurnstileSiteKey = (env) =>
  readEnv(
    env,
    "TURNSTILE_SITE_KEY",
    "TURNSTILE_SITEKEY",
    "CF_TURNSTILE_SITE_KEY",
    "CF_TURNSTILE_SITEKEY",
    "CLOUDFLARE_TURNSTILE_SITEKEY",
    "CLOUDFLARE_TURNSTILE_SITE_KEY"
  );

const readObjectValue = (source, ...names) => {
  for (const name of names) {
    if (source?.[name] != null) return cleanText(source[name]);
  }
  return "";
};

const readFormValue = (form, ...names) => {
  for (const name of names) {
    const value = form.get(name);
    if (value != null) return cleanText(value);
  }
  return "";
};

const parseFields = (read) => ({
  name: read("name", "Name"),
  email: read("email", "Email"),
  country: read("country", "Country"),
  company: read("company", "Company"),
  productCode: read("product_code", "productCode", "product", "Product"),
  message: read("message", "Message"),
  language: read("language", "lang"),
  pageUrl: read("page_url", "pageUrl", "submitted_page", "submittedPage"),
  landingPage: read("landing_page", "landingPage"),
  utmSource: read("utm_source", "utmSource"),
  utmMedium: read("utm_medium", "utmMedium"),
  utmCampaign: read("utm_campaign", "utmCampaign"),
  idempotencyKey: read("idempotency_key", "idempotencyKey"),
  turnstileToken: read(
    "cf-turnstile-response",
    "turnstileToken",
    "turnstile_token"
  )
});

export async function parseInquiry(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid JSON body");
    }
    return parseFields((...names) => readObjectValue(body, ...names));
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const form = await request.formData();
    return parseFields((...names) => readFormValue(form, ...names));
  }

  throw new Error("Unsupported content type");
}

const errorResult = (code, field = "") => ({
  ok: false,
  code,
  field,
  message: ERROR_MESSAGES[code] || ERROR_MESSAGES.INVALID_REQUEST
});

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value) &&
  !/[\r\n]/u.test(value);

const isValidLanguage = (value) =>
  !value || /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/u.test(value);

const isValidPageUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const sanitizePageUrl = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
};

export function validateInquiry(inquiry) {
  if (!inquiry.name) return errorResult("NAME_REQUIRED", "name");
  if (!inquiry.email) return errorResult("EMAIL_REQUIRED", "email");
  if (!isValidEmail(inquiry.email)) return errorResult("EMAIL_INVALID", "email");
  if (!inquiry.message) return errorResult("MESSAGE_REQUIRED", "message");

  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (cleanText(inquiry[field]).length > limit) {
      return errorResult("FIELD_TOO_LONG", field);
    }
  }

  if (!isValidLanguage(inquiry.language)) {
    return errorResult("INVALID_LANGUAGE", "language");
  }
  if (!isValidPageUrl(inquiry.pageUrl) || !isValidPageUrl(inquiry.landingPage)) {
    return errorResult("INVALID_PAGE_URL", "page_url");
  }
  if (
    inquiry.idempotencyKey &&
    !/^[A-Za-z0-9._:-]{8,128}$/u.test(inquiry.idempotencyKey)
  ) {
    return errorResult("INVALID_IDEMPOTENCY_KEY", "idempotency_key");
  }

  return { ok: true };
}

const normalizeFingerprint = (value) => compactText(value).toLowerCase();

function isEmergencyBlockedInquiry(inquiry) {
  return (
    normalizeFingerprint(inquiry.name) === "robertglild" &&
    normalizeFingerprint(inquiry.company) === "google"
  );
}

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return compactText(
    request.headers.get("cf-connecting-ip") ||
      forwardedFor.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown"
  ).slice(0, 120);
}

async function isRateLimited(request) {
  if (!globalThis.caches?.default) return false;
  const clientIp = getClientIp(request);
  if (!clientIp || clientIp === "unknown") return false;

  const now = Date.now();
  const cache = globalThis.caches.default;
  const cacheKey = new Request(
    `https://chigox.local/inquiry-rate/${encodeURIComponent(clientIp)}`
  );
  const cached = await cache.match(cacheKey);
  let record = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000 };

  if (cached) {
    try {
      const candidate = await cached.json();
      if (Number.isFinite(candidate.count) && Number.isFinite(candidate.resetAt)) {
        record = candidate;
      }
    } catch {
      // Ignore malformed cache entries and start a new window.
    }
  }

  if (record.resetAt <= now) {
    record = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000 };
  }
  record.count += 1;
  const ttl = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  await cache.put(
    cacheKey,
    new Response(JSON.stringify(record), {
      headers: { "cache-control": `max-age=${ttl}` }
    })
  );
  return record.count > RATE_LIMIT_MAX_REQUESTS;
}

const normalizeHostname = (hostname) =>
  String(hostname || "").trim().toLowerCase().replace(/\.$/u, "");

const configuredProductionHostnames = (env) => {
  const configured = readEnv(env, "TURNSTILE_ALLOWED_HOSTNAMES")
    .split(",")
    .map(normalizeHostname)
    .filter(Boolean);
  return configured.length ? new Set(configured) : DEFAULT_PRODUCTION_HOSTNAMES;
};

const resolveTurnstileConfiguration = (request, env) => {
  const secret = getTurnstileSecret(env);
  const siteKey = getTurnstileSiteKey(env);
  if (!secret || !siteKey) return null;

  const requestHostname = normalizeHostname(new URL(request.url).hostname);
  const testMode = readEnv(env, "TURNSTILE_TEST_MODE");
  const usesTestSiteKey = TURNSTILE_TEST_SITE_KEYS.has(siteKey);
  const usesTestSecret = TURNSTILE_TEST_SECRET_KEYS.has(secret);

  if (testMode) {
    if (
      testMode !== TURNSTILE_PREVIEW_TEST_MODE ||
      siteKey !== TURNSTILE_TEST_SITE_KEY ||
      secret !== TURNSTILE_TEST_SECRET_KEY ||
      !requestHostname.endsWith(TURNSTILE_PREVIEW_HOST_SUFFIX)
    ) {
      return null;
    }
    return { mode: "preview-test", requestHostname, secret, siteKey };
  }

  if (usesTestSiteKey || usesTestSecret) return null;
  if (!configuredProductionHostnames(env).has(requestHostname)) return null;
  return { mode: "production", requestHostname, secret, siteKey };
};

export async function verifyTurnstile(request, env, token, fetchImpl = fetch) {
  const config = resolveTurnstileConfiguration(request, env);
  if (!config) return errorResult("CONFIG_UNAVAILABLE");
  if (!token) return errorResult("VERIFICATION_REQUIRED", "turnstile");

  const body = new FormData();
  body.set("secret", config.secret);
  body.set("response", token);
  const clientIp = getClientIp(request);
  if (clientIp && clientIp !== "unknown") body.set("remoteip", clientIp);

  let response;
  try {
    response = await fetchImpl(TURNSTILE_SITEVERIFY_ENDPOINT, {
      method: "POST",
      body
    });
  } catch {
    return errorResult("VERIFICATION_FAILED", "turnstile");
  }
  if (!response.ok) return errorResult("VERIFICATION_FAILED", "turnstile");

  const result = await response.json();
  if (!result.success) {
    return errorResult("VERIFICATION_FAILED", "turnstile");
  }

  const verifiedHostname = normalizeHostname(result.hostname);
  if (config.mode === "preview-test") {
    if (
      verifiedHostname !== "example.com" ||
      (result.action != null && result.action !== "")
    ) {
      return errorResult("VERIFICATION_FAILED", "turnstile");
    }
    return { ok: true };
  }

  if (
    result.action !== TURNSTILE_ACTION ||
    verifiedHostname !== config.requestHostname
  ) {
    return errorResult("VERIFICATION_FAILED", "turnstile");
  }
  return { ok: true };
}

const sha256 = async (value) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(value))
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const stablePayload = (inquiry) =>
  JSON.stringify({
    name: inquiry.name,
    email: inquiry.email.toLowerCase(),
    country: inquiry.country,
    company: inquiry.company,
    productCode: inquiry.productCode,
    message: inquiry.message,
    language: inquiry.language,
    pageUrl: inquiry.pageUrl,
    landingPage: inquiry.landingPage,
    utmSource: inquiry.utmSource,
    utmMedium: inquiry.utmMedium,
    utmCampaign: inquiry.utmCampaign
  });

async function prepareInquiryIdentity(inquiry, request) {
  const payloadHash = await sha256(stablePayload(inquiry));
  if (inquiry.idempotencyKey) {
    return { idempotencyKey: inquiry.idempotencyKey, payloadHash };
  }

  const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
  const fallbackHash = await sha256(
    `${payloadHash}|${getClientIp(request)}|${bucket}`
  );
  return {
    idempotencyKey: `auto:${fallbackHash.slice(0, 64)}`,
    payloadHash
  };
}

const createInquiryId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `inquiry_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const rowToInquiry = (row) => ({
  inquiryId: row.inquiry_id,
  name: row.customer_name,
  email: row.email,
  country: row.country || "",
  company: row.company || "",
  productCode: row.product_code || "",
  message: row.message,
  language: row.language || "",
  pageUrl: row.page_url || "",
  landingPage: row.landing_page || "",
  utmSource: row.utm_source || "",
  utmMedium: row.utm_medium || "",
  utmCampaign: row.utm_campaign || "",
  notificationStatus: row.notification_status,
  notificationAttempts: Number(row.notification_attempts || 0)
});

export async function saveInquiry(env, inquiry, request) {
  const database = requireInquiryDatabase(env);
  const { idempotencyKey, payloadHash } = await prepareInquiryIdentity(
    inquiry,
    request
  );
  const inquiryId = createInquiryId();

  const result = await database.prepare(
    `INSERT INTO contact_inquiries (
      inquiry_id, idempotency_key, payload_hash, customer_name, email, country,
      company, product_code, message, language, page_url, landing_page,
      utm_source, utm_medium, utm_campaign
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(idempotency_key) DO NOTHING`
  )
    .bind(
      inquiryId,
      idempotencyKey,
      payloadHash,
      inquiry.name,
      inquiry.email.toLowerCase(),
      inquiry.country,
      inquiry.company,
      inquiry.productCode,
      inquiry.message,
      inquiry.language,
      inquiry.pageUrl,
      inquiry.landingPage,
      inquiry.utmSource,
      inquiry.utmMedium,
      inquiry.utmCampaign
    )
    .run();

  if (Number(result?.meta?.changes || 0) > 0) {
    return {
      created: true,
      inquiry: {
        ...inquiry,
        inquiryId,
        notificationStatus: "pending",
        notificationAttempts: 0
      }
    };
  }

  const existing = await database.prepare(
    `SELECT * FROM contact_inquiries WHERE idempotency_key = ? LIMIT 1`
  )
    .bind(idempotencyKey)
    .first();
  if (!existing) throw new Error("Idempotency lookup failed");
  if (existing.payload_hash !== payloadHash) {
    const conflict = new Error("Idempotency key conflict");
    conflict.code = "IDEMPOTENCY_CONFLICT";
    throw conflict;
  }
  return { created: false, inquiry: rowToInquiry(existing) };
}

function buildEmail(inquiry) {
  const subjectProduct = inquiry.productCode || "General inquiry";
  const subject = `CHIGOX website inquiry - ${subjectProduct}`;
  const html = `
    <h2>New CHIGOX Website Inquiry</h2>
    <table cellpadding="8" cellspacing="0" border="0">
      <tr><th align="left">Inquiry ID</th><td>${escapeHtml(inquiry.inquiryId)}</td></tr>
      <tr><th align="left">Name</th><td>${escapeHtml(inquiry.name)}</td></tr>
      <tr><th align="left">Email</th><td>${escapeHtml(inquiry.email)}</td></tr>
      <tr><th align="left">Country</th><td>${escapeHtml(inquiry.country || "—")}</td></tr>
      <tr><th align="left">Company</th><td>${escapeHtml(inquiry.company || "—")}</td></tr>
      <tr><th align="left">Product</th><td>${escapeHtml(inquiry.productCode || "—")}</td></tr>
      <tr><th align="left">Language</th><td>${escapeHtml(inquiry.language || "—")}</td></tr>
      <tr><th align="left">Page</th><td>${escapeHtml(inquiry.pageUrl || "—")}</td></tr>
    </table>
    <h3>Message</h3>
    <p>${escapeHtml(inquiry.message)}</p>
    <hr>
    <p><strong>Campaign:</strong> ${escapeHtml(inquiry.utmCampaign || "—")}</p>
  `;
  const text = [
    "New CHIGOX Website Inquiry",
    `Inquiry ID: ${inquiry.inquiryId}`,
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Country: ${inquiry.country || "—"}`,
    `Company: ${inquiry.company || "—"}`,
    `Product: ${inquiry.productCode || "—"}`,
    `Language: ${inquiry.language || "—"}`,
    `Page: ${inquiry.pageUrl || "—"}`,
    `Campaign: ${inquiry.utmCampaign || "—"}`,
    "",
    inquiry.message
  ].join("\n");
  return { subject, html, text };
}

const emailEnvironmentReady = (env) =>
  Boolean(
    env?.RESEND_API_KEY &&
      env?.INQUIRY_FROM_EMAIL &&
      env?.INQUIRY_NOTIFICATION_TO
  );

const nextRetryAt = (attempts) => {
  const delay =
    RETRY_DELAYS_MINUTES[
      Math.min(Math.max(attempts, 0), RETRY_DELAYS_MINUTES.length - 1)
    ];
  return new Date(Date.now() + delay * 60 * 1000).toISOString();
};

async function markNotificationPending(env, inquiryId, attempts, errorCode) {
  const database = requireInquiryDatabase(env);
  await database.prepare(
    `UPDATE contact_inquiries
     SET notification_status = 'notification_pending',
         notification_attempts = ?,
         notification_last_attempt_at = CURRENT_TIMESTAMP,
         notification_next_attempt_at = ?,
         notification_last_error = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE inquiry_id = ?`
  )
    .bind(attempts, nextRetryAt(attempts), errorCode, inquiryId)
    .run();
}

export async function notifyInquiry(env, inquiry, fetchImpl = fetch) {
  if (inquiry.notificationStatus === "sent") {
    return { status: "sent", skipped: true };
  }

  const database = requireInquiryDatabase(env);
  const claim = await database.prepare(
    `UPDATE contact_inquiries
     SET notification_status = 'sending', updated_at = CURRENT_TIMESTAMP
     WHERE inquiry_id = ?
       AND (
         notification_status IN ('pending', 'notification_pending')
         OR (
           notification_status = 'sending'
           AND updated_at <= datetime('now', '-15 minutes')
         )
       )`
  )
    .bind(inquiry.inquiryId)
    .run();
  if (Number(claim?.meta?.changes || 0) === 0) {
    return { status: inquiry.notificationStatus || "sending", skipped: true };
  }

  const attempts = Number(inquiry.notificationAttempts || 0) + 1;
  if (!emailEnvironmentReady(env)) {
    await markNotificationPending(
      env,
      inquiry.inquiryId,
      attempts,
      "EMAIL_NOT_CONFIGURED"
    );
    return { status: "notification_pending" };
  }

  try {
    const email = buildEmail(inquiry);
    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
        "idempotency-key": `chigox-inquiry-${inquiry.inquiryId}`
      },
      body: JSON.stringify({
        from: env.INQUIRY_FROM_EMAIL,
        to: [env.INQUIRY_NOTIFICATION_TO],
        reply_to: inquiry.email,
        subject: email.subject,
        html: email.html,
        text: email.text
      })
    });
    if (!response.ok) throw new Error(`RESEND_HTTP_${response.status}`);
    const result = await response.json().catch(() => ({}));
    await database.prepare(
      `UPDATE contact_inquiries
       SET notification_status = 'sent',
           notification_attempts = ?,
           notification_last_attempt_at = CURRENT_TIMESTAMP,
           notification_next_attempt_at = NULL,
           notification_sent_at = CURRENT_TIMESTAMP,
           notification_provider_id = ?,
           notification_last_error = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE inquiry_id = ?`
    )
      .bind(attempts, compactText(result.id || ""), inquiry.inquiryId)
      .run();
    return { status: "sent" };
  } catch (error) {
    await markNotificationPending(
      env,
      inquiry.inquiryId,
      attempts,
      compactText(error?.message || "EMAIL_SEND_FAILED").slice(0, 160)
    );
    return { status: "notification_pending" };
  }
}

export async function retryPendingNotifications(
  env,
  fetchImpl = fetch,
  limit = 25
) {
  const database = requireInquiryDatabase(env);
  const query = await database.prepare(
    `SELECT * FROM contact_inquiries
     WHERE (
         notification_status IN ('pending', 'notification_pending')
         OR (
           notification_status = 'sending'
           AND updated_at <= datetime('now', '-15 minutes')
         )
       )
       AND notification_attempts < ?
       AND (
         notification_next_attempt_at IS NULL
         OR notification_next_attempt_at <= CURRENT_TIMESTAMP
       )
     ORDER BY created_at ASC
     LIMIT ?`
  )
    .bind(MAX_NOTIFICATION_ATTEMPTS, Math.min(Math.max(limit, 1), 100))
    .all();

  let sent = 0;
  let pending = 0;
  for (const row of query?.results || []) {
    try {
      const result = await notifyInquiry(env, rowToInquiry(row), fetchImpl);
      if (result.status === "sent") sent += 1;
      else if (result.status === "notification_pending") pending += 1;
    } catch (error) {
      pending += 1;
      console.error("[inquiry-notification-retry-item-failed]", {
        inquiryId: row.inquiry_id,
        error: compactText(error?.message || "unknown").slice(0, 160)
      });
    }
  }
  return { checked: (query?.results || []).length, sent, pending };
}

const serviceConfiguration = (request, env) => {
  const turnstile = request
    ? resolveTurnstileConfiguration(request, env)
    : null;
  return {
    ready: Boolean(getInquiryDatabase(env) && turnstile),
    siteKey: turnstile?.siteKey || ""
  };
};

export async function onRequestGet({ request, env } = {}) {
  const config = serviceConfiguration(request, env);
  if (!config.ready) {
    return jsonResponse(errorResult("CONFIG_UNAVAILABLE"), 503);
  }
  return jsonResponse({
    ok: true,
    service: "CHIGOX inquiry endpoint",
    turnstileSiteKey: config.siteKey,
    turnstileAction: TURNSTILE_ACTION
  });
}

export async function onRequestPost({ request, env }) {
  const config = serviceConfiguration(request, env);
  if (!config.ready) {
    return jsonResponse(errorResult("CONFIG_UNAVAILABLE"), 503);
  }

  let inquiry;
  try {
    inquiry = await parseInquiry(request);
  } catch {
    return jsonResponse(errorResult("INVALID_REQUEST"), 400);
  }
  inquiry.country = inquiry.country || compactText(request.cf?.country).slice(0, 120);
  inquiry.pageUrl = sanitizePageUrl(inquiry.pageUrl);
  inquiry.landingPage = sanitizePageUrl(inquiry.landingPage);

  if (isEmergencyBlockedInquiry(inquiry)) {
    console.warn("[spam-blocked] emergency inquiry fingerprint suppressed");
    return jsonResponse({ ok: true, message: "Inquiry received." });
  }
  if (await isRateLimited(request)) {
    console.warn("[rate-limited] inquiry suppressed");
    return jsonResponse(errorResult("RATE_LIMITED"), 429);
  }

  const verification = await verifyTurnstile(
    request,
    env,
    inquiry.turnstileToken
  );
  if (!verification.ok) {
    return jsonResponse(
      verification,
      verification.code === "CONFIG_UNAVAILABLE" ? 503 : 400
    );
  }

  const validation = validateInquiry(inquiry);
  if (!validation.ok) return jsonResponse(validation, 400);

  let storage;
  try {
    storage = await saveInquiry(env, inquiry, request);
  } catch (error) {
    if (error?.code === "IDEMPOTENCY_CONFLICT") {
      return jsonResponse(errorResult("IDEMPOTENCY_CONFLICT"), 409);
    }
    console.error("[inquiry-storage-failed]", {
      error: compactText(error?.message || "unknown").slice(0, 160)
    });
    return jsonResponse(errorResult("STORAGE_UNAVAILABLE"), 503);
  }

  let notification = { status: storage.inquiry.notificationStatus || "pending" };
  try {
    notification = await notifyInquiry(env, storage.inquiry);
  } catch (error) {
    console.error("[inquiry-notification-failed-after-save]", {
      inquiryId: storage.inquiry.inquiryId,
      error: compactText(error?.message || "unknown").slice(0, 160)
    });
    notification = { status: "notification_pending" };
  }
  return jsonResponse({
    ok: true,
    inquiryId: storage.inquiry.inquiryId,
    duplicate: !storage.created,
    notificationStatus: notification.status,
    message: "Inquiry received."
  });
}

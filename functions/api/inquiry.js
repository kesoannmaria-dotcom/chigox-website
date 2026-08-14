const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_EMAIL_URL = "https://api.resend.com/emails";
const TURNSTILE_ACTION = "inquiry_form";
const INQUIRY_FROM = "CHIGOX Website <inquiries@send.chigox.com>";
const INQUIRY_TO = "sales@chigox.com";
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MAX_BODY_BYTES = 32_768;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

const FIELD_LIMITS = {
  name: 120,
  email: 254,
  company: 160,
  product: 220,
  message: 3000,
  pagePath: 500,
  language: 20,
  attribution: 160,
  referrer: 600,
  token: 2048,
  submissionId: 80,
};

function json(data, status = 200, statusText) {
  return new Response(JSON.stringify(data), { status, statusText, headers: JSON_HEADERS });
}

function cleanText(value, maxLength, { required = false, minLength = 0 } = {}) {
  if (typeof value !== "string") {
    if (required) throw new ValidationError("required");
    return "";
  }
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (required && cleaned.length < Math.max(1, minLength)) throw new ValidationError("required");
  if (cleaned.length > maxLength) throw new ValidationError("too_long");
  return cleaned;
}

function cleanEmail(value) {
  const email = cleanText(value, FIELD_LIMITS.email, { required: true });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) throw new ValidationError("invalid_email");
  return email;
}

function cleanSubmissionId(value) {
  const id = cleanText(value, FIELD_LIMITS.submissionId, { required: true });
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) throw new ValidationError("invalid_submission_id");
  return id;
}

function cleanLanguage(value) {
  const language = cleanText(value || "en", FIELD_LIMITS.language) || "en";
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z]{2,8})?$/.test(language)) return "und";
  return language;
}

function safePath(value, baseUrl) {
  const raw = cleanText(value || "/", FIELD_LIMITS.pagePath) || "/";
  try {
    const parsed = new URL(raw, baseUrl);
    return parsed.pathname.startsWith("/") ? parsed.pathname : "/";
  } catch {
    return "/";
  }
}

function safeReferrer(value) {
  const raw = cleanText(value || "", FIELD_LIMITS.referrer);
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (!/^https?:$/.test(parsed.protocol)) return "";
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return "";
  }
}

function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function requiredEnvironment(env) {
  return Boolean(
    env?.INQUIRY_DB &&
    env?.TURNSTILE_SITE_KEY &&
    env?.TURNSTILE_SECRET_KEY &&
    env?.TURNSTILE_ALLOWED_HOSTNAMES &&
    env?.RATE_LIMIT_SECRET,
  );
}

class ValidationError extends Error {
  constructor(code) {
    super(code);
    this.name = "ValidationError";
    this.code = code;
  }
}

class PayloadTooLargeError extends Error {
  constructor() {
    super("payload_too_large");
    this.name = "PayloadTooLargeError";
  }
}

class InvalidJsonError extends Error {
  constructor() {
    super("invalid_json");
    this.name = "InvalidJsonError";
  }
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new PayloadTooLargeError();
  }
  if (!request.body) throw new InvalidJsonError();

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The size limit has already been enforced.
        }
        throw new PayloadTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes));
  } catch {
    throw new InvalidJsonError();
  }
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function display(value, fallback = "Not provided") {
  return value ? escapeHtml(value) : fallback;
}

function displaySubmittedAt(value) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return value;
  const chinaTime = new Date(timestamp.getTime() + 8 * 60 * 60 * 1000).toISOString();
  return `${chinaTime.slice(0, 10)} ${chinaTime.slice(11, 16)} UTC+08:00`;
}

function messageHtml(message) {
  return escapeHtml(message).replaceAll("\n", "<br>");
}

function fieldRow(label, value, options = {}) {
  const rendered = options.html ? value : display(value, options.fallback);
  return `<tr>
    <td class="field-label" width="150" style="width:150px;padding:12px 16px;background:#fbfdfe;color:#5d6d7c;font-size:13px;font-weight:700;border-bottom:1px solid #e7eef3;vertical-align:top;">${escapeHtml(label)}</td>
    <td class="field-value" style="padding:12px 16px;color:#172535;font-size:14px;border-bottom:1px solid #e7eef3;vertical-align:top;word-break:break-word;">${rendered}</td>
  </tr>`;
}

export function renderInquiryEmail(inquiry) {
  const productTitle = inquiry.product || "Website";
  const sourceMedium = [inquiry.utmSource, inquiry.utmMedium].filter(Boolean).join(" / ") || "Not captured";
  const replyHref = `mailto:${escapeHtml(inquiry.email)}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New CHIGOX inquiry</title>
  <style>
    @media only screen and (max-width:620px) {
      .email-shell{width:100%!important}
      .email-pad{padding:22px 16px!important}
      .field-label,.field-value{display:block!important;width:auto!important}
      .field-label{padding-bottom:4px!important;border-bottom:0!important}
      .field-value{padding-top:0!important}
      .header-cell{padding:22px 18px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef3f7;color:#172535;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">New CHIGOX product inquiry received and saved successfully.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#eef3f7;">
    <tr><td align="center" style="padding:32px 12px;">
      <table class="email-shell" role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:640px;max-width:640px;background:#fff;border:1px solid #d9e5ed;border-radius:12px;overflow:hidden;">
        <tr><td class="header-cell" style="padding:26px 30px;background:#123b63;color:#fff;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td style="font-size:25px;line-height:1;font-weight:800;">CHIGOX</td>
            <td align="right" style="font-size:12px;line-height:1.4;color:#cfe3f0;">WEBSITE INQUIRY</td>
          </tr></table>
        </td></tr>
        <tr><td class="email-pad" style="padding:30px;">
          <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#0f6fb8;font-weight:700;text-transform:uppercase;letter-spacing:.6px;">New inquiry received</p>
          <h1 style="margin:0 0 10px;font-size:24px;line-height:1.3;color:#172535;">${escapeHtml(productTitle)} inquiry</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5d6d7c;">The inquiry passed server validation and was saved before this notification was generated.</p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #d9e5ed;border-radius:8px;overflow:hidden;">
            <tr><td colspan="2" style="padding:12px 16px;background:#f3f8fb;color:#123b63;font-size:14px;font-weight:800;border-bottom:1px solid #d9e5ed;">Customer information</td></tr>
            ${fieldRow("Name", inquiry.name)}
            ${fieldRow("Email", `<a href="${replyHref}" style="color:#0f6fb8;text-decoration:underline;">${escapeHtml(inquiry.email)}</a>`, { html: true })}
            ${fieldRow("Company / Type", inquiry.company)}
            ${fieldRow("Product", inquiry.product)}
            ${fieldRow("Country", inquiry.visitorCountry, { fallback: "Not captured" })}
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:18px;border-collapse:separate;border-spacing:0;border:1px solid #d9e5ed;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:12px 16px;background:#f3f8fb;color:#123b63;font-size:14px;font-weight:800;border-bottom:1px solid #d9e5ed;">Message</td></tr>
            <tr><td style="padding:16px;color:#172535;font-size:14px;line-height:1.7;word-break:break-word;">${messageHtml(inquiry.message)}</td></tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:18px;border-collapse:separate;border-spacing:0;border:1px solid #d9e5ed;border-radius:8px;overflow:hidden;">
            <tr><td colspan="2" style="padding:12px 16px;background:#f3f8fb;color:#123b63;font-size:14px;font-weight:800;border-bottom:1px solid #d9e5ed;">Inquiry and source</td></tr>
            ${fieldRow("Inquiry ID", inquiry.inquiryId)}
            ${fieldRow("Submitted", displaySubmittedAt(inquiry.createdAt))}
            ${fieldRow("Landing page", inquiry.landingPage, { fallback: "Not captured" })}
            ${fieldRow("Source / Medium", sourceMedium)}
            ${fieldRow("Campaign", inquiry.utmCampaign, { fallback: "Not captured" })}
            ${fieldRow("Page language", inquiry.pageLanguage)}
          </table>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;"><tr>
            <td style="background:#0f6fb8;border-radius:6px;"><a href="${replyHref}" style="display:inline-block;padding:12px 18px;color:#fff;font-size:14px;font-weight:800;text-decoration:none;">Reply to customer</a></td>
          </tr></table>

          <p style="margin:24px 0 0;padding-top:18px;border-top:1px solid #e7eef3;color:#7a8792;font-size:12px;line-height:1.6;">From ${escapeHtml(INQUIRY_FROM)} · To ${escapeHtml(INQUIRY_TO)} · Customer email is used only as Reply-To.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function renderInquiryText(inquiry) {
  const sourceMedium = [inquiry.utmSource, inquiry.utmMedium].filter(Boolean).join(" / ") || "Not captured";
  return [
    "NEW CHIGOX WEBSITE INQUIRY",
    "",
    `Inquiry ID: ${inquiry.inquiryId}`,
    `Submitted: ${inquiry.createdAt}`,
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Company / Type: ${inquiry.company || "Not provided"}`,
    `Product: ${inquiry.product || "Not provided"}`,
    `Country: ${inquiry.visitorCountry || "Not captured"}`,
    `Landing page: ${inquiry.landingPage || "Not captured"}`,
    `Source / Medium: ${sourceMedium}`,
    `Campaign: ${inquiry.utmCampaign || "Not captured"}`,
    `Page language: ${inquiry.pageLanguage}`,
    "",
    "Message:",
    inquiry.message,
  ].join("\n");
}

function validateBody(body, requestUrl) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ValidationError("invalid_body");

  const honeypot = cleanText(body.website || "", 200);
  if (honeypot) return { honeypot: true };

  return {
    honeypot: false,
    submissionId: cleanSubmissionId(body.submission_id),
    name: cleanText(body.name, FIELD_LIMITS.name, { required: true, minLength: 2 }),
    email: cleanEmail(body.email),
    company: cleanText(body.company || "", FIELD_LIMITS.company),
    product: cleanText(body.product || "", FIELD_LIMITS.product),
    message: cleanText(body.message, FIELD_LIMITS.message, { required: true, minLength: 10 }),
    turnstileToken: cleanText(body.turnstile_token, FIELD_LIMITS.token, { required: true }),
    pagePath: safePath(body.page_path, requestUrl),
    pageLanguage: cleanLanguage(body.page_language),
    landingPage: safePath(body.landing_page || body.page_path, requestUrl),
    referrer: safeReferrer(body.referrer),
    utmSource: cleanText(body.utm_source || "", FIELD_LIMITS.attribution),
    utmMedium: cleanText(body.utm_medium || "", FIELD_LIMITS.attribution),
    utmCampaign: cleanText(body.utm_campaign || "", FIELD_LIMITS.attribution),
  };
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function rateLimitWindow(now) {
  const start = Math.floor(now.getTime() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  return new Date(start).toISOString();
}

async function enforceRateLimit(env, request, now) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const clientHash = await sha256(`${env.RATE_LIMIT_SECRET}:${ip}`);
  const windowStartedAt = rateLimitWindow(now);
  const updatedAt = now.toISOString();
  const result = await env.INQUIRY_DB.prepare(`
    INSERT INTO inquiry_rate_limits (client_hash, window_started_at, submission_count, updated_at)
    VALUES (?1, ?2, 1, ?3)
    ON CONFLICT(client_hash, window_started_at)
    DO UPDATE SET submission_count = submission_count + 1, updated_at = excluded.updated_at
    RETURNING submission_count
  `).bind(clientHash, windowStartedAt, updatedAt).first();

  if (!result || Number(result.submission_count) > RATE_LIMIT_MAX) throw new ValidationError("rate_limited");
}

async function verifyTurnstile(env, request, token, fetchImpl) {
  const remoteIp = request.headers.get("cf-connecting-ip") || undefined;
  const payload = {
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
    idempotency_key: crypto.randomUUID(),
  };
  if (remoteIp) payload.remoteip = remoteIp;

  const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("turnstile_unavailable");

  const result = await response.json();
  if (!result.success) {
    const duplicate = Array.isArray(result["error-codes"]) && result["error-codes"].includes("timeout-or-duplicate");
    throw new ValidationError(duplicate ? "turnstile_duplicate" : "turnstile_failed");
  }

  const allowedHostnames = String(env.TURNSTILE_ALLOWED_HOSTNAMES)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const verifiedHostname = String(result.hostname || "").toLowerCase();
  const requestHostname = new URL(request.url).hostname.toLowerCase();
  if (!allowedHostnames.includes(verifiedHostname) || verifiedHostname !== requestHostname) {
    throw new ValidationError("turnstile_hostname_mismatch");
  }
  if (result.action !== TURNSTILE_ACTION) throw new ValidationError("turnstile_action_mismatch");

  return { hostname: verifiedHostname, action: result.action };
}

function makeInquiryId(now, uuid) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `INQ-${date}-${uuid.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

async function persistInquiry(env, inquiry, tokenHash) {
  const insertInquiry = env.INQUIRY_DB.prepare(`
    INSERT INTO inquiries (
      inquiry_id, submission_id, created_at, name, email, company, product, message,
      page_path, page_language, landing_page, referrer, utm_source, utm_medium,
      utm_campaign, visitor_country, turnstile_hostname, turnstile_action,
      notification_status
    ) VALUES (
      ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, 'pending'
    )
  `).bind(
    inquiry.inquiryId,
    inquiry.submissionId,
    inquiry.createdAt,
    inquiry.name,
    inquiry.email,
    inquiry.company,
    inquiry.product,
    inquiry.message,
    inquiry.pagePath,
    inquiry.pageLanguage,
    inquiry.landingPage,
    inquiry.referrer,
    inquiry.utmSource,
    inquiry.utmMedium,
    inquiry.utmCampaign,
    inquiry.visitorCountry,
    inquiry.turnstileHostname,
    inquiry.turnstileAction,
  );

  const markTokenUsed = env.INQUIRY_DB.prepare(`
    INSERT INTO used_turnstile_tokens (token_hash, inquiry_id, used_at)
    VALUES (?1, ?2, ?3)
  `).bind(tokenHash, inquiry.inquiryId, inquiry.createdAt);

  await env.INQUIRY_DB.batch([insertInquiry, markTokenUsed]);
}

async function updateNotification(env, inquiryId, status, providerId, now) {
  await env.INQUIRY_DB.prepare(`
    UPDATE inquiries
    SET notification_status = ?1, notification_provider_id = ?2, notification_updated_at = ?3
    WHERE inquiry_id = ?4
  `).bind(status, providerId || null, now.toISOString(), inquiryId).run();
}

async function sendNotification(env, inquiry, fetchImpl) {
  const payload = {
    from: INQUIRY_FROM,
    to: [INQUIRY_TO],
    reply_to: inquiry.email,
    subject: `New CHIGOX inquiry · ${inquiry.product || "Website"} · ${inquiry.inquiryId}`,
    html: renderInquiryEmail(inquiry),
    text: renderInquiryText(inquiry),
  };

  const response = await fetchImpl(RESEND_EMAIL_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": `chigox-${inquiry.inquiryId}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("notification_failed");
  const result = await response.json();
  return { providerId: typeof result.id === "string" ? result.id : null };
}

function isDuplicateStorageError(error) {
  return /used_turnstile_tokens|submission_id|unique constraint/i.test(String(error?.message || error));
}

export async function handleInquiryPost(context, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl || fetch;
  const now = dependencies.now ? new Date(dependencies.now) : new Date();
  const uuid = dependencies.uuid || crypto.randomUUID();
  const { request, env } = context;

  if (!requiredEnvironment(env)) return json({ ok: false, error: "service_not_configured" }, 503);
  if (!isSameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ ok: false, error: "unsupported_content_type" }, 415);
  }
  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return json({ ok: false, error: "payload_too_large" }, 413, "Payload Too Large");
    }
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  let input;
  try {
    input = validateBody(body, request.url);
    if (input.honeypot) return json({ ok: true, accepted: true, lead_saved: false }, 202);
    await enforceRateLimit(env, request, now);
  } catch (error) {
    if (error instanceof ValidationError) {
      const status = error.code === "rate_limited" ? 429 : 422;
      return json({ ok: false, error: error.code }, status);
    }
    console.error("Inquiry preflight failed", error);
    return json({ ok: false, error: "service_unavailable" }, 503);
  }

  let turnstile;
  try {
    turnstile = await verifyTurnstile(env, request, input.turnstileToken, fetchImpl);
  } catch (error) {
    if (error instanceof ValidationError) return json({ ok: false, error: error.code }, 422);
    console.error("Turnstile verification unavailable", error);
    return json({ ok: false, error: "challenge_unavailable" }, 503);
  }

  const inquiry = {
    inquiryId: makeInquiryId(now, uuid),
    submissionId: input.submissionId,
    createdAt: now.toISOString(),
    name: input.name,
    email: input.email,
    company: input.company,
    product: input.product,
    message: input.message,
    pagePath: input.pagePath,
    pageLanguage: input.pageLanguage,
    landingPage: input.landingPage,
    referrer: input.referrer,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    visitorCountry: /^[A-Z]{2}$/.test(String(request.cf?.country || "")) ? request.cf.country : "",
    turnstileHostname: turnstile.hostname,
    turnstileAction: turnstile.action,
  };

  try {
    const tokenHash = await sha256(input.turnstileToken);
    await persistInquiry(env, inquiry, tokenHash);
  } catch (error) {
    if (isDuplicateStorageError(error)) return json({ ok: false, error: "duplicate_submission" }, 409);
    console.error("Inquiry persistence failed", error);
    return json({ ok: false, error: "save_failed" }, 503);
  }

  let notificationSent = false;
  let notificationProviderId = null;
  if (env.RESEND_API_KEY) {
    try {
      const notification = await sendNotification(env, inquiry, fetchImpl);
      notificationSent = true;
      notificationProviderId = notification.providerId;
    } catch {
      console.error("Inquiry notification failed", { inquiryId: inquiry.inquiryId });
    }

    try {
      await updateNotification(
        env,
        inquiry.inquiryId,
        notificationSent ? "sent" : "failed",
        notificationProviderId,
        now,
      );
    } catch {
      console.error("Inquiry notification status update failed", { inquiryId: inquiry.inquiryId });
    }
  }

  return json({
    ok: true,
    lead_saved: true,
    lead_id: inquiry.inquiryId,
    notification_sent: notificationSent,
    analytics_event: "generate_lead",
    page_path: inquiry.pagePath,
    page_language: inquiry.pageLanguage,
  }, 201);
}

export function onRequestGet(context) {
  if (!context.env?.TURNSTILE_SITE_KEY) return json({ enabled: false }, 503);
  return json({ enabled: true, site_key: context.env.TURNSTILE_SITE_KEY, action: TURNSTILE_ACTION });
}

export const onRequestPost = (context) => handleInquiryPost(context);

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "allow": "GET, POST, OPTIONS",
      "cache-control": "no-store",
    },
  });
}

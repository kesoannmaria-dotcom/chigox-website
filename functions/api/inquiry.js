const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TURNSTILE_SITEVERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT_MAX_REQUESTS = 5;
const GENERIC_VERIFICATION_ERROR = "Inquiry could not be verified. Please try again.";

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });

const cleanText = (value, maxLength = 2000) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const escapeHtml = (value) =>
  cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getField = (form, ...names) => {
  for (const name of names) {
    const value = form.get(name);
    if (value != null) return cleanText(value);
  }
  return "";
};

const readEnv = (env, ...names) => {
  for (const name of names) {
    const value = env?.[name];
    if (value) return String(value);
  }
  return "";
};

const getTurnstileSecret = (env) =>
  readEnv(
    env,
    "TURNSTILE_SECRET_KEY",
    "TURNSTILE_SECRET",
    "CF_TURNSTILE_SECRET",
    "CLOUDFLARE_TURNSTILE_SECRET_KEY"
  );

const getTurnstileSiteKey = (env) =>
  readEnv(
    env,
    "TURNSTILE_SITE_KEY",
    "TURNSTILE_SITEKEY",
    "CF_TURNSTILE_SITE_KEY",
    "CLOUDFLARE_TURNSTILE_SITE_KEY"
  );

async function parseInquiry(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      name: cleanText(body.name || body.Name, 160),
      email: cleanText(body.email || body.Email, 254),
      company: cleanText(body.company || body.Company, 180),
      product: cleanText(body.product || body.Product, 180),
      message: cleanText(body.message || body.Message, 4000),
      turnstileToken: cleanText(
        body["cf-turnstile-response"] || body.turnstileToken || body.turnstile_token,
        4096
      )
    };
  }

  const form = await request.formData();
  return {
    name: getField(form, "name", "Name"),
    email: getField(form, "email", "Email"),
    company: getField(form, "company", "Company"),
    product: getField(form, "product", "Product"),
    message: getField(form, "message", "Message"),
    turnstileToken: getField(form, "cf-turnstile-response", "turnstileToken", "turnstile_token")
  };
}

function validateEnvironment(env) {
  if (!env.RESEND_API_KEY || !env.INQUIRY_FROM_EMAIL || !env.INQUIRY_NOTIFICATION_TO) {
    return "Inquiry email service is not configured.";
  }
  return "";
}

function validateInquiry(inquiry) {
  if (!inquiry.name) return "Name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) return "A valid email is required.";
  if (!inquiry.message) return "Message is required.";
  return "";
}

const normalizeFingerprint = (value) => cleanText(value, 200).toLowerCase();

function isEmergencyBlockedInquiry(inquiry) {
  return (
    normalizeFingerprint(inquiry.name) === "robertglild" &&
    normalizeFingerprint(inquiry.company) === "google"
  );
}

function successResponse() {
  return jsonResponse({ ok: true, message: "Inquiry sent." });
}

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return cleanText(
    request.headers.get("cf-connecting-ip") ||
      forwardedFor.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown",
    120
  );
}

function isTrustedSiteRequest(request) {
  const allowedHosts = new Set(["chigox.com", "www.chigox.com"]);
  const headers = [request.headers.get("origin"), request.headers.get("referer")].filter(Boolean);

  return headers.some((value) => {
    try {
      return allowedHosts.has(new URL(value).hostname);
    } catch {
      return false;
    }
  });
}

async function isRateLimited(request) {
  if (!globalThis.caches?.default) {
    console.warn("[rate-limit-unavailable] Cloudflare Cache API is not available.");
    return false;
  }

  const clientIp = getClientIp(request);
  if (!clientIp || clientIp === "unknown") return false;

  const now = Date.now();
  const cache = globalThis.caches.default;
  const cacheKey = new Request(`https://chigox.local/inquiry-rate/${encodeURIComponent(clientIp)}`);
  const cached = await cache.match(cacheKey);
  let record = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000 };

  if (cached) {
    try {
      const cachedRecord = await cached.json();
      if (Number.isFinite(cachedRecord.count) && Number.isFinite(cachedRecord.resetAt)) {
        record = cachedRecord;
      }
    } catch {
      record = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000 };
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
      headers: {
        "cache-control": `max-age=${ttl}`,
        "content-type": "application/json; charset=utf-8"
      }
    })
  );

  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    console.warn("[rate-limited] inquiry suppressed", {
      clientIp,
      count: record.count,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS
    });
    return true;
  }

  return false;
}

async function verifyTurnstile(request, env, token) {
  const secret = getTurnstileSecret(env);
  if (!secret) {
    if (!isTrustedSiteRequest(request)) {
      console.warn("[turnstile-missing-secret] untrusted inquiry suppressed");
      return false;
    }

    console.warn("[turnstile-missing-secret] trusted inquiry allowed without Turnstile verification.");
    return true;
  }

  if (!token) {
    console.warn("[turnstile-failed] missing token");
    return false;
  }

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);

  const clientIp = getClientIp(request);
  if (clientIp && clientIp !== "unknown") {
    body.set("remoteip", clientIp);
  }

  const response = await fetch(TURNSTILE_SITEVERIFY_ENDPOINT, {
    method: "POST",
    body
  });

  if (!response.ok) {
    console.warn("[turnstile-failed] siteverify request failed", { status: response.status });
    return false;
  }

  const result = await response.json();
  if (!result.success) {
    console.warn("[turnstile-failed] siteverify rejected token", {
      errors: result["error-codes"] || []
    });
    return false;
  }

  return true;
}

function buildEmail(inquiry) {
  const submittedAt = new Date().toISOString();
  const subjectProduct = inquiry.product || "General inquiry";
  const subject = `CHIGOX website inquiry - ${subjectProduct}`;
  const html = `
    <h2>New CHIGOX Website Inquiry</h2>
    <table cellpadding="8" cellspacing="0" border="0">
      <tr><th align="left">Name</th><td>${escapeHtml(inquiry.name)}</td></tr>
      <tr><th align="left">Email</th><td>${escapeHtml(inquiry.email)}</td></tr>
      <tr><th align="left">Company</th><td>${escapeHtml(inquiry.company || "—")}</td></tr>
      <tr><th align="left">Product</th><td>${escapeHtml(inquiry.product || "—")}</td></tr>
      <tr><th align="left">Submitted at</th><td>${escapeHtml(submittedAt)}</td></tr>
    </table>
    <h3>Message</h3>
    <p>${escapeHtml(inquiry.message)}</p>
  `;
  const text = [
    "New CHIGOX Website Inquiry",
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Company: ${inquiry.company || "—"}`,
    `Product: ${inquiry.product || "—"}`,
    `Submitted at: ${submittedAt}`,
    "",
    inquiry.message
  ].join("\n");

  return { subject, html, text };
}

async function sendInquiryEmail(env, inquiry) {
  const email = buildEmail(inquiry);
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
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

  if (!response.ok) {
    throw new Error(`Resend request failed with status ${response.status}`);
  }
}

export async function onRequestGet({ env } = {}) {
  return jsonResponse({
    ok: true,
    service: "CHIGOX inquiry endpoint",
    turnstileSiteKey: getTurnstileSiteKey(env)
  });
}

export async function onRequestPost({ request, env }) {
  const envError = validateEnvironment(env);
  if (envError) return jsonResponse({ ok: false, error: envError }, 500);

  try {
    const inquiry = await parseInquiry(request);
    if (isEmergencyBlockedInquiry(inquiry)) {
      console.warn("[spam-blocked] inquiry fingerprint suppressed", {
        name: inquiry.name,
        company: inquiry.company
      });
      return successResponse();
    }

    if (await isRateLimited(request)) {
      return successResponse();
    }

    if (!(await verifyTurnstile(request, env, inquiry.turnstileToken))) {
      return jsonResponse({ ok: false, error: GENERIC_VERIFICATION_ERROR }, 400);
    }

    const inputError = validateInquiry(inquiry);
    if (inputError) return jsonResponse({ ok: false, error: inputError }, 400);

    await sendInquiryEmail(env, inquiry);
    return successResponse();
  } catch (error) {
    console.error("Inquiry submission failed", error);
    return jsonResponse({ ok: false, error: "Inquiry could not be sent." }, 500);
  }
}

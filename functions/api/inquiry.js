const MAX_BODY_BYTES = 16 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimits = new Map();

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=UTF-8", "cache-control": "no-store" },
});

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const readJson = async (request) => {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new RangeError("payload_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("invalid_json");
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BODY_BYTES) throw new RangeError("payload_too_large");
    chunks.push(value);
  }
  try {
    return JSON.parse(new TextDecoder().decode(await new Blob(chunks).arrayBuffer()));
  } catch {
    throw new SyntaxError("invalid_json");
  }
};

const cleanText = (value, maxLength) => typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const sameOrigin = (request) => {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
};

const allowRequest = (request) => {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const record = rateLimits.get(ip);
  if (!record || now - record.startedAt > WINDOW_MS) {
    rateLimits.set(ip, { startedAt: now, count: 1 });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) return false;
  record.count += 1;
  return true;
};

const emailHtml = ({ name, email, company, product, message, submittedAt, page }) => `
  <h2>New CHIGOX website inquiry</h2>
  <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;border-color:#d8e3ec">
    <tr><th align="left">Submitted time</th><td>${escapeHtml(submittedAt)}</td></tr>
    <tr><th align="left">Name</th><td>${escapeHtml(name)}</td></tr>
    <tr><th align="left">Email</th><td>${escapeHtml(email)}</td></tr>
    <tr><th align="left">Company</th><td>${escapeHtml(company || "—")}</td></tr>
    <tr><th align="left">Product</th><td>${escapeHtml(product || "—")}</td></tr>
    <tr><th align="left">Message</th><td>${escapeHtml(message).replaceAll("\n", "<br>")}</td></tr>
    <tr><th align="left">Submit page</th><td>${escapeHtml(page)}</td></tr>
  </table>`;

export const onRequestPost = async (context) => {
  const { request, env } = context;
  if (!sameOrigin(request)) return json({ ok: false, error: "invalid_origin" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ ok: false, error: "invalid_request" }, 415);
  }
  if (!allowRequest(request)) return json({ ok: false, error: "rate_limited" }, 429);

  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    return json({ ok: false, error: error instanceof RangeError ? "payload_too_large" : "invalid_request" }, error instanceof RangeError ? 413 : 400);
  }

  if (cleanText(payload.website, 200)) return json({ ok: true }, 200);

  const inquiry = {
    name: cleanText(payload.name, 120),
    email: cleanText(payload.email, 254),
    company: cleanText(payload.company, 160),
    product: cleanText(payload.product, 160),
    message: cleanText(payload.message, 4000),
  };
  if (!inquiry.name || !inquiry.message || !isEmail(inquiry.email)) {
    return json({ ok: false, error: "invalid_request" }, 400);
  }
  if (!env.RESEND_API_KEY || !env.INQUIRY_FROM_EMAIL || !env.INQUIRY_NOTIFICATION_TO) {
    return json({ ok: false, error: "service_unavailable" }, 503);
  }

  const submittedAt = new Date().toISOString();
  const page = new URL(request.url).pathname;
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.INQUIRY_FROM_EMAIL,
      to: [env.INQUIRY_NOTIFICATION_TO],
      reply_to: inquiry.email,
      subject: `CHIGOX website inquiry${inquiry.product ? ` — ${inquiry.product}` : ""}`,
      html: emailHtml({ ...inquiry, submittedAt, page }),
      text: [
        "New CHIGOX website inquiry",
        `Submitted time: ${submittedAt}`,
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Company: ${inquiry.company || "—"}`,
        `Product: ${inquiry.product || "—"}`,
        `Message: ${inquiry.message}`,
        `Submit page: ${page}`,
      ].join("\n"),
    }),
  });

  if (!resendResponse.ok) return json({ ok: false, error: "delivery_failed" }, 502);
  return json({ ok: true }, 201);
};

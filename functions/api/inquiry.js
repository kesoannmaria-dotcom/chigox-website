const RESEND_ENDPOINT = "https://api.resend.com/emails";

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

const readValue = (source, ...names) => {
  for (const name of names) {
    const value = source?.[name];
    if (value != null) return cleanText(value);
  }
  return "";
};

const sourceBucket = (value) => {
  const text = String(value || "").toLowerCase();
  if (!text) return "";
  if (text.includes("google")) return "Google";
  if (text.includes("facebook") || text.includes("fb.com") || text.includes("instagram") || text.includes("meta")) return "Facebook";
  if (text.includes("direct")) return "Direct";
  return "";
};

function classifyInquirySource({ utmSource, referrer }) {
  const utmBucket = sourceBucket(utmSource);
  if (utmSource) return utmBucket || "Referral";
  if (!referrer) return "Direct";

  let referrerHost = "";
  try {
    referrerHost = new URL(referrer).hostname;
  } catch {
    referrerHost = referrer;
  }

  if (!referrerHost || referrerHost.endsWith("chigox.com")) return "Direct";
  return sourceBucket(referrerHost) || "Referral";
}

function parseAttribution(read) {
  const attribution = {
    source: "",
    referrer: read("referrer", "Referrer"),
    utmSource: read("utm_source", "utmSource"),
    utmMedium: read("utm_medium", "utmMedium"),
    utmCampaign: read("utm_campaign", "utmCampaign"),
    utmTerm: read("utm_term", "utmTerm"),
    utmContent: read("utm_content", "utmContent"),
    landingPage: read("landing_page", "landingPage"),
    submittedPage: read("submitted_page", "submittedPage")
  };
  attribution.source = classifyInquirySource(attribution);
  return attribution;
}

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
      attribution: parseAttribution((...names) => readValue(body, ...names))
    };
  }

  const form = await request.formData();
  return {
    name: getField(form, "name", "Name"),
    email: getField(form, "email", "Email"),
    company: getField(form, "company", "Company"),
    product: getField(form, "product", "Product"),
    message: getField(form, "message", "Message"),
    attribution: parseAttribution((...names) => getField(form, ...names))
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

function buildEmail(inquiry) {
  const submittedAt = new Date().toISOString();
  const subjectProduct = inquiry.product || "General inquiry";
  const subject = `CHIGOX website inquiry - ${subjectProduct}`;
  const attribution = inquiry.attribution || {};
  const html = `
    <h2>New CHIGOX Website Inquiry</h2>
    <table cellpadding="8" cellspacing="0" border="0">
      <tr><th align="left">Name</th><td>${escapeHtml(inquiry.name)}</td></tr>
      <tr><th align="left">Email</th><td>${escapeHtml(inquiry.email)}</td></tr>
      <tr><th align="left">Company</th><td>${escapeHtml(inquiry.company || "—")}</td></tr>
      <tr><th align="left">Product</th><td>${escapeHtml(inquiry.product || "—")}</td></tr>
      <tr><th align="left">Submitted at</th><td>${escapeHtml(submittedAt)}</td></tr>
    </table>
    <h3>Attribution</h3>
    <table cellpadding="8" cellspacing="0" border="0">
      <tr><th align="left">Source</th><td>${escapeHtml(attribution.source || "Direct")}</td></tr>
      <tr><th align="left">UTM source</th><td>${escapeHtml(attribution.utmSource || "—")}</td></tr>
      <tr><th align="left">UTM medium</th><td>${escapeHtml(attribution.utmMedium || "—")}</td></tr>
      <tr><th align="left">UTM campaign</th><td>${escapeHtml(attribution.utmCampaign || "—")}</td></tr>
      <tr><th align="left">UTM term</th><td>${escapeHtml(attribution.utmTerm || "—")}</td></tr>
      <tr><th align="left">UTM content</th><td>${escapeHtml(attribution.utmContent || "—")}</td></tr>
      <tr><th align="left">Referrer</th><td>${escapeHtml(attribution.referrer || "—")}</td></tr>
      <tr><th align="left">Landing page</th><td>${escapeHtml(attribution.landingPage || "—")}</td></tr>
      <tr><th align="left">Submitted page</th><td>${escapeHtml(attribution.submittedPage || "—")}</td></tr>
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
    "Attribution",
    `Source: ${attribution.source || "Direct"}`,
    `UTM source: ${attribution.utmSource || "—"}`,
    `UTM medium: ${attribution.utmMedium || "—"}`,
    `UTM campaign: ${attribution.utmCampaign || "—"}`,
    `UTM term: ${attribution.utmTerm || "—"}`,
    `UTM content: ${attribution.utmContent || "—"}`,
    `Referrer: ${attribution.referrer || "—"}`,
    `Landing page: ${attribution.landingPage || "—"}`,
    `Submitted page: ${attribution.submittedPage || "—"}`,
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

export async function onRequestGet() {
  return jsonResponse({ ok: true, service: "CHIGOX inquiry endpoint" });
}

export async function onRequestPost({ request, env }) {
  const envError = validateEnvironment(env);
  if (envError) return jsonResponse({ ok: false, error: envError }, 500);

  try {
    const inquiry = await parseInquiry(request);
    const inputError = validateInquiry(inquiry);
    if (inputError) return jsonResponse({ ok: false, error: inputError }, 400);

    await sendInquiryEmail(env, inquiry);
    return jsonResponse({ ok: true, message: "Inquiry sent.", attribution: inquiry.attribution });
  } catch (error) {
    console.error("Inquiry submission failed", error);
    return jsonResponse({ ok: false, error: "Inquiry could not be sent." }, 500);
  }
}

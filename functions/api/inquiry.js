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
      name: cleanText(body.name || body.Name || body.Nombre, 160),
      email: cleanText(body.email || body.Email || body["Correo electrónico"], 254),
      country: cleanText(body.country || body.Country || body.Pais || body.País, 120),
      company: cleanText(body.company || body.Company || body.Empresa, 180),
      product: cleanText(body.product || body.Product || body.Producto, 180),
      message: cleanText(body.message || body.Message || body.Mensaje, 4000),
      attribution: parseAttribution((...names) => readValue(body, ...names))
    };
  }

  const form = await request.formData();
  return {
    name: getField(form, "name", "Name", "Nombre"),
    email: getField(form, "email", "Email", "Correo electrónico"),
    country: getField(form, "country", "Country", "Pais", "País"),
    company: getField(form, "company", "Company", "Empresa"),
    product: getField(form, "product", "Product", "Producto"),
    message: getField(form, "message", "Message", "Mensaje"),
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

const landingPagePath = (value) => cleanText(value).split(/[?#]/, 1)[0];

function buildEmail(inquiry) {
  const subjectProduct = inquiry.product || "General inquiry";
  const subject = `CHIGOX website inquiry - ${subjectProduct}`;
  const attribution = inquiry.attribution || {};
  const landingPage = landingPagePath(attribution.landingPage) || "—";
  const html = `
    <h2>New CHIGOX Website Inquiry</h2>
    <p><strong>Name:</strong><br>${escapeHtml(inquiry.name)}</p>
    <p><strong>Email:</strong><br>${escapeHtml(inquiry.email)}</p>
    <p><strong>Country:</strong><br>${escapeHtml(inquiry.country || "—")}</p>
    <p><strong>Product:</strong><br>${escapeHtml(inquiry.product || "—")}</p>
    <p><strong>Message:</strong><br>${escapeHtml(inquiry.message)}</p>
    <hr>
    <h3>Marketing Source</h3>
    <p><strong>Source:</strong><br>${escapeHtml(attribution.source || "Direct")}</p>
    <p><strong>Campaign:</strong><br>${escapeHtml(attribution.utmCampaign || "—")}</p>
    <p><strong>Landing page:</strong><br>${escapeHtml(landingPage)}</p>
  `;
  const text = [
    "New CHIGOX Website Inquiry",
    "",
    "Name:",
    inquiry.name,
    "",
    "Email:",
    inquiry.email,
    "",
    "Country:",
    inquiry.country || "—",
    "",
    "Product:",
    inquiry.product || "—",
    "",
    "Message:",
    inquiry.message,
    "",
    "",
    "--- Marketing Source ---",
    "",
    "Source:",
    attribution.source || "Direct",
    "",
    "Campaign:",
    attribution.utmCampaign || "—",
    "",
    "Landing page:",
    landingPage,
    ""
  ].join("\n");

  return { subject, html, text };
}

const createInquiryId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `inquiry_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

async function saveInquiry(env, inquiry) {
  if (!env.DB) {
    console.warn("D1 binding DB is not configured; inquiry email will still be sent.");
    return { saved: false, id: "" };
  }

  const id = createInquiryId();
  const attribution = inquiry.attribution || {};

  await env.DB.prepare(
    `INSERT INTO contact_inquiries (
      id,
      name,
      email,
      country,
      company,
      product,
      message,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      landing_page,
      submitted_page
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      inquiry.name,
      inquiry.email,
      inquiry.country || "",
      inquiry.company || "",
      inquiry.product || "",
      inquiry.message,
      attribution.source || "Direct",
      attribution.utmSource || "",
      attribution.utmMedium || "",
      attribution.utmCampaign || "",
      attribution.utmTerm || "",
      attribution.utmContent || "",
      attribution.landingPage || "",
      attribution.submittedPage || ""
    )
    .run();

  return { saved: true, id };
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
    inquiry.country = inquiry.country || cleanText(request.cf?.country, 120);
    const inputError = validateInquiry(inquiry);
    if (inputError) return jsonResponse({ ok: false, error: inputError }, 400);

    let storage = { saved: false, id: "" };
    try {
      storage = await saveInquiry(env, inquiry);
    } catch (error) {
      console.error("Inquiry D1 save failed", error);
    }

    await sendInquiryEmail(env, inquiry);
    return jsonResponse({
      ok: true,
      message: "Inquiry sent.",
      attribution: inquiry.attribution,
      storage
    });
  } catch (error) {
    console.error("Inquiry submission failed", error);
    return jsonResponse({ ok: false, error: "Inquiry could not be sent." }, 500);
  }
}

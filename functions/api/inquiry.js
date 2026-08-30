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

async function parseInquiry(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      name: cleanText(body.name || body.Name, 160),
      email: cleanText(body.email || body.Email, 254),
      company: cleanText(body.company || body.Company, 180),
      product: cleanText(body.product || body.Product, 180),
      message: cleanText(body.message || body.Message, 4000)
    };
  }

  const form = await request.formData();
  return {
    name: getField(form, "name", "Name"),
    email: getField(form, "email", "Email"),
    company: getField(form, "company", "Company"),
    product: getField(form, "product", "Product"),
    message: getField(form, "message", "Message")
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

export async function onRequestGet() {
  return jsonResponse({ ok: true, service: "CHIGOX inquiry endpoint" });
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
      return jsonResponse({ ok: true, message: "Inquiry sent." });
    }

    const inputError = validateInquiry(inquiry);
    if (inputError) return jsonResponse({ ok: false, error: inputError }, 400);

    await sendInquiryEmail(env, inquiry);
    return jsonResponse({ ok: true, message: "Inquiry sent." });
  } catch (error) {
    console.error("Inquiry submission failed", error);
    return jsonResponse({ ok: false, error: "Inquiry could not be sent." }, 500);
  }
}

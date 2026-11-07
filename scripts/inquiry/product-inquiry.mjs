export const PRODUCT_IDENTIFIERS = Object.freeze({
  "cge-100": "CGE-100",
  "cg-7c": "CG-7C",
  "cg-q1": "CG-Q1",
  "cgvu-21-pro": "CGVU-21 Pro",
  "cgu-lcp": "CGU-LCP",
  "cgu-c": "CGU-C",
  "cgu-03": "CGU-03",
  "cgu-l": "CGU-L",
  "cgu-4p": "CGU-4P",
  "cgv-300": "CGV-300H",
  "cgv-300h": "CGV-300H",
  "cgv-g": "CGV-G",
  "cgvet-a220t": "CGVET-A220T",
  "cgvet-30": "CGVET-30",
  "cgv-m": "CGV-M",
  "cgv-dr07": "CGV-DR07",
  "cgv-dr2": "CGV-DR2",
  "cgv-dr605": "CGV-DR605",
  "bd-dp": "Disposable Video Laryngoscope",
  "reusable-system": "Reusable Video Laryngoscope",
  "bd-m3-vs-a": "Video Rigid Stylet",
  "cg-p31": "CG-P31",
  "cgb-600r": "CGB-600R",
  "disposable-flexible-bronchoscope": "Disposable Flexible Bronchoscope",
  "cgc-350r": "CGC-350R",
  "cgc-350d": "CGC-350D",
  "cgn-350r": "CGN-350R",
  "cgn-350d": "CGN-350D",
  "cgu-750r": "CGU-750R",
  "cgu-650d": "CGU-650D",
  "cgr-100": "CGR-100"
});

const canonicalFields = ["name", "email", "company", "product", "message"];

const escapeAttribute = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

export function productIdentifierForKey(key) {
  const identifier = PRODUCT_IDENTIFIERS[key];
  if (!identifier) throw new Error(`Missing verified product identifier for ${key}`);
  return identifier;
}

export function renderProductInquiryForm({
  identifier,
  labels,
  productValue,
  placeholder,
  buttonLabel
}) {
  return `<form class="inquiry-form" action="/api/inquiry" method="post" accept-charset="UTF-8">
    <input type="hidden" name="product_code" value="${escapeAttribute(identifier)}">
    <label>${labels.name}<input name="name" required></label><label>${labels.email}<input name="email" type="email" required></label><label>${labels.company}<input name="company"></label><label>${labels.product}<input name="product" value="${escapeAttribute(productValue)}"></label><label class="full">${labels.message}<textarea name="message" rows="5" placeholder="${escapeAttribute(placeholder)}" required></textarea></label><button class="btn primary" type="submit">${buttonLabel}</button>
  </form>`;
}

export function ensureInquiryClientScript(html) {
  const source = "/assets/js/inquiry-turnstile.js";
  const count = html.split(source).length - 1;
  if (count > 1) throw new Error("Inquiry client script is included more than once");
  if (count === 1) return html;

  const footerEnd = html.indexOf("</footer>");
  const nextScript = footerEnd === -1 ? -1 : html.indexOf("<script", footerEnd);
  if (nextScript !== -1) {
    return `${html.slice(0, nextScript)}<script src="${source}" defer></script>\n  ${html.slice(nextScript)}`;
  }
  return html.replace("</body>", `  <script src="${source}" defer></script>\n</body>`);
}

function normalizeForm(form, identifier = "") {
  const opening = form.match(/^<form\b[^>]*>/)?.[0];
  if (!opening) throw new Error("Inquiry form opening tag is missing");

  let body = form.slice(opening.length, -"</form>".length);
  body = body.replace(
    /\r?\n[ \t]*<input\b[^>]*\bname="product_code"[^>]*>[ \t]*(?=\r?\n)/g,
    ""
  );
  body = body.replace(
    /<input\b[^>]*\bname="product_code"[^>]*>/g,
    ""
  );
  body = body.replace(/^\s*/, "\n    ");

  let fieldIndex = 0;
  body = body.replace(/<(input|textarea)\b([^>]*)>/g, (tag, element, attributes) => {
    if (!/\bname="[^"]*"/.test(attributes)) return tag;
    if (fieldIndex >= canonicalFields.length) {
      throw new Error("Inquiry form contains unexpected named controls");
    }
    const field = canonicalFields[fieldIndex++];
    let nextAttributes = attributes.replace(/\bname="[^"]*"/, `name="${field}"`);
    if (field === "message" && !/\srequired(?:\s|$)/.test(nextAttributes)) {
      nextAttributes += " required";
    }
    return `<${element}${nextAttributes}>`;
  });

  if (fieldIndex !== canonicalFields.length) {
    throw new Error(`Inquiry form has ${fieldIndex} named controls; expected 5`);
  }

  const productCode = identifier
    ? `\n    <input type="hidden" name="product_code" value="${escapeAttribute(identifier)}">`
    : "";
  return `<form class="inquiry-form" action="/api/inquiry" method="post" accept-charset="UTF-8">${productCode}${body}</form>`;
}

function migrateInquiryHtml(html, identifier = "") {
  const forms = [...html.matchAll(/<form class="inquiry-form"[\s\S]*?<\/form>/g)];
  if (forms.length !== 1) {
    throw new Error(`Expected one inquiry form, found ${forms.length}`);
  }
  const migrated = html.replace(forms[0][0], normalizeForm(forms[0][0], identifier));
  return ensureInquiryClientScript(migrated);
}

export function migrateProductInquiryHtml(html, identifier) {
  if (!identifier) throw new Error("Product inquiry identifier is required");
  return migrateInquiryHtml(html, identifier);
}

export function migrateContactInquiryHtml(html) {
  return migrateInquiryHtml(html);
}

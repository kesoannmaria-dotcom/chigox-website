import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  FOOTER_END,
  FOOTER_START,
  GTM_ID,
  HEAD_END,
  HEAD_START,
  collectHtmlFiles
} from "./html-integration.mjs";

const root = process.cwd();
const files = collectHtmlFiles(root);
const errors = [];
let footerPages = 0;

const count = (text, needle) => text.split(needle).length - 1;

for (const file of files) {
  const relative = path.relative(root, file);
  const html = fs.readFileSync(file, "utf8");
  const hasFooter = html.includes('<footer class="site-footer">');
  if (hasFooter) footerPages += 1;

  const checks = [
    [count(html, HEAD_START) === 1, "analytics head start marker"],
    [count(html, HEAD_END) === 1, "analytics head end marker"],
    [count(html, 'href="/assets/css/chigox-consent.css"') === 1, "consent stylesheet"],
    [count(html, 'src="/assets/js/chigox-consent.js"') === 1, "consent script"],
    [count(html, 'src="/assets/js/chigox-analytics.js"') === 1, "analytics script"],
    [count(html, `data-gtm-id="${GTM_ID}"`) === 1, "GTM identifier"],
    [!html.includes("googletagmanager.com/gtag/js"), "no direct gtag.js"],
    [!html.includes("googletagmanager.com/gtm.js"), "no static GTM load before consent"],
    [html.indexOf(HEAD_START) < html.indexOf("</head>"), "analytics scripts inside head"]
  ];

  if (hasFooter) {
    checks.push(
      [count(html, FOOTER_START) === 1, "cookie settings footer start marker"],
      [count(html, FOOTER_END) === 1, "cookie settings footer end marker"],
      [count(html, "data-cookie-settings") === 1, "cookie settings footer control"]
    );
  } else {
    checks.push([count(html, "data-cookie-settings") === 0, "no orphaned cookie settings control"]);
  }

  for (const [passed, label] of checks) {
    if (!passed) errors.push(`${relative}: ${label}`);
  }
}

const consentSource = fs.readFileSync(path.join(root, "assets/js/chigox-consent.js"), "utf8");
const analyticsSource = fs.readFileSync(path.join(root, "assets/js/chigox-analytics.js"), "utf8");
const inquirySource = fs.readFileSync(path.join(root, "assets/js/inquiry-turnstile.js"), "utf8");

for (const language of ["en", "es", "fr", "pt-BR", "de", "it", "pl", "tr", "ko"]) {
  const token = language.includes("-") ? `"${language}": {` : `${language}: {`;
  if (!consentSource.includes(token)) errors.push(`Missing consent translation: ${language}`);
}

const consentDefaultIndex = consentSource.indexOf('window.gtag("consent", "default"');
const gtmLoadIndex = consentSource.indexOf("const loadGtm");
if (consentDefaultIndex < 0 || gtmLoadIndex < 0 || consentDefaultIndex > gtmLoadIndex) {
  errors.push("Consent default must be declared before GTM can load.");
}

for (const field of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
  if (!consentSource.includes(field)) errors.push(`Missing Consent Mode V2 field: ${field}`);
}

if (analyticsSource.includes('window.gtag("event", "page_view"')) {
  errors.push("page_view must not be sent manually; GTM is the single page_view source.");
}

for (const event of ["quote_cta_click", "whatsapp_click", "email_click", "form_start", "generate_lead"]) {
  if (!analyticsSource.includes(`"${event}"`)) errors.push(`Missing analytics event: ${event}`);
}

for (const parameter of ["page_path", "page_language", "product_code", "cta_location", "form_type"]) {
  if (!analyticsSource.includes(`"${parameter}"`)) errors.push(`Missing allowed analytics parameter: ${parameter}`);
}

for (const forbidden of ["customer_name", "email_address", "phone_number", "company_name", "message_content"]) {
  if (analyticsSource.includes(forbidden)) errors.push(`Forbidden analytics parameter: ${forbidden}`);
}

if (!inquirySource.includes("trackGenerateLead")) {
  errors.push("API inquiry success is not connected to generate_lead.");
}
if (!inquirySource.includes("payload?.ok") && !inquirySource.includes("payload.ok")) {
  errors.push("API inquiry must confirm payload.ok before generate_lead.");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

assert.equal(files.length, 798, "The validated Production baseline should contain 798 HTML pages.");
console.log(JSON.stringify({
  status: "passed",
  htmlFiles: files.length,
  footerPages,
  gtmId: GTM_ID,
  pageViewSource: "GTM only",
  customEvents: 5,
  consentLanguages: 9
}, null, 2));

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([".git", "node_modules", "product-records", "tests", "functions"]);

function collectHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return ignoredDirectories.has(entry.name) ? [] : collectHtml(filePath);
    return entry.name.endsWith(".html") ? [filePath] : [];
  });
}

function inquiryForms(html) {
  return [...html.matchAll(/<form\b[^>]*class="[^"]*\binquiry-form\b[^"]*"[^>]*>([\s\S]*?)<\/form>/gi)];
}

const FORM_FIELD_NAMES = ["company", "email", "message", "name", "product"];
const NON_CANONICAL_MACHINE_NAMES = /\bname="(?:Name|Email|Company|Product|Message|Unternehmen|Produkt|Nachricht|E-Mail|Nombre|Correo electrónico|Empresa|Producto|Mensaje|Nome|Azienda|Prodotto|Messaggio|이름|이메일|회사|제품|메시지|Imię|E-mail|Firma|Wiadomość|Ad|E-posta|Şirket|Ürün|Mesaj)"/;

test("all inquiry forms submit only to the same-origin HTTPS API", () => {
  const affectedFiles = [];
  for (const filePath of collectHtml(root)) {
    const html = fs.readFileSync(filePath, "utf8");
    const forms = inquiryForms(html);
    if (!forms.length) continue;
    affectedFiles.push(filePath);
    for (const form of forms) {
      const [markup, body] = form;
      assert.match(markup, /\baction="\/api\/inquiry"/i, `${filePath} must use /api/inquiry`);
      assert.doesNotMatch(markup, /\baction="(?:http:|mailto:)/i, `${filePath} has an unsafe form action`);
      assert.match(markup, /\bmethod="post"/i, `${filePath} must POST`);
      const fieldNames = [...body.matchAll(/<(?:input|textarea)\b[^>]*\bname="([^"]+)"/gi)]
        .map((match) => match[1])
        .sort();
      assert.deepEqual(fieldNames, FORM_FIELD_NAMES, `${filePath} must use only canonical machine field names`);
    }
    assert.match(html, /<script\s+src="\/assets\/js\/inquiry-form\.js"\s+defer><\/script>/i, `${filePath} must load the shared secure submitter`);
  }
  assert.equal(affectedFiles.length, 273, "unexpected inquiry-form page count; review generated page coverage");
});

test("website source contains no HTTP form action or hard-coded HTTP API URL", () => {
  for (const filePath of collectHtml(root)) {
    const html = fs.readFileSync(filePath, "utf8");
    assert.doesNotMatch(html, /<form\b[^>]*\baction="http:\/\//i, `${filePath} has an HTTP form action`);
  }
  const client = fs.readFileSync(path.join(root, "assets/js/inquiry-form.js"), "utf8");
  assert.match(client, /const API_URL = "\/api\/inquiry"/);
  assert.doesNotMatch(
    client,
    /(?:fetch|axios\.[a-z]+)\(\s*["']https?:\/\//,
    "Client must not call an absolute HTTP(S) API URL"
  );
  assert.match(client, /new FormData\(form\)/);
  assert.match(client, /utm_content/);
  assert.match(client, /utm_term/);
  for (const fieldName of FORM_FIELD_NAMES) {
    assert.match(client, new RegExp(`readField\\(formData, "${fieldName}"\\)`));
  }
  assert.doesNotMatch(client, /Nombre|Correo electrónico|Unternehmen|이름|Imię|Ad/);
});

test("the endoscopy page generator keeps the secure inquiry contract", () => {
  const generator = fs.readFileSync(path.join(root, "scripts/generate_endoscopy_pages.mjs"), "utf8");
  assert.match(generator, /action="\/api\/inquiry"/);
  assert.match(generator, /name="name"/);
  assert.match(generator, /name="email"/);
  assert.match(generator, /name="company"/);
  assert.match(generator, /name="product"/);
  assert.match(generator, /name="message"/);
  assert.match(generator, /assets\/js\/inquiry-form\.js/);
  assert.doesNotMatch(generator, /action="mailto:/);
});

test("the Contact page uses standard implicit Turnstile", () => {
  const contactPage = fs.readFileSync(path.join(root, "contact-us/index.html"), "utf8");
  const client = fs.readFileSync(path.join(root, "assets/js/inquiry-form.js"), "utf8");

  assert.match(contactPage, /<script\s+src="https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js"\s+defer><\/script>/i);
  assert.match(contactPage, /<div class="cf-turnstile full" data-sitekey="0x4AAAAAAEQpv-eVAYAfEalX" data-action="inquiry_form"><\/div>/);
  assert.doesNotMatch(contactPage, /render=explicit/i);
  assert.match(client, /readField\(formData, "cf-turnstile-response"\)/);
  assert.doesNotMatch(client, /render=explicit|\.render\(|widgetId|getResponse\(|resetTurnstile|turnstile\.execute/i);
});

test("the client binds a native-submit guard before reading the implicit Turnstile response", () => {
  const client = fs.readFileSync(path.join(root, "assets/js/inquiry-form.js"), "utf8");
  const submitListener = client.indexOf('form.addEventListener("submit", async (event) => {');
  const preventDefault = client.indexOf("event.preventDefault();", submitListener);
  const responseRead = client.indexOf('const turnstileToken = readField(formData, "cf-turnstile-response");', submitListener);
  const postRequest = client.indexOf("const response = await fetch(API_URL", submitListener);

  assert.ok(submitListener >= 0, "every initialized inquiry form needs a submit listener");
  assert.ok(preventDefault > submitListener, "the submit listener must prevent native submission");
  assert.ok(preventDefault < responseRead, "preventDefault must run before reading the Turnstile response");
  assert.ok(responseRead < postRequest, "an empty Turnstile response must block the API request");
});

test("implicit Turnstile and submission failures keep the browser on-page", () => {
  const client = fs.readFileSync(path.join(root, "assets/js/inquiry-form.js"), "utf8");

  assert.match(
    client,
    /if \(!turnstileToken\) \{\s*status\.textContent = "Please complete the verification before sending your inquiry\."/s,
    "an empty standard Turnstile response must become an on-page error"
  );
  assert.match(
    client,
    /catch\s*\{\s*status\.textContent = "Your inquiry was not confirmed\./s,
    "POST/fetch errors must become an on-page error"
  );
  assert.doesNotMatch(client, /\.submit\(|\.requestSubmit\(/, "client must never programmatically trigger native form submission");
});

test("translated labels remain visible while machine field names stay canonical", () => {
  const samples = [
    ["contact-us/index.html", /<label>Name<input name="name" required><\/label>/],
    ["es/contact-us/index.html", /<label>Nombre<input name="name" required><\/label>/],
    ["de/contact-us/index.html", /<label>Unternehmen<input name="company"><\/label>/],
  ];
  for (const [relativePath, expectedMarkup] of samples) {
    const html = fs.readFileSync(path.join(root, relativePath), "utf8");
    assert.match(html, expectedMarkup, `${relativePath} must preserve translated visible copy`);
  }
  for (const filePath of collectHtml(root)) {
    const html = fs.readFileSync(filePath, "utf8");
    assert.doesNotMatch(html, NON_CANONICAL_MACHINE_NAMES, `${filePath} has a translated machine field name`);
  }
});

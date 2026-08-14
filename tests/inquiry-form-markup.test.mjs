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
  for (const fieldName of FORM_FIELD_NAMES) {
    assert.match(client, new RegExp(`readField\\(formData, "${fieldName}"\\)`));
  }
  assert.doesNotMatch(client, /Nombre|Correo electrónico|Unternehmen|이름|Imię|Ad/);
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

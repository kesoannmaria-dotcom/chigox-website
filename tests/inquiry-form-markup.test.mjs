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
  return [...html.matchAll(/<form\b[^>]*class="[^"]*\binquiry-form\b[^"]*"[^>]*>/gi)].map((match) => match[0]);
}

test("all inquiry forms submit only to the same-origin HTTPS API", () => {
  const affectedFiles = [];
  for (const filePath of collectHtml(root)) {
    const html = fs.readFileSync(filePath, "utf8");
    const forms = inquiryForms(html);
    if (!forms.length) continue;
    affectedFiles.push(filePath);
    for (const form of forms) {
      assert.match(form, /\baction="\/api\/inquiry"/i, `${filePath} must use /api/inquiry`);
      assert.doesNotMatch(form, /\baction="(?:http:|mailto:)/i, `${filePath} has an unsafe form action`);
      assert.match(form, /\bmethod="post"/i, `${filePath} must POST`);
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
});

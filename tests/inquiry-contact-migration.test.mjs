import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  CONTACT_LANGUAGES,
  migrateContactForms
} from "../scripts/inquiry/migrate-contact-forms.mjs";

const root = path.resolve(import.meta.dirname, "..");

test("six localized Contact forms use the unified general-inquiry contract", () => {
  for (const language of CONTACT_LANGUAGES) {
    const file = path.join(root, language, "contact-us", "index.html");
    const html = fs.readFileSync(file, "utf8");
    const forms = html.match(/<form class="inquiry-form"[\s\S]*?<\/form>/g) || [];
    assert.equal(forms.length, 1, `${file}: expected one inquiry form`);
    assert.match(forms[0], /action="\/api\/inquiry"/);
    assert.doesNotMatch(forms[0], /action="mailto:/);
    assert.doesNotMatch(forms[0], /name="product_code"/);
    assert.deepEqual(
      [...forms[0].matchAll(/<(?:input|textarea)\b[^>]*\bname="([^"]+)"/g)]
        .map((match) => match[1]),
      ["name", "email", "company", "product", "message"]
    );
    assert.match(forms[0], /<textarea name="message"[^>]*\brequired\b/);
    assert.equal(
      (html.match(/<script src="\/assets\/js\/inquiry-turnstile\.js" defer><\/script>/g) || []).length,
      1,
      `${file}: expected one inquiry client script`
    );
  }
});

test("localized Contact migration is idempotent", () => {
  const result = migrateContactForms({ root, write: false });
  assert.equal(result.checked, 6);
  assert.equal(result.changed, 0);
});

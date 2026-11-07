import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  languages,
  pageDefinitions,
  publishedLanguageKeys
} from "../scripts/i18n/page-map.mjs";
import {
  PRODUCT_IDENTIFIERS,
  productIdentifierForKey
} from "../scripts/inquiry/product-inquiry.mjs";
import { migrateProductForms } from "../scripts/inquiry/migrate-product-forms.mjs";

const root = path.resolve(import.meta.dirname, "..");
const selectedCategory = process.env.INQUIRY_CATEGORY || "";
const categoryForRoute = (route) => route.split("/")[2];
const definitions = pageDefinitions.filter((definition) =>
  definition.type === "product-detail" &&
  (!selectedCategory || categoryForRoute(definition.route) === selectedCategory)
);

const fileFor = (languageKey, route) => path.join(
  root,
  languages[languageKey].prefix,
  route.slice(1),
  "index.html"
);

test("every canonical product has one verified identifier", () => {
  const products = pageDefinitions.filter(({ type }) => type === "product-detail");
  assert.equal(products.length, 31);
  assert.equal(Object.keys(PRODUCT_IDENTIFIERS).length, products.length);
  assert.deepEqual(
    Object.keys(PRODUCT_IDENTIFIERS).sort(),
    products.map(({ key }) => key).sort()
  );
});

test("selected canonical product forms use the unified inquiry contract", () => {
  let checked = 0;
  for (const definition of definitions) {
    const identifier = productIdentifierForKey(definition.key);
    for (const languageKey of publishedLanguageKeys) {
      const file = fileFor(languageKey, definition.route);
      const html = fs.readFileSync(file, "utf8");
      const form = html.match(/<form class="inquiry-form"[\s\S]*?<\/form>/g) || [];
      assert.equal(form.length, 1, `${file}: expected one inquiry form`);
      assert.match(form[0], /action="\/api\/inquiry"/);
      assert.doesNotMatch(form[0], /action="mailto:/);
      assert.match(
        form[0],
        new RegExp(`name="product_code" value="${identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`)
      );
      assert.deepEqual(
        [...form[0].matchAll(/<(?:input|textarea)\b[^>]*\bname="([^"]+)"/g)]
          .map((match) => match[1]),
        ["product_code", "name", "email", "company", "product", "message"]
      );
      assert.match(form[0], /<textarea name="message"[^>]*\brequired\b/);
      assert.equal(
        (html.match(/<script src="\/assets\/js\/inquiry-turnstile\.js" defer><\/script>/g) || []).length,
        1,
        `${file}: expected one inquiry client script`
      );
      checked += 1;
    }
  }
  assert.equal(checked, definitions.length * publishedLanguageKeys.length);
});

test("selected product migration is idempotent", () => {
  const result = migrateProductForms({
    root,
    write: false,
    category: selectedCategory || undefined
  });
  assert.equal(result.changed, 0);
});

test("Endoscopy generators no longer emit mailto inquiry forms", () => {
  for (const file of [
    "scripts/generate_endoscopy_pages.mjs",
    "scripts/generate_localized_endoscopy_pages.mjs"
  ]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(
      source,
      /<form class="inquiry-form"[^>]*action="mailto:/,
      `${file}: mailto inquiry form template remains`
    );
  }
});

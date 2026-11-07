import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  languages,
  pageDefinitions,
  publishedLanguageKeys
} from "../i18n/page-map.mjs";
import {
  migrateProductInquiryHtml,
  productIdentifierForKey
} from "./product-inquiry.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDirectory, "../..");

const categoryForRoute = (route) => route.split("/")[2];
const fileFor = (root, languageKey, route) => path.join(
  root,
  languages[languageKey].prefix,
  route.slice(1),
  "index.html"
);

export function migrateProductForms({ root = defaultRoot, write = false, category } = {}) {
  const definitions = pageDefinitions.filter((definition) =>
    definition.type === "product-detail" &&
    (!category || categoryForRoute(definition.route) === category)
  );
  const changedFiles = [];
  let checked = 0;

  for (const definition of definitions) {
    const identifier = productIdentifierForKey(definition.key);
    for (const languageKey of publishedLanguageKeys) {
      const file = fileFor(root, languageKey, definition.route);
      const current = fs.readFileSync(file, "utf8");
      const migrated = migrateProductInquiryHtml(current, identifier);
      checked += 1;
      if (migrated === current) continue;
      changedFiles.push(path.relative(root, file));
      if (write) fs.writeFileSync(file, migrated);
    }
  }

  return {
    mode: write ? "write" : "dry-run",
    category: category || "all",
    products: definitions.length,
    checked,
    changed: changedFiles.length,
    changedFiles
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const category = process.argv.find((argument) => argument.startsWith("--category="))
    ?.slice("--category=".length);
  const result = migrateProductForms({
    root: process.cwd(),
    write: process.argv.includes("--write"),
    category
  });
  console.log(JSON.stringify(result, null, 2));
}

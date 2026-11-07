import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrateContactInquiryHtml } from "./product-inquiry.mjs";

export const CONTACT_LANGUAGES = Object.freeze(["es", "tr", "de", "it", "pl", "ko"]);

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDirectory, "../..");

export function migrateContactForms({ root = defaultRoot, write = false } = {}) {
  const changedFiles = [];

  for (const language of CONTACT_LANGUAGES) {
    const relativeFile = `${language}/contact-us/index.html`;
    const file = path.join(root, relativeFile);
    const current = fs.readFileSync(file, "utf8");
    const migrated = migrateContactInquiryHtml(current);
    if (migrated === current) continue;
    changedFiles.push(relativeFile);
    if (write) fs.writeFileSync(file, migrated);
  }

  return {
    mode: write ? "write" : "dry-run",
    checked: CONTACT_LANGUAGES.length,
    changed: changedFiles.length,
    changedFiles
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(migrateContactForms({
    root: process.cwd(),
    write: process.argv.includes("--write")
  }), null, 2));
}

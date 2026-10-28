import fs from "node:fs";
import { blogCatalogFile, blogLanguageKeys, loadBlogCatalog } from "./blog-localization.mjs";

const root = process.cwd();
for (const languageKey of blogLanguageKeys) {
  const catalog = loadBlogCatalog(root, languageKey);
  const sorted = Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b, "en")));
  fs.writeFileSync(blogCatalogFile(root, languageKey), `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`${languageKey}: persisted ${Object.keys(sorted).length} reviewed complete-string translations`);
}

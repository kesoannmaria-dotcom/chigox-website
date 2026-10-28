import fs from "node:fs";
import path from "node:path";
import { collectSourceStrings } from "./core-localization.mjs";
import { pageDefinitions } from "./page-map.mjs";
import { curateBlogCatalog } from "./blog-curated-overrides.mjs";

export const blogDefinitions = Object.freeze(
  pageDefinitions.filter(({ type }) => type === "blog-index" || type === "blog-article"),
);

export const blogLanguageKeys = Object.freeze(["es", "tr", "de", "it", "pl", "ko", "fr", "pt"]);

export function blogCatalogFile(root, languageKey) {
  return path.join(root, "scripts", "i18n", "translations", `blog-${languageKey}.json`);
}

export function loadBlogCatalog(root, languageKey) {
  const file = blogCatalogFile(root, languageKey);
  if (!fs.existsSync(file)) throw new Error(`Missing Blog translation catalog: ${file}`);
  return curateBlogCatalog(JSON.parse(fs.readFileSync(file, "utf8")), languageKey);
}

export function collectBlogSourceStrings(root) {
  return collectSourceStrings(root, blogDefinitions);
}

export function isBlogDefinition(definition) {
  return definition.type === "blog-index" || definition.type === "blog-article";
}

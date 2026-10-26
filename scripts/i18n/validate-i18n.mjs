import fs from "node:fs";
import path from "node:path";
import {
  SITE_ORIGIN,
  absoluteUrl,
  activeLanguageKeys,
  knownRouteAnomalies,
  languages,
  localizedLanguageKeys,
  missingSixLanguageRoutes,
  pageDefinitions,
  translationStatus,
} from "./page-map.mjs";
import { collectPublishedDocuments, fileFor, runGeneration } from "./generate-language-metadata.mjs";

const root = process.cwd();
const errors = [];
const warnings = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const read = (relativeFile) => fs.readFileSync(path.join(root, relativeFile), "utf8");

const keys = pageDefinitions.map(({ key }) => key);
const routes = pageDefinitions.map(({ route }) => route);
assert(pageDefinitions.length === 74, `page-map: expected 74 canonical pages, found ${pageDefinitions.length}`);
assert(new Set(keys).size === keys.length, "page-map: duplicate page keys");
assert(new Set(routes).size === routes.length, "page-map: duplicate routes");
assert(pageDefinitions.every(({ route }) => route.startsWith("/") && route.endsWith("/")), "page-map: every route must start and end with '/'");
assert(!pageDefinitions.some(({ route }) => route.startsWith("/applications/")), "page-map: Applications must remain outside Phase 0");

for (const definition of pageDefinitions) {
  if (definition.parentKey) assert(keys.includes(definition.parentKey), `${definition.key}: parent ${definition.parentKey} does not exist`);
}

const { documents, missingFiles } = collectPublishedDocuments(root);
assert(missingFiles.length === 0, `published files missing:\n${missingFiles.join("\n")}`);
assert(documents.length === 434, `published canonical documents: expected 434, found ${documents.length}`);

for (const document of documents) {
  const html = read(document.relativeFile);
  const expectedCanonical = absoluteUrl(document.languageKey, document.definition.route);
  assert(html.includes(`<link rel="canonical" href="${expectedCanonical}">`), `${document.relativeFile}: canonical mismatch`);
  assert(html.includes(`<html lang="${languages[document.languageKey].htmlLang}">`), `${document.relativeFile}: html lang mismatch`);
}

const sitemap = read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapSet = new Set(sitemapUrls);
assert(sitemapSet.size === sitemapUrls.length, "sitemap: duplicate URL");
for (const document of documents) {
  const expected = absoluteUrl(document.languageKey, document.definition.route);
  assert(sitemapSet.has(expected), `sitemap: missing ${expected}`);
}

const mappedUrls = new Set(pageDefinitions.flatMap((definition) => activeLanguageKeys
  .filter((languageKey) => translationStatus(definition.key, languageKey) === "published")
  .map((languageKey) => absoluteUrl(languageKey, definition.route))));
const unmappedSitemapUrls = sitemapUrls.filter((url) => !mappedUrls.has(url));
assert(unmappedSitemapUrls.length === 6, `sitemap: expected 6 preserved unmapped routes, found ${unmappedSitemapUrls.length}`);

for (const languageKey of ["fr", "pt"]) {
  assert(!fs.existsSync(path.join(root, languages[languageKey].prefix)), `${languageKey}: planned language directory must not exist in Phase 0`);
  assert(!sitemapUrls.some((url) => url.startsWith(`${SITE_ORIGIN}/${languages[languageKey].prefix}/`)), `${languageKey}: planned language must not be in sitemap`);
}

const allHtml = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.name === "index.html") allHtml.push(path.relative(root, absolute));
  }
};
walk(root);

let languageMenuCount = 0;
let hreflangPageCount = 0;
for (const relativeFile of allHtml) {
  const html = read(relativeFile);
  if (html.includes('class="language-menu"')) {
    languageMenuCount += 1;
    assert(!/<a href="\/(?:fr|pt)\//.test(html), `${relativeFile}: FR/PT must remain unavailable`);
    const plannedAnchors = html.match(/data-language-coming-soon="true"/g) ?? [];
    assert(plannedAnchors.length === 2, `${relativeFile}: expected hidden FR/PT placeholders`);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
  if (alternates.length) hreflangPageCount += 1;
  assert(!alternates.some((match) => match[1] === "fr" || match[1] === "pt" || match[1] === "pt-BR"), `${relativeFile}: FR/PT hreflang must not be emitted before launch`);

  if (canonical && alternates.length) {
    for (const alternate of alternates) {
      if (alternate[1] === "x-default") continue;
      const targetPath = new URL(alternate[2]).pathname;
      const targetFile = targetPath === "/" ? "index.html" : `${targetPath.slice(1)}index.html`;
      if (!fs.existsSync(path.join(root, targetFile))) {
        errors.push(`${relativeFile}: hreflang target missing ${alternate[2]}`);
        continue;
      }
      const targetHtml = read(targetFile);
      assert(targetHtml.includes(`href="${canonical}"`), `${relativeFile}: hreflang is not reciprocal with ${targetFile}`);
    }
  }
}

assert(languageMenuCount === 547, `language menu regression: expected 547 pages, found ${languageMenuCount}`);
assert(hreflangPageCount === 119, `hreflang regression: expected 119 current pages, found ${hreflangPageCount}`);
assert(localizedLanguageKeys.every((languageKey) => missingSixLanguageRoutes.size === 14), "six-language missing-route baseline changed");

const generation = runGeneration({ root, write: false });
assert(generation.plannedDocuments === 148, `FR/PT plan: expected 148 documents, found ${generation.plannedDocuments}`);
assert(generation.sitemapMappedUrls === 434, `sitemap generator: expected 434 mapped URLs, found ${generation.sitemapMappedUrls}`);
assert(generation.sitemapPreservedUnmappedUrls.length === 6, "sitemap generator must preserve the 6 unresolved localized category URLs");

for (const anomaly of knownRouteAnomalies) warnings.push(`${anomaly.severity}: ${anomaly.id} - ${anomaly.detail}`);
for (const file of generation.missingLanguageMenus) warnings.push(`template-gap: ${file} has no language selector to update`);

const report = {
  canonicalPages: pageDefinitions.length,
  publishedCanonicalDocuments: documents.length,
  currentSitemapUrls: sitemapUrls.length,
  preservedUnmappedSitemapUrls: unmappedSitemapUrls,
  missingSixLanguagePages: localizedLanguageKeys.length * missingSixLanguageRoutes.size,
  plannedFrenchPortuguesePages: 148,
  currentLanguageMenus: languageMenuCount,
  currentHreflangPages: hreflangPageCount,
  generatorDryRunChanges: generation.changedDocuments,
  templateGaps: generation.missingLanguageMenus,
  warnings,
};

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
console.log("CHIGOX Phase 0 i18n validation passed.");

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
  resolvedRouteDecisions,
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
assert(pageDefinitions.length === 76, `page-map: expected 76 canonical pages after Phase 1A audit, found ${pageDefinitions.length}`);
assert(new Set(keys).size === keys.length, "page-map: duplicate page keys");
assert(new Set(routes).size === routes.length, "page-map: duplicate routes");
assert(pageDefinitions.every(({ route }) => route.startsWith("/") && route.endsWith("/")), "page-map: every route must start and end with '/'");
assert(!pageDefinitions.some(({ route }) => route.startsWith("/applications/")), "page-map: Applications must remain outside Phase 0");

for (const definition of pageDefinitions) {
  if (definition.parentKey) assert(keys.includes(definition.parentKey), `${definition.key}: parent ${definition.parentKey} does not exist`);
}

const { documents, missingFiles } = collectPublishedDocuments(root);
assert(missingFiles.length === 0, `published files missing:\n${missingFiles.join("\n")}`);
assert(documents.length === 442, `published canonical documents: expected 442, found ${documents.length}`);

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
assert(unmappedSitemapUrls.length === 0, `sitemap: expected no unmapped routes, found ${unmappedSitemapUrls.length}`);

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

assert(languageMenuCount === allHtml.length, `language menu regression: expected all ${allHtml.length} pages, found ${languageMenuCount}`);
assert(hreflangPageCount === 119, `hreflang regression: expected 119 current pages, found ${hreflangPageCount}`);
assert(localizedLanguageKeys.every((languageKey) => missingSixLanguageRoutes.size === 15), "six-language missing-route baseline changed");

const redirects = read("_redirects");
assert(!redirects.includes("/products/ultrasound/handheld-ultrasound/convex-transvaginal-scanner/ /products/ultrasound/handheld-ultrasound/convex-scanner/"), "redirects: independent convex/transvaginal category must not redirect to convex-scanner");
assert(redirects.includes("/products/ultrasound/medical/portable-color-ultrasound/ /products/ultrasound/portable-color-ultrasound/ 301"), "redirects: portable color category legacy redirect missing");
assert(redirects.includes("/products/ultrasound/medical/portable-color-ultrasound/cg-p31/ /products/ultrasound/portable-color-ultrasound/cg-p31/ 301"), "redirects: CG-P31 legacy redirect missing");
assert(!fs.existsSync(path.join(root, "products/ultrasound/medical/portable-color-ultrasound/index.html")), "portable color: legacy category mirror must be removed");
assert(!fs.existsSync(path.join(root, "products/ultrasound/medical/portable-color-ultrasound/cg-p31/index.html")), "portable color: legacy CG-P31 mirror must be removed");
assert(sitemapSet.has(`${SITE_ORIGIN}/products/veterinary/vet-anesthesia-machine/cgvet-a220t/`), "sitemap: CGVET-A220T missing");
assert(sitemapSet.has(`${SITE_ORIGIN}/products/ultrasound/handheld-ultrasound/convex-transvaginal-scanner/`), "sitemap: convex/transvaginal category missing");

const convexMain = read("products/ultrasound/handheld-ultrasound/convex-scanner/index.html").match(/<main>[\s\S]*?<\/main>/)?.[0] ?? "";
const transvaginalMain = read("products/ultrasound/handheld-ultrasound/convex-transvaginal-scanner/index.html").match(/<main>[\s\S]*?<\/main>/)?.[0] ?? "";
assert(convexMain.includes("CGU-C") && !convexMain.includes("CGU-03"), "convex category: must contain CGU-C only");
assert(transvaginalMain.includes("CGU-03") && !transvaginalMain.includes("CGU-C"), "convex/transvaginal category: must contain CGU-03 only");

for (const definition of pageDefinitions.filter(({ type }) => type === "blog-index" || type === "blog-article")) {
  const html = read(fileFor("en", definition.route));
  assert(html.includes('class="language-menu"'), `${definition.route}: English blog language menu missing`);
  assert(html.includes(`href="${definition.route}" aria-current="true"`), `${definition.route}: English language link must preserve the current page`);
  if (definition.type === "blog-article") {
    assert((html.match(/data-language-fallback="true"/g) ?? []).length === 6, `${definition.route}: expected six safe language fallbacks`);
  }
}

const generation = runGeneration({ root, write: false });
assert(generation.plannedDocuments === 152, `FR/PT plan: expected 152 documents, found ${generation.plannedDocuments}`);
assert(generation.sitemapMappedUrls === 442, `sitemap generator: expected 442 mapped URLs, found ${generation.sitemapMappedUrls}`);
assert(generation.sitemapPreservedUnmappedUrls.length === 0, "sitemap generator: unresolved URLs remain outside the page map");

for (const anomaly of knownRouteAnomalies) warnings.push(`${anomaly.severity}: ${anomaly.id} - ${anomaly.detail}`);
for (const file of generation.missingLanguageMenus) warnings.push(`template-gap: ${file} has no language selector to update`);

const report = {
  canonicalPages: pageDefinitions.length,
  publishedCanonicalDocuments: documents.length,
  currentSitemapUrls: sitemapUrls.length,
  preservedUnmappedSitemapUrls: unmappedSitemapUrls,
  missingSixLanguagePages: localizedLanguageKeys.length * missingSixLanguageRoutes.size,
  plannedFrenchPortuguesePages: 152,
  currentLanguageMenus: languageMenuCount,
  currentHreflangPages: hreflangPageCount,
  generatorDryRunChanges: generation.changedDocuments,
  templateGaps: generation.missingLanguageMenus,
  resolvedRouteDecisions,
  warnings,
};

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
console.log("CHIGOX Phase 1A i18n validation passed.");

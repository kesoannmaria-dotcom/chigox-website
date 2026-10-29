import fs from "node:fs";
import path from "node:path";
import {
  SITE_ORIGIN,
  absoluteUrl,
  corePageDefinitions,
  knownRouteAnomalies,
  languages,
  localizedPath,
  localizedLanguageKeys,
  missingSixLanguageRoutes,
  pageDefinitions,
  phase1CRoutes,
  publishedLanguageKeys,
  resolvedRouteDecisions,
  translationStatus,
} from "./page-map.mjs";
import { collectPublishedDocuments, fileFor, runGeneration } from "./generate-language-metadata.mjs";
import { collectCoreSourceStrings, collectSourceStrings, generateCoreLocales } from "./core-localization.mjs";
import { generatePhase1CLocales } from "./generate-phase1c-locales.mjs";
import { compareProtectedTechnicalContent, terminology } from "./translation-rules.mjs";

const root = process.cwd();
const errors = [];
const warnings = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const read = (relativeFile) => fs.readFileSync(path.join(root, relativeFile), "utf8");
const countLiteral = (value, token) => value.split(token).length - 1;

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
assert(documents.length === 684, `published canonical documents: expected 684, found ${documents.length}`);

for (const document of documents) {
  const html = read(document.relativeFile);
  const expectedCanonical = absoluteUrl(document.languageKey, document.definition.route);
  assert(html.includes(`<link rel="canonical" href="${expectedCanonical}">`), `${document.relativeFile}: canonical mismatch`);
  assert(html.includes(`<html lang="${languages[document.languageKey].htmlLang}">`), `${document.relativeFile}: html lang mismatch`);
  assert(countLiteral(html, "<main>") + countLiteral(html, "<main ") === 1, `${document.relativeFile}: expected one main element`);
  assert(countLiteral(html, "</main>") === 1, `${document.relativeFile}: main element is not closed exactly once`);
  assert(countLiteral(html, "<footer>") + countLiteral(html, "<footer ") === 1, `${document.relativeFile}: expected one footer element`);
  assert(countLiteral(html, "</footer>") === 1, `${document.relativeFile}: footer element is not closed exactly once`);
}

const sitemap = read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapSet = new Set(sitemapUrls);
assert(sitemapSet.size === sitemapUrls.length, "sitemap: duplicate URL");
for (const document of documents) {
  const expected = absoluteUrl(document.languageKey, document.definition.route);
  assert(sitemapSet.has(expected), `sitemap: missing ${expected}`);
}

const mappedUrls = new Set(pageDefinitions.flatMap((definition) => publishedLanguageKeys
  .filter((languageKey) => translationStatus(definition.key, languageKey) === "published")
  .map((languageKey) => absoluteUrl(languageKey, definition.route))));
const unmappedSitemapUrls = sitemapUrls.filter((url) => !mappedUrls.has(url));
assert(unmappedSitemapUrls.length === 0, `sitemap: expected no unmapped routes, found ${unmappedSitemapUrls.length}`);

for (const languageKey of ["fr", "pt"]) {
  assert(fs.existsSync(path.join(root, languages[languageKey].prefix)), `${languageKey}: core language directory is missing`);
  for (const definition of corePageDefinitions) {
    const relativeFile = fileFor(languageKey, definition.route);
    assert(fs.existsSync(path.join(root, relativeFile)), `${languageKey}: missing core page ${relativeFile}`);
    assert(sitemapSet.has(absoluteUrl(languageKey, definition.route)), `${languageKey}: sitemap missing ${definition.route}`);
  }
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
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  const canonicalDefinition = canonical
    ? corePageDefinitions.find((definition) => publishedLanguageKeys.some((languageKey) => absoluteUrl(languageKey, definition.route) === canonical))
    : null;
  if (html.includes('class="language-menu"')) {
    languageMenuCount += 1;
    const languageMenu = html.match(/<details class="language-menu">[\s\S]*?<\/details>/)?.[0] ?? "";
    if (canonicalDefinition) {
      assert(!languageMenu.includes('data-language-coming-soon="true"'), `${relativeFile}: enabled language still uses a coming-soon placeholder`);
      assert(!languageMenu.includes('data-language-fallback="true"'), `${relativeFile}: complete language site still uses a fallback target`);
      assert(languageMenu.includes(`href="${localizedPath("fr", canonicalDefinition.route)}"`), `${relativeFile}: exact French language target missing`);
      assert(languageMenu.includes(`href="${localizedPath("pt", canonicalDefinition.route)}"`), `${relativeFile}: exact Portuguese language target missing`);
    }
  }

  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
  if (alternates.length) hreflangPageCount += 1;
  assert(!alternates.some((match) => match[1] === "pt"), `${relativeFile}: Brazilian Portuguese hreflang must use pt-BR`);

  if (canonicalDefinition) {
    assert(alternates.some((match) => match[1] === "fr" && match[2] === absoluteUrl("fr", canonicalDefinition.route)), `${relativeFile}: French hreflang missing`);
    assert(alternates.some((match) => match[1] === "pt-BR" && match[2] === absoluteUrl("pt", canonicalDefinition.route)), `${relativeFile}: pt-BR hreflang missing`);
  }

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
assert(hreflangPageCount === 684, `hreflang regression: expected 684 published pages, found ${hreflangPageCount}`);
assert(missingSixLanguageRoutes.size === 0, "six-language canonical coverage is incomplete");
assert(phase1CRoutes.size === 15, "Phase 1C route scope changed");

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
    assert((html.match(/data-language-fallback="true"/g) ?? []).length === 0, `${definition.route}: completed language page still uses fallbacks`);
  }
}

const generation = runGeneration({ root, write: false });
assert(generation.plannedDocuments === 0, `FR/PT documents: expected no planned documents, found ${generation.plannedDocuments}`);
assert(generation.sitemapMappedUrls === 684, `sitemap generator: expected 684 mapped URLs, found ${generation.sitemapMappedUrls}`);
assert(generation.sitemapPreservedUnmappedUrls.length === 0, "sitemap generator: unresolved URLs remain outside the page map");
assert(generation.changedDocuments === 0, `metadata generator: expected deterministic output, found ${generation.changedDocuments} changes`);

const sourceStrings = collectCoreSourceStrings(root);
const translationReview = {};
for (const languageKey of ["fr", "pt"]) {
  const catalog = JSON.parse(read(`scripts/i18n/translations/core-${languageKey}.json`));
  assert(Object.keys(catalog).length === sourceStrings.length, `${languageKey}: translation catalog size mismatch`);
  for (const source of sourceStrings) {
    const translation = catalog[source];
    assert(Boolean(translation), `${languageKey}: missing translation for ${source}`);
    if (!translation) continue;
    const technical = compareProtectedTechnicalContent(source, translation);
    assert(!technical.missing.length && !technical.unexpected.length, `${languageKey}: protected technical content changed for ${source}`);
    assert(!/ZXQTECH|CHIGOX-\d{4}/i.test(translation), `${languageKey}: translation placeholder leaked for ${source}`);
  }
  for (const key of Object.keys(terminology.en)) {
    assert(catalog[terminology.en[key]] === terminology[languageKey][key], `${languageKey}: approved terminology mismatch for ${key}`);
  }
  translationReview[languageKey] = Object.entries(catalog)
    .filter(([source, translation]) => source === translation && /[a-z]{3}/i.test(source))
    .map(([source]) => source);
}

const localizedGeneration = generateCoreLocales({ root, write: false });
assert(localizedGeneration.languages.fr.changed === 0, "fr: core page generation is not deterministic");
assert(localizedGeneration.languages.pt.changed === 0, "pt: core page generation is not deterministic");

const phase1CDefinitions = pageDefinitions.filter(({ route }) => phase1CRoutes.has(route));
const phase1CSourceStrings = collectSourceStrings(root, phase1CDefinitions);
for (const languageKey of localizedLanguageKeys) {
  const catalog = JSON.parse(read(`scripts/i18n/translations/phase1c-${languageKey}.json`));
  for (const source of phase1CSourceStrings) {
    const translation = catalog[source];
    assert(Boolean(translation), `${languageKey}: missing Phase 1C translation for ${source}`);
    if (!translation) continue;
    const technical = compareProtectedTechnicalContent(source, translation);
    assert(!technical.missing.length && !technical.unexpected.length, `${languageKey}: Phase 1C protected technical content changed for ${source}`);
    assert(!/ZXQTECH|CHIGOX-\d{4}/i.test(translation), `${languageKey}: Phase 1C translation placeholder leaked for ${source}`);
  }
  for (const key of Object.keys(terminology.en)) {
    assert(catalog[terminology.en[key]] === terminology[languageKey][key], `${languageKey}: Phase 1C terminology mismatch for ${key}`);
  }
}

const phase1CGeneration = generatePhase1CLocales({ root, write: false });
for (const languageKey of localizedLanguageKeys) {
  assert(phase1CGeneration.languages[languageKey].changedPages === 0, `${languageKey}: Phase 1C page generation is not deterministic`);
}

for (const anomaly of knownRouteAnomalies) warnings.push(`${anomaly.severity}: ${anomaly.id} - ${anomaly.detail}`);
for (const file of generation.missingLanguageMenus) warnings.push(`template-gap: ${file} has no language selector to update`);

const report = {
  canonicalPages: pageDefinitions.length,
  publishedCanonicalDocuments: documents.length,
  currentSitemapUrls: sitemapUrls.length,
  preservedUnmappedSitemapUrls: unmappedSitemapUrls,
  missingSixLanguagePages: localizedLanguageKeys.length * missingSixLanguageRoutes.size,
  publishedPhase1CPages: localizedLanguageKeys.length * phase1CRoutes.size,
  publishedFrenchPortuguesePages: 152,
  publishedFrenchPortugueseBlogArticles: 18,
  currentLanguageMenus: languageMenuCount,
  currentHreflangPages: hreflangPageCount,
  generatorDryRunChanges: generation.changedDocuments,
  translationReview,
  templateGaps: generation.missingLanguageMenus,
  resolvedRouteDecisions,
  warnings,
};

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
console.log("CHIGOX Phase 1C i18n validation passed.");

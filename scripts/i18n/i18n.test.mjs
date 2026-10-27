import test from "node:test";
import assert from "node:assert/strict";
import {
  exactPublishedAlternates,
  corePageDefinitions,
  languages,
  missingSixLanguageRoutes,
  pageDefinitions,
  resolveLanguageTarget,
  translationStatus,
} from "./page-map.mjs";
import { renderHreflang, renderLanguageMenu, runGeneration, updateHreflang, updateLanguageMenu } from "./generate-language-metadata.mjs";
import { collectCoreSourceStrings, generateCoreLocales } from "./core-localization.mjs";
import { assertProtectedTechnicalContent, compareProtectedTechnicalContent, terminology } from "./translation-rules.mjs";
import { applyBlogTranslationReview } from "./blog-translation-overrides.mjs";

test("page map includes the Phase 1A canonical decisions", () => {
  assert.equal(pageDefinitions.length, 76);
  assert.equal(missingSixLanguageRoutes.size, 15);
  assert.equal(pageDefinitions.filter(({ type }) => type === "blog-article").length, 9);
  assert.equal(pageDefinitions.filter(({ route }) => route.startsWith("/applications/")).length, 0);
  assert.equal(translationStatus("convex-transvaginal-scanner", "es"), "published");
  assert.equal(resolveLanguageTarget("cgu-03", "en").pageKey, "cgu-03");
  assert.equal(resolveLanguageTarget("cgvet-a220t", "es").pageKey, "veterinary");
});

test("FR and PT-BR sites are complete while their menu entries stay disabled", () => {
  assert.equal(languages.fr.enabled, false);
  assert.equal(languages.pt.enabled, false);
  assert.equal(languages.pt.code, "pt-BR");
  assert.equal(translationStatus("home", "fr"), "published");
  assert.equal(translationStatus("blog-rigid-endoscope-guide", "fr"), "published");
  assert.equal(resolveLanguageTarget("home", "pt").kind, "disabled");
});

test("missing translations use a safe category fallback", () => {
  assert.deepEqual(resolveLanguageTarget("cgvet-30", "es"), {
    languageKey: "es",
    status: "published",
    kind: "fallback",
    path: "/es/products/veterinary/",
    pageKey: "veterinary",
  });
  assert.equal(resolveLanguageTarget("blog-rigid-endoscope-guide", "de").path, "/de/blog/");
});

test("hreflang contains exact translations only, never fallback pages", () => {
  const missingAlternates = exactPublishedAlternates("cgvet-30");
  assert.deepEqual(missingAlternates.map(({ hreflang }) => hreflang), ["en", "fr", "pt-BR", "x-default"]);
  const completeAlternates = exactPublishedAlternates("cge-100");
  assert.deepEqual(completeAlternates.map(({ hreflang }) => hreflang), ["en", "es", "tr", "de", "it", "pl", "ko", "fr", "pt-BR", "x-default"]);
});

test("language menu keeps FR/PT hidden and marks safe fallbacks", () => {
  const menu = renderLanguageMenu("cgvet-30", "en");
  assert.match(menu, /data-language-coming-soon="true"/);
  assert.match(menu, /href="\/es\/products\/veterinary\/" data-language-fallback="true"/);
  assert.doesNotMatch(menu, /href="\/(?:fr|pt)\//);
});

test("metadata updates are deterministic", () => {
  const source = '<head>\n  <link rel="canonical" href="https://www.chigox.com/">\n</head>\n<details class="language-menu"><summary>Old</summary><div></div></details>';
  const once = updateHreflang(source, "home");
  const twice = updateHreflang(once, "home");
  assert.equal(once, twice);
  assert.equal((renderHreflang("home").match(/hreflang=/g) ?? []).length, 10);
  const menu = updateLanguageMenu(once, "home", "en");
  assert.equal(menu.updated, true);
  assert.match(menu.html, /aria-current="true"/);
});

test("technical specifications and model identifiers are protected", () => {
  const source = "CGE-100 Full HD 1080P, 3.5 MHz, 12 mm, ISO 13485.";
  const valid = "CGE-100 Full HD 1080P, fréquence 3.5 MHz, diamètre 12 mm, ISO 13485.";
  assert.doesNotThrow(() => assertProtectedTechnicalContent(source, valid, "fr/cge-100"));
  const changed = "CGE-200 Full HD 720P, fréquence 5 MHz, diamètre 10 mm, ISO 9001.";
  const result = compareProtectedTechnicalContent(source, changed);
  assert.ok(result.missing.length > 0);
  assert.throws(() => assertProtectedTechnicalContent(source, changed));
});

test("terminology exists for all nine languages", () => {
  assert.deepEqual(Object.keys(terminology), ["en", "es", "tr", "de", "it", "pl", "ko", "fr", "pt"]);
  for (const terms of Object.values(terminology)) assert.equal(Object.keys(terms).length, 12);
});

test("Blog review distinguishes endoscopes from commercial scope", () => {
  const reviewed = applyBlogTranslationReview({
    "One scope for the clinic": "Um osciloscópio para a clínica",
    "Quotation scope": "Escopo da cotação",
    "Start with Case Mix, Not the Quotation Sheet": "Case Mix",
  }, "pt");
  assert.equal(reviewed["One scope for the clinic"], "Um endoscópio para a clínica");
  assert.equal(reviewed["Quotation scope"], "Escopo da cotação");
  assert.equal(reviewed["Start with Case Mix, Not the Quotation Sheet"], "Comece pelo perfil dos casos clínicos, não pela folha de cotação");
});

test("Phase 1B metadata generation is deterministic", () => {
  const report = runGeneration({ root: process.cwd(), write: false });
  assert.equal(report.mode, "dry-run");
  assert.equal(report.canonicalPages, 76);
  assert.equal(report.publishedDocuments, 594);
  assert.equal(report.plannedDocuments, 0);
  assert.equal(report.changedDocuments, 0);
  assert.deepEqual(report.missingLanguageMenus, []);
  assert.deepEqual(report.sitemapPreservedUnmappedUrls, []);
});

test("FR and PT-BR full-site generation is complete and deterministic", () => {
  assert.equal(corePageDefinitions.length, 76);
  assert.equal(collectCoreSourceStrings(process.cwd()).length, 2160);
  const report = generateCoreLocales({ root: process.cwd(), write: false });
  assert.equal(report.languages.fr.pages, 76);
  assert.equal(report.languages.pt.pages, 76);
  assert.equal(report.languages.fr.changed, 0);
  assert.equal(report.languages.pt.changed, 0);
});

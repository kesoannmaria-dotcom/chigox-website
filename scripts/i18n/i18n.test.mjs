import test from "node:test";
import assert from "node:assert/strict";
import {
  exactPublishedAlternates,
  corePageDefinitions,
  languages,
  missingSixLanguageRoutes,
  pageDefinitions,
  phase1CRoutes,
  resolveLanguageTarget,
  translationStatus,
} from "./page-map.mjs";
import {
  renderBlogNavigationLink,
  renderHreflang,
  renderLanguageMenu,
  runGeneration,
  updateBlogNavigation,
  updateHreflang,
  updateLanguageMenu,
} from "./generate-language-metadata.mjs";
import { collectCoreSourceStrings, generateCoreLocales } from "./core-localization.mjs";
import { assertProtectedTechnicalContent, compareProtectedTechnicalContent, terminology } from "./translation-rules.mjs";
import { applyBlogTranslationReview } from "./blog-translation-overrides.mjs";
import { applyPhase1CTranslationReview } from "./phase1c-translation-overrides.mjs";
import { generatePhase1CLocales } from "./generate-phase1c-locales.mjs";
import { blogLanguageKeys, collectBlogSourceStrings, loadBlogCatalog } from "./blog-localization.mjs";

test("page map includes the Phase 1A canonical decisions", () => {
  assert.equal(pageDefinitions.length, 76);
  assert.equal(phase1CRoutes.size, 15);
  assert.equal(missingSixLanguageRoutes.size, 0);
  assert.equal(pageDefinitions.filter(({ type }) => type === "blog-article").length, 9);
  assert.equal(pageDefinitions.filter(({ route }) => route.startsWith("/applications/")).length, 0);
  assert.equal(translationStatus("convex-transvaginal-scanner", "es"), "published");
  assert.equal(resolveLanguageTarget("cgu-03", "en").pageKey, "cgu-03");
  assert.equal(resolveLanguageTarget("cgvet-a220t", "es").pageKey, "cgvet-a220t");
});

test("FR and PT-BR sites are complete and enabled in the language menu", () => {
  assert.equal(languages.fr.enabled, true);
  assert.equal(languages.pt.enabled, true);
  assert.equal(languages.pt.code, "pt-BR");
  assert.equal(translationStatus("home", "fr"), "published");
  assert.equal(translationStatus("blog-rigid-endoscope-guide", "fr"), "published");
  assert.equal(resolveLanguageTarget("home", "pt").kind, "exact");
});

test("Phase 1C pages resolve to exact same-page translations", () => {
  assert.deepEqual(resolveLanguageTarget("cgvet-30", "es"), {
    languageKey: "es",
    status: "published",
    kind: "exact",
    path: "/es/products/veterinary/vet-anesthesia-machine/cgvet-30/",
    pageKey: "cgvet-30",
  });
  assert.equal(resolveLanguageTarget("blog-rigid-endoscope-guide", "de").path, "/de/blog/rigid-endoscope-buying-guide/");
});

test("hreflang contains all nine exact translations", () => {
  const phase1CAlternates = exactPublishedAlternates("cgvet-30");
  assert.deepEqual(phase1CAlternates.map(({ hreflang }) => hreflang), ["en", "es", "tr", "de", "it", "pl", "ko", "fr", "pt-BR", "x-default"]);
  const completeAlternates = exactPublishedAlternates("cge-100");
  assert.deepEqual(completeAlternates.map(({ hreflang }) => hreflang), ["en", "es", "tr", "de", "it", "pl", "ko", "fr", "pt-BR", "x-default"]);
});

test("language menu links all nine languages to exact pages", () => {
  const menu = renderLanguageMenu("cgvet-30", "en");
  assert.doesNotMatch(menu, /data-language-coming-soon="true"/);
  assert.match(menu, /href="\/es\/products\/veterinary\/vet-anesthesia-machine\/cgvet-30\/"/);
  assert.match(menu, /href="\/fr\/products\/veterinary\/vet-anesthesia-machine\/cgvet-30\/"/);
  assert.match(menu, /href="\/pt\/products\/veterinary\/vet-anesthesia-machine\/cgvet-30\/"/);
  assert.doesNotMatch(menu, /data-language-fallback/);
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

test("localized Blog navigation is unique and placed before Contact", () => {
  const definition = pageDefinitions.find(({ key }) => key === "blog-rigid-endoscope-guide");
  const source = `<nav class="main-nav"><a href="/es/about-us/">Sobre nosotros</a>\n      <a href="/es/contact-us/">Contáctenos</a>\n      <a href="/es/blog/">Blog</a>\n      <details class="language-menu"><summary>Idioma</summary><div class="language-list"><a href="/es/blog/">Español</a></div></details></nav>`;
  const result = updateBlogNavigation(source, definition, "es");
  const beforeLanguageMenu = result.html.slice(0, result.html.indexOf('<details class="language-menu">'));
  assert.equal((beforeLanguageMenu.match(/href="\/es\/blog\/"/g) ?? []).length, 1);
  assert.ok(beforeLanguageMenu.indexOf('href="/es/about-us/"') < beforeLanguageMenu.indexOf('href="/es/blog/"'));
  assert.ok(beforeLanguageMenu.indexOf('href="/es/blog/"') < beforeLanguageMenu.indexOf('href="/es/contact-us/"'));
  assert.match(renderBlogNavigationLink(definition, "es"), /aria-current="page"/);
  assert.equal(updateBlogNavigation(result.html, definition, "es").html, result.html);
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

test("Phase 1C review normalizes medical-device terminology", () => {
  assert.equal(
    applyPhase1CTranslationReview({ probe: "Sonda de matriz en fase" }, "es").probe,
    "Sonda de matriz faseada",
  );
  assert.equal(
    applyPhase1CTranslationReview({ probe: "Dışbükey ve aşamalı dizi prob" }, "tr").probe,
    "Konveks ve faz dizilimli prob",
  );
  assert.equal(
    applyPhase1CTranslationReview({ product: "Tragbares tragbares Veterinär-Röntgensystem" }, "de").product,
    "Tragbares handgeführtes Veterinär-Röntgensystem",
  );
  assert.equal(
    applyPhase1CTranslationReview({ product: "클리닉용 수의사 마취기" }, "ko").product,
    "클리닉용 수의 마취기",
  );
});

test("Blog catalogs translate complete strings and preserve reviewed terminology", () => {
  const sources = collectBlogSourceStrings(process.cwd());
  assert.equal(sources.length, 625);
  for (const languageKey of blogLanguageKeys) {
    const catalog = loadBlogCatalog(process.cwd(), languageKey);
    assert.equal(Object.keys(catalog).length, sources.length);
    assert.ok(sources.every((source) => catalog[source]));
  }
  const polish = loadBlogCatalog(process.cwd(), "pl");
  assert.equal(polish["Buyer Guide"], "Przewodnik kupującego");
  assert.match(polish["Portable Veterinary Ultrasound: What Distributors Need to Know Before Importing"], /ultrasonograf weterynaryjny/i);
  assert.doesNotMatch(polish["Handheld Ultrasound Probe Types: Linear vs Convex vs Phased Array — Buyer Selection Guide"], /Faza Array|Wypukła/i);
});

test("Phase 1B metadata generation is deterministic", () => {
  const report = runGeneration({ root: process.cwd(), write: false });
  assert.equal(report.mode, "dry-run");
  assert.equal(report.canonicalPages, 76);
  assert.equal(report.publishedDocuments, 684);
  assert.equal(report.plannedDocuments, 0);
  assert.equal(report.changedDocuments, 0);
  assert.deepEqual(report.missingLanguageMenus, []);
  assert.deepEqual(report.missingBlogNavigationAnchors, []);
  assert.deepEqual(report.sitemapPreservedUnmappedUrls, []);
});

test("Phase 1C six-language generation is complete and deterministic", () => {
  const report = generatePhase1CLocales({ root: process.cwd(), write: false });
  assert.equal(report.routes, 15);
  for (const languageKey of ["es", "tr", "de", "it", "pl", "ko"]) {
    assert.equal(report.languages[languageKey].generatedPages, 15);
    assert.equal(report.languages[languageKey].blogIndexPages, 1);
    assert.equal(report.languages[languageKey].changedPages, 0);
    assert.equal(report.languages[languageKey].localizedExistingLinks, 0);
  }
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

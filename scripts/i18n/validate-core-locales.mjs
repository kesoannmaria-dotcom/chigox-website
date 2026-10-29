import fs from "node:fs";
import path from "node:path";
import {
  SITE_ORIGIN,
  absoluteUrl,
  corePageDefinitions,
  languages,
  localizedPath,
} from "./page-map.mjs";
import { fileFor } from "./generate-language-metadata.mjs";
import { compareProtectedTechnicalContent } from "./translation-rules.mjs";

const root = process.cwd();
const errors = [];
const stats = { pages: 0, links: 0, assets: 0, forms: 0 };
const assert = (condition, message) => { if (!condition) errors.push(message); };
const read = (relativeFile) => fs.readFileSync(path.join(root, relativeFile), "utf8");
const coreRoutes = new Set(corePageDefinitions.map(({ route }) => route));

function fileForPathname(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/^\//, "");
  if (!decoded) return "index.html";
  return pathname.endsWith("/") ? `${decoded}index.html` : decoded;
}

function validateLocalReference(rawValue, sourceRoute, relativeFile, kind) {
  if (!rawValue || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(rawValue)) return;
  let url;
  try {
    url = new URL(rawValue, `${SITE_ORIGIN}${sourceRoute}`);
  } catch {
    errors.push(`${relativeFile}: invalid ${kind} URL ${rawValue}`);
    return;
  }
  if (url.origin !== SITE_ORIGIN || url.pathname.startsWith("/api/")) return;
  const targetFile = fileForPathname(url.pathname);
  assert(fs.existsSync(path.join(root, targetFile)), `${relativeFile}: missing ${kind} target ${url.pathname}`);
}

const forbiddenVisibleEnglish = {
  fr: ["Home", "Products", "About Us", "Contact Us", "Request Quote", "Send Inquiry", "Product Overview", "Key Features", "Basic Information", "Technical Specifications", "All Products"],
  pt: ["Home", "Products", "About Us", "Contact Us", "Request Quote", "Send Inquiry", "Product Overview", "Key Features", "Basic Information", "Technical Specifications", "All Products", "Applications"],
};
const forbiddenTranslationArtifacts = {
  fr: [/ZXQTECH/i, /CHIGOX-\d{4}/i, /\boscilloscopes?\b/i, /mélange d'examens/i, /preuves de sites vérifiés/i],
  pt: [/ZXQTECH/i, /CHIGOX-\d{4}/i, /\bosciloscópios?\b/i, /\bCase Mix\b/i, /estratégia de investigação/i, /evidências verificadas do site/i],
};

for (const languageKey of ["fr", "pt"]) {
  for (const definition of corePageDefinitions) {
    const relativeFile = fileFor(languageKey, definition.route);
    const html = read(relativeFile);
    const sourceHtml = read(definition.route === "/" ? "index.html" : `${definition.route.slice(1)}index.html`);
    stats.pages += 1;

    assert(html.includes(`<html lang="${languages[languageKey].htmlLang}">`), `${relativeFile}: html lang mismatch`);
    assert(html.includes(`<link rel="canonical" href="${absoluteUrl(languageKey, definition.route)}">`), `${relativeFile}: canonical mismatch`);
    assert(html.includes(`hreflang="fr" href="${absoluteUrl("fr", definition.route)}"`), `${relativeFile}: French hreflang mismatch`);
    assert(html.includes(`hreflang="pt-BR" href="${absoluteUrl("pt", definition.route)}"`), `${relativeFile}: pt-BR hreflang mismatch`);
    const structuredPageUrls = [...html.matchAll(/"mainEntityOfPage":"([^"]+)"/g)].map((match) => match[1]);
    assert(structuredPageUrls.every((url) => url === absoluteUrl(languageKey, definition.route)), `${relativeFile}: structured page URL mismatch`);
    assert((html.match(/<h1\b/gi) ?? []).length === (sourceHtml.match(/<h1\b/gi) ?? []).length, `${relativeFile}: h1 structure changed`);
    assert(!/ZXQTECH|CHIGOX-\d{4}/i.test(html), `${relativeFile}: placeholder artifact found`);

    const technical = compareProtectedTechnicalContent(sourceHtml, html);
    assert(!technical.missing.length && !technical.unexpected.length, `${relativeFile}: protected technical values changed`);

    const withoutScripts = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
    for (const pattern of forbiddenTranslationArtifacts[languageKey]) {
      assert(!pattern.test(withoutScripts), `${relativeFile}: rejected translation artifact ${pattern}`);
    }
    for (const phrase of forbiddenVisibleEnglish[languageKey]) {
      assert(!new RegExp(`>\\s*${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*<`, "i").test(withoutScripts), `${relativeFile}: untranslated UI phrase ${phrase}`);
    }

    const menu = html.match(/<details class="language-menu">[\s\S]*?<\/details>/)?.[0] ?? "";
    assert(!menu.includes('data-language-coming-soon="true"'), `${relativeFile}: enabled FR/PT language entry still marked coming soon`);
    assert(menu.includes(`href="${localizedPath("fr", definition.route)}"`), `${relativeFile}: exact French language target missing`);
    assert(menu.includes(`href="${localizedPath("pt", definition.route)}"`), `${relativeFile}: exact Portuguese language target missing`);

    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)) {
      stats.links += 1;
      validateLocalReference(match[1], localizedPath(languageKey, definition.route), relativeFile, "link");
    }
    for (const match of html.matchAll(/<(?:img|script|link)\b[^>]*\b(?:src|href)="([^"]+)"[^>]*>/gi)) {
      stats.assets += 1;
      validateLocalReference(match[1], localizedPath(languageKey, definition.route), relativeFile, "asset");
    }
    for (const match of html.matchAll(/<form\b[^>]*\baction="([^"]+)"[^>]*>/gi)) {
      stats.forms += 1;
      validateLocalReference(match[1], localizedPath(languageKey, definition.route), relativeFile, "form action");
    }

    const withoutLanguageMenu = html.replace(/<details class="language-menu">[\s\S]*?<\/details>/g, "");
    for (const anchor of withoutLanguageMenu.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)) {
      const value = anchor[1];
      if (!value.startsWith("/")) continue;
      const target = new URL(value, SITE_ORIGIN).pathname;
      if (coreRoutes.has(target)) errors.push(`${relativeFile}: core link escaped ${languageKey} locale (${target})`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify(stats, null, 2));
console.log("CHIGOX FR/PT full-site locale validation passed.");

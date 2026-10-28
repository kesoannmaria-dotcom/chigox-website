import fs from "node:fs";
import path from "node:path";
import {
  SITE_ORIGIN,
  absoluteUrl,
  languages,
  localizedLanguageKeys,
  localizedPath,
  pageDefinitions,
  phase1CRoutes,
} from "./page-map.mjs";
import { fileFor } from "./generate-language-metadata.mjs";
import { compareProtectedTechnicalContent } from "./translation-rules.mjs";

const root = process.cwd();
const errors = [];
const stats = { pages: 0, phase1CPages: 0, links: 0, assets: 0, forms: 0 };
const assert = (condition, message) => { if (!condition) errors.push(message); };
const read = (relativeFile) => fs.readFileSync(path.join(root, relativeFile), "utf8");
const canonicalRoutes = new Set(pageDefinitions.map(({ route }) => route));
const forbiddenVisibleEnglish = [
  "Home", "Products", "About Us", "Contact Us", "Request Quote", "Send Inquiry",
  "Product Overview", "Key Features", "Basic Information", "Technical Specifications", "All Products",
];

function mainContent(html) {
  const match = html.match(/<main(?:\s[^>]*)?>[\s\S]*?<\/main>/i);
  return match?.[0] ?? html;
}

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
  assert(fs.existsSync(path.join(root, fileForPathname(url.pathname))), `${relativeFile}: missing ${kind} target ${url.pathname}`);
}

for (const languageKey of localizedLanguageKeys) {
  for (const definition of pageDefinitions) {
    const relativeFile = fileFor(languageKey, definition.route);
    assert(fs.existsSync(path.join(root, relativeFile)), `${languageKey}: missing canonical page ${relativeFile}`);
    if (!fs.existsSync(path.join(root, relativeFile))) continue;
    const html = read(relativeFile);
    const sourceFile = definition.route === "/" ? "index.html" : `${definition.route.slice(1)}index.html`;
    const sourceHtml = read(sourceFile);
    stats.pages += 1;
    if (phase1CRoutes.has(definition.route)) stats.phase1CPages += 1;

    assert(html.includes(`<html lang="${languages[languageKey].htmlLang}">`), `${relativeFile}: html lang mismatch`);
    assert(html.includes(`<link rel="canonical" href="${absoluteUrl(languageKey, definition.route)}">`), `${relativeFile}: canonical mismatch`);
    for (const alternateKey of ["en", ...localizedLanguageKeys, "fr", "pt"]) {
      assert(html.includes(`hreflang="${languages[alternateKey].code}" href="${absoluteUrl(alternateKey, definition.route)}"`), `${relativeFile}: ${languages[alternateKey].code} hreflang mismatch`);
    }
    assert(html.includes(`hreflang="x-default" href="${absoluteUrl("en", definition.route)}"`), `${relativeFile}: x-default mismatch`);

    const menu = html.match(/<details class="language-menu">[\s\S]*?<\/details>/)?.[0] ?? "";
    assert((menu.match(/data-language-coming-soon="true"/g) ?? []).length === 2, `${relativeFile}: FR/PT entries must remain hidden`);
    assert(!menu.includes("data-language-fallback"), `${relativeFile}: completed language menu still contains a fallback`);
    assert(!/<a href="\/(?:fr|pt)\//.test(menu), `${relativeFile}: FR/PT menu entries must not be clickable`);

    const withoutScripts = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
    if (phase1CRoutes.has(definition.route)) {
      const technical = compareProtectedTechnicalContent(mainContent(sourceHtml), mainContent(html));
      assert(!technical.missing.length && !technical.unexpected.length, `${relativeFile}: protected technical values changed`);
      assert(!/ZXQTECH|CHIGOX-\d{4}/i.test(html), `${relativeFile}: translation placeholder leaked`);
      for (const phrase of forbiddenVisibleEnglish) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert(!new RegExp(`>\\s*${escaped}\\s*<`, "i").test(withoutScripts), `${relativeFile}: untranslated UI phrase ${phrase}`);
      }
      const sourceHasFaq = sourceHtml.includes('class="article-faq"');
      assert(!sourceHasFaq || html.includes('class="article-faq"'), `${relativeFile}: translated FAQ missing`);
    }

    const structuredPageUrls = [...html.matchAll(/"mainEntityOfPage":"([^"]+)"/g)].map((match) => match[1]);
    assert(structuredPageUrls.every((url) => url === absoluteUrl(languageKey, definition.route)), `${relativeFile}: structured page URL mismatch`);

    const withoutLanguageMenu = html.replace(/<details class="language-menu">[\s\S]*?<\/details>/g, "");
    for (const match of withoutLanguageMenu.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)) {
      const value = match[1];
      stats.links += 1;
      validateLocalReference(value, localizedPath(languageKey, definition.route), relativeFile, "link");
      if (!value.startsWith("/")) continue;
      const target = new URL(value, SITE_ORIGIN).pathname;
      assert(!canonicalRoutes.has(target), `${relativeFile}: canonical link escaped ${languageKey} locale (${target})`);
    }
    for (const match of html.matchAll(/<(?:img|script|link)\b[^>]*\b(?:src|href)="([^"]+)"[^>]*>/gi)) {
      stats.assets += 1;
      validateLocalReference(match[1], localizedPath(languageKey, definition.route), relativeFile, "asset");
    }
    for (const match of html.matchAll(/<form\b[^>]*\baction="([^"]+)"[^>]*>/gi)) {
      stats.forms += 1;
      validateLocalReference(match[1], localizedPath(languageKey, definition.route), relativeFile, "form action");
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify(stats, null, 2));
console.log("CHIGOX Phase 1C six-language validation passed.");

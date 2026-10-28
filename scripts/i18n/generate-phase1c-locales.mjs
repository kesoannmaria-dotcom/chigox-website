import fs from "node:fs";
import path from "node:path";
import {
  localizeMappedDocumentLinks,
  localizePageHtml,
} from "./core-localization.mjs";
import { fileFor } from "./generate-language-metadata.mjs";
import {
  localizedLanguageKeys,
  pageDefinitions,
  phase1CRoutes,
} from "./page-map.mjs";

const phase1CDefinitions = pageDefinitions.filter(({ route }) => phase1CRoutes.has(route));

function sourceFileFor(route) {
  return route === "/" ? "index.html" : `${route.slice(1)}index.html`;
}

function extractBalancedDetails(html, className) {
  const opening = new RegExp(`<details\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, "i").exec(html);
  if (!opening) return null;
  const tokenPattern = /<details\b[^>]*>|<\/details>/gi;
  tokenPattern.lastIndex = opening.index;
  let depth = 0;
  for (let token = tokenPattern.exec(html); token; token = tokenPattern.exec(html)) {
    if (/^<details\b/i.test(token[0])) depth += 1;
    else depth -= 1;
    if (depth === 0) return html.slice(opening.index, tokenPattern.lastIndex);
  }
  throw new Error(`Unbalanced <details> block for ${className}`);
}

function productMenuFor(root, languageKey, route) {
  const home = fs.readFileSync(path.join(root, languageKey, "index.html"), "utf8");
  const menu = extractBalancedDetails(home, "product-menu");
  if (!menu) throw new Error(`${languageKey}: Products mega menu not found`);
  return menu.replace(/<summary(?:\s+aria-current="page")?>/i, route.startsWith("/products/")
    ? '<summary aria-current="page">'
    : "<summary>");
}

function injectProductMenu(html, root, languageKey, route) {
  const menu = productMenuFor(root, languageKey, route);
  const existing = extractBalancedDetails(html, "product-menu");
  if (existing) return html.replace(existing, menu);
  const productsLink = new RegExp(`<a\\b(?=[^>]*\\bhref="/${languageKey}/products/")[^>]*>[^<]*<\\/a>`, "i");
  if (!productsLink.test(html)) throw new Error(`${languageKey}:${route}: Products navigation item not found`);
  return html.replace(productsLink, menu);
}

export function generatePhase1CLocales({ root = process.cwd(), write = false } = {}) {
  const report = { mode: write ? "write" : "dry-run", routes: phase1CDefinitions.length, languages: {} };

  for (const languageKey of localizedLanguageKeys) {
    const catalogFile = path.join(root, "scripts", "i18n", "translations", `phase1c-${languageKey}.json`);
    if (!fs.existsSync(catalogFile)) throw new Error(`Missing Phase 1C translation catalog: ${catalogFile}`);
    const catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
    const expectedByFile = new Map();
    const languageReport = { generatedPages: 0, changedPages: 0, localizedExistingLinks: 0, missingCatalogEntries: 0 };

    for (const definition of phase1CDefinitions) {
      const sourceFile = path.join(root, sourceFileFor(definition.route));
      const targetRelative = fileFor(languageKey, definition.route);
      const localized = localizePageHtml(fs.readFileSync(sourceFile, "utf8"), definition, languageKey, catalog);
      const expected = injectProductMenu(localized, root, languageKey, definition.route);
      expectedByFile.set(targetRelative, expected);
      languageReport.generatedPages += 1;
    }

    for (const definition of pageDefinitions) {
      const targetRelative = fileFor(languageKey, definition.route);
      const targetFile = path.join(root, targetRelative);
      const current = expectedByFile.get(targetRelative) ?? (fs.existsSync(targetFile) ? fs.readFileSync(targetFile, "utf8") : null);
      if (current === null) throw new Error(`${languageKey}:${definition.route}: localized page is missing`);
      const localized = localizeMappedDocumentLinks(current, languageKey, definition.route);
      if (localized !== current && !expectedByFile.has(targetRelative)) languageReport.localizedExistingLinks += 1;
      expectedByFile.set(targetRelative, localized);
    }

    for (const [targetRelative, expected] of expectedByFile) {
      const targetFile = path.join(root, targetRelative);
      const current = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, "utf8") : null;
      if (current === expected) continue;
      languageReport.changedPages += 1;
      if (write) {
        fs.mkdirSync(path.dirname(targetFile), { recursive: true });
        fs.writeFileSync(targetFile, expected);
      }
    }

    report.languages[languageKey] = languageReport;
  }

  return report;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirectRun) {
  console.log(JSON.stringify(generatePhase1CLocales({ write: process.argv.includes("--write") }), null, 2));
}

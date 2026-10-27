import fs from "node:fs";
import path from "node:path";
import {
  absoluteUrl,
  exactPublishedAlternates,
  languages,
  localizedPath,
  pageDefinitions,
  plannedLanguageKeys,
  publishedLanguageKeys,
  resolveLanguageTarget,
  translationStatus,
} from "./page-map.mjs";

const flags = Object.freeze({ en: "🇬🇧", es: "🇪🇸", fr: "🇫🇷", pt: "🇧🇷", tr: "🇹🇷", de: "🇩🇪", it: "🇮🇹", pl: "🇵🇱", ko: "🇰🇷" });
const menuOrder = Object.freeze(["en", "es", "fr", "pt", "tr", "de", "it", "pl", "ko"]);
const summaryLabels = Object.freeze({ en: "Language", es: "Idioma", tr: "Dil", de: "Sprache", it: "Lingua", pl: "Język", ko: "언어", fr: "Langue", pt: "Idioma" });

export function fileFor(languageKey, route) {
  const pathname = localizedPath(languageKey, route);
  return pathname === "/" ? "index.html" : `${pathname.slice(1)}index.html`;
}

export function renderHreflang(pageKey) {
  return exactPublishedAlternates(pageKey)
    .map(({ hreflang, href }) => `  <link rel="alternate" hreflang="${hreflang}" href="${href}">`)
    .join("\n");
}

export function renderLanguageMenu(pageKey, currentLanguageKey) {
  const links = menuOrder.map((languageKey) => {
    const language = languages[languageKey];
    if (!language.enabled) {
      return `      <a href="#" data-language-coming-soon="true"><span class="flag">${flags[languageKey]}</span> ${language.label}</a>`;
    }
    const target = resolveLanguageTarget(pageKey, languageKey);
    const current = languageKey === currentLanguageKey ? " aria-current=\"true\"" : "";
    const fallback = target.kind === "fallback" ? " data-language-fallback=\"true\"" : "";
    return `      <a href="${target.path}"${current}${fallback}><span class="flag">${flags[languageKey]}</span> ${language.label}</a>`;
  }).join("\n");

  return `<details class="language-menu">
    <summary>${summaryLabels[currentLanguageKey] ?? summaryLabels.en}</summary>
    <div class="language-list">
${links}
    </div>
  </details>`;
}

export function updateHreflang(html, pageKey) {
  const block = renderHreflang(pageKey);
  const alternatePattern = /\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g;
  const withoutAlternates = html.replace(alternatePattern, "");
  const canonicalPattern = /(<link rel="canonical" href="[^"]+">)/;
  if (!canonicalPattern.test(withoutAlternates)) throw new Error(`${pageKey}: canonical tag not found`);
  return withoutAlternates.replace(canonicalPattern, `$1\n${block}`);
}

export function updateLanguageMenu(html, pageKey, currentLanguageKey) {
  const pattern = /<details class="language-menu">[\s\S]*?<\/details>/;
  if (!pattern.test(html)) return { html, updated: false };
  return { html: html.replace(pattern, renderLanguageMenu(pageKey, currentLanguageKey)), updated: true };
}

export function collectPublishedDocuments(root) {
  const documents = [];
  const missingFiles = [];
  for (const definition of pageDefinitions) {
    for (const languageKey of publishedLanguageKeys) {
      if (translationStatus(definition.key, languageKey) !== "published") continue;
      const relativeFile = fileFor(languageKey, definition.route);
      const absoluteFile = path.join(root, relativeFile);
      if (!fs.existsSync(absoluteFile)) {
        missingFiles.push(relativeFile);
        continue;
      }
      documents.push({ definition, languageKey, relativeFile, absoluteFile });
    }
  }
  return { documents, missingFiles };
}

export function updateSitemapPreservingUnmapped(root) {
  const sitemapFile = path.join(root, "sitemap.xml");
  const current = fs.readFileSync(sitemapFile, "utf8");
  const blocks = [...current.matchAll(/\s*<url>[\s\S]*?<\/url>/g)].map((match) => match[0].trim());
  const blockByUrl = new Map(blocks.map((block) => [block.match(/<loc>([^<]+)<\/loc>/)?.[1], block]));
  const mappedUrls = pageDefinitions.flatMap((definition) => publishedLanguageKeys
    .filter((languageKey) => translationStatus(definition.key, languageKey) === "published")
    .map((languageKey) => absoluteUrl(languageKey, definition.route)));
  const mappedSet = new Set(mappedUrls);
  const unmappedBlocks = blocks.filter((block) => !mappedSet.has(block.match(/<loc>([^<]+)<\/loc>/)?.[1]));
  const outputBlocks = [
    ...mappedUrls.map((url) => blockByUrl.get(url) ?? `<url><loc>${url}</loc></url>`),
    ...unmappedBlocks,
  ];
  return {
    html: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${outputBlocks.map((block) => `  ${block}`).join("\n")}\n</urlset>\n`,
    mappedCount: mappedUrls.length,
    unmappedCount: unmappedBlocks.length,
    unmappedUrls: unmappedBlocks.map((block) => block.match(/<loc>([^<]+)<\/loc>/)?.[1]).filter(Boolean),
  };
}

export function runGeneration({ root = process.cwd(), write = false } = {}) {
  const { documents, missingFiles } = collectPublishedDocuments(root);
  if (missingFiles.length) throw new Error(`Published page files are missing:\n${missingFiles.join("\n")}`);

  let changedDocuments = 0;
  const missingLanguageMenus = [];
  const pendingWrites = [];
  for (const document of documents) {
    const original = fs.readFileSync(document.absoluteFile, "utf8");
    const expectedCanonical = absoluteUrl(document.languageKey, document.definition.route);
    if (!original.includes(`<link rel="canonical" href="${expectedCanonical}">`)) {
      throw new Error(`${document.relativeFile}: canonical does not match page-map (${expectedCanonical})`);
    }
    let next = document.definition.type === "blog-article" ? original : updateHreflang(original, document.definition.key);
    const menuResult = document.definition.type === "blog-article"
      ? { html: next, updated: /<details class="language-menu">[\s\S]*?<\/details>/.test(next) }
      : updateLanguageMenu(next, document.definition.key, document.languageKey);
    next = menuResult.html;
    if (!menuResult.updated) missingLanguageMenus.push(document.relativeFile);
    if (next !== original) {
      changedDocuments += 1;
      pendingWrites.push({ file: document.absoluteFile, content: next });
    }
  }

  const sitemap = updateSitemapPreservingUnmapped(root);
  const currentSitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  if (write && (missingLanguageMenus.length || sitemap.unmappedUrls.length)) {
    const blockers = [
      missingLanguageMenus.length ? `${missingLanguageMenus.length} templates have no language selector` : null,
      sitemap.unmappedUrls.length ? `${sitemap.unmappedUrls.length} sitemap URLs are outside the canonical page map` : null,
    ].filter(Boolean).join("; ");
    throw new Error(`Write mode blocked before any file changes: ${blockers}`);
  }
  if (write) {
    for (const pending of pendingWrites) fs.writeFileSync(pending.file, pending.content);
    if (sitemap.html !== currentSitemap) fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap.html);
  }

  return {
    mode: write ? "write" : "dry-run",
    canonicalPages: pageDefinitions.length,
    publishedDocuments: documents.length,
    changedDocuments,
    missingLanguageMenus,
    sitemapChanged: sitemap.html !== currentSitemap,
    sitemapMappedUrls: sitemap.mappedCount,
    sitemapPreservedUnmappedUrls: sitemap.unmappedUrls,
    plannedDocuments: plannedLanguageKeys.reduce((count, languageKey) => count + pageDefinitions.filter((definition) => translationStatus(definition.key, languageKey) === "planned").length, 0),
  };
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirectRun) {
  const report = runGeneration({ write: process.argv.includes("--write") });
  console.log(JSON.stringify(report, null, 2));
}

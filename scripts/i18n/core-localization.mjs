import fs from "node:fs";
import path from "node:path";
import {
  SITE_ORIGIN,
  absoluteUrl,
  corePageDefinitions,
  languages,
  localizedPath,
  pageByRoute,
} from "./page-map.mjs";
import { fileFor, updateHreflang, updateLanguageMenu } from "./generate-language-metadata.mjs";
import { extractProtectedTechnicalTokens } from "./translation-rules.mjs";

const TRANSLATABLE_ATTRIBUTES = new Set(["alt", "aria-label", "placeholder", "title", "value"]);
const TRANSLATABLE_META = new Set(["description", "og:title", "og:description", "twitter:title", "twitter:description"]);
const JSON_LITERAL_KEYS = new Set(["@context", "@type", "@id", "model", "url", "image", "item", "mainEntityOfPage"]);
const JSON_URL_KEYS = new Set(["@id", "url", "item", "mainEntityOfPage"]);
const NON_LANGUAGE_VALUES = new Set([
  "article", "website", "CHIGOX", "Facebook", "Instagram", "WhatsApp", "YouTube", "DICOM", "WiFi", "USB",
  "HTML", "CMOS", "LED", "LCD", "EMR", "POCUS", "OEM", "ODM", "TBD", "Yes", "W",
]);

function sourceFileFor(route) {
  return route === "/" ? "index.html" : `${route.slice(1)}index.html`;
}

function maskScriptAndStyle(html) {
  const blocks = [];
  const masked = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (block) => {
    const index = blocks.push(block) - 1;
    return `<chigox-protected-block data-index="${index}"></chigox-protected-block>`;
  });
  return {
    masked,
    restore(value) {
      return value.replace(/<chigox-protected-block data-index="(\d+)"><\/chigox-protected-block>/g, (_, index) => blocks[Number(index)]);
    },
  };
}

function walkJsonStrings(value, visitor, key = null) {
  if (typeof value === "string") return visitor(value, key);
  if (Array.isArray(value)) return value.map((item) => walkJsonStrings(item, visitor, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, walkJsonStrings(child, visitor, childKey)]));
  }
  return value;
}

function collectJsonLdStrings(html, output) {
  for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    const data = JSON.parse(match[1]);
    walkJsonStrings(data, (value, key) => {
      if (!JSON_LITERAL_KEYS.has(key) && shouldTranslate(value)) output.add(value.trim());
      return value;
    });
  }
}

export function shouldTranslate(value) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || NON_LANGUAGE_VALUES.has(text)) return false;
  if (["ICU", "ENT"].includes(text)) return true;
  if (!/[A-Za-z]/.test(text)) return false;
  if (/^(?:https?:\/\/|mailto:|tel:|\/)/i.test(text) || /^[^\s@]+@[^\s@]+$/.test(text)) return false;
  if (/^[A-Z0-9][A-Z0-9+./&()\-–—°×\s]*$/.test(text) && text.length <= 36) return false;

  let remainder = text;
  for (const token of extractProtectedTechnicalTokens(text).sort((a, b) => b.length - a.length)) remainder = remainder.replaceAll(token, " ");
  remainder = remainder.replace(/\b\S*\d\S*\b/g, " ").replace(/[^A-Za-z]+/g, "");
  return remainder.length > 1;
}

export function collectTranslatableStrings(html) {
  const output = new Set();
  collectJsonLdStrings(html, output);
  const { masked } = maskScriptAndStyle(html);

  for (const match of masked.matchAll(/>([^<>]+)</g)) {
    const value = match[1].replace(/\s+/g, " ").trim();
    if (shouldTranslate(value)) output.add(value);
  }

  for (const tagMatch of masked.matchAll(/<[^>]+>/g)) {
    const tag = tagMatch[0];
    for (const attributeMatch of tag.matchAll(/\b([a-z-]+)="([^"]*)"/gi)) {
      const [, rawName, rawValue] = attributeMatch;
      const name = rawName.toLowerCase();
      if (TRANSLATABLE_ATTRIBUTES.has(name) && shouldTranslate(rawValue)) output.add(rawValue.trim());
    }
    if (/^<meta\b/i.test(tag)) {
      const descriptor = tag.match(/\b(?:name|property)="([^"]+)"/i)?.[1]?.toLowerCase();
      const content = tag.match(/\bcontent="([^"]+)"/i)?.[1];
      if (descriptor && TRANSLATABLE_META.has(descriptor) && content && shouldTranslate(content)) output.add(content.trim());
    }
  }
  return output;
}

export function collectSourceStrings(root, definitions) {
  const strings = new Set();
  for (const definition of definitions) {
    const html = fs.readFileSync(path.join(root, sourceFileFor(definition.route)), "utf8");
    for (const value of collectTranslatableStrings(html)) strings.add(value);
  }
  return [...strings].sort((a, b) => a.localeCompare(b, "en"));
}

export function collectCoreSourceStrings(root) {
  return collectSourceStrings(root, corePageDefinitions);
}

function translateValue(value, catalog, context) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const source = value.replace(/\s+/g, " ").trim();
  if (!shouldTranslate(source)) return value;
  const translated = catalog[source];
  if (!translated) throw new Error(`${context}: missing translation for ${JSON.stringify(source)}`);
  return `${leading}${translated}${trailing}`;
}

export function localizeInternalUrl(rawValue, languageKey, sourceRoute) {
  if (!rawValue || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(rawValue)) return rawValue;
  let url;
  try {
    url = new URL(rawValue, `${SITE_ORIGIN}${sourceRoute}`);
  } catch {
    return rawValue;
  }
  if (url.origin !== SITE_ORIGIN) return rawValue;
  const definition = pageByRoute.get(url.pathname);
  if (definition) {
    return `${localizedPath(languageKey, definition.route)}${url.search}${url.hash}`;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

function localizeJsonLd(html, languageKey, catalog, sourceRoute) {
  return html.replace(/(<script\s+type="application\/ld\+json">)([\s\S]*?)(<\/script>)/gi, (_, open, json, close) => {
    const parsed = JSON.parse(json);
    const localized = walkJsonStrings(parsed, (value, key) => {
      if (JSON_LITERAL_KEYS.has(key)) {
        if (JSON_URL_KEYS.has(key) && value.startsWith(SITE_ORIGIN)) {
          return `${SITE_ORIGIN}${localizeInternalUrl(value, languageKey, sourceRoute)}`;
        }
        return value;
      }
      return translateValue(value, catalog, `${languageKey}:${sourceRoute}:json-ld`);
    });
    return `${open}${JSON.stringify(localized)}${close}`;
  });
}

function localizeTag(tag, languageKey, catalog, sourceRoute) {
  let output = tag.replace(/\b(href|src|action)="([^"]*)"/gi, (_, name, value) => `${name}="${localizeInternalUrl(value, languageKey, sourceRoute)}"`);
  if (/^<link\b/i.test(output) && /\brel="canonical"/i.test(output)) {
    output = output.replace(/\bhref="[^"]*"/i, `href="${absoluteUrl(languageKey, sourceRoute)}"`);
  }
  output = output.replace(/\b([a-z-]+)="([^"]*)"/gi, (attribute, rawName, rawValue) => {
    const name = rawName.toLowerCase();
    if (!TRANSLATABLE_ATTRIBUTES.has(name)) return attribute;
    return `${rawName}="${translateValue(rawValue, catalog, `${languageKey}:${sourceRoute}:${name}`)}"`;
  });
  if (/^<meta\b/i.test(output)) {
    const descriptor = output.match(/\b(?:name|property)="([^"]+)"/i)?.[1]?.toLowerCase();
    if (descriptor && TRANSLATABLE_META.has(descriptor)) {
      output = output.replace(/\bcontent="([^"]*)"/i, (_, value) => `content="${translateValue(value, catalog, `${languageKey}:${sourceRoute}:${descriptor}`)}"`);
    }
    if (descriptor === "og:url" || descriptor === "twitter:url") {
      output = output.replace(/\bcontent="[^"]*"/i, `content="${absoluteUrl(languageKey, sourceRoute)}"`);
    }
  }
  return output;
}

export function localizePageHtml(sourceHtml, definition, languageKey, catalog) {
  const language = languages[languageKey];
  if (!language || languageKey === "en") throw new Error(`Unsupported localized locale: ${languageKey}`);
  let html = localizeJsonLd(sourceHtml, languageKey, catalog, definition.route);
  const protectedBlocks = [];
  html = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (block) => {
    const index = protectedBlocks.push(block) - 1;
    return `<chigox-protected-block data-index="${index}"></chigox-protected-block>`;
  });
  html = html.replace(/<[^>]+>|[^<]+/g, (token) => {
    if (token.startsWith("<")) return localizeTag(token, languageKey, catalog, definition.route);
    return translateValue(token, catalog, `${languageKey}:${definition.route}:text`);
  });
  html = html.replace(/<chigox-protected-block data-index="(\d+)"><\/chigox-protected-block>/g, (_, index) => protectedBlocks[Number(index)]);
  html = html.replace(/<html\s+lang="[^"]+">/i, `<html lang="${language.htmlLang}">`);
  html = updateHreflang(html, definition.key);
  const menu = updateLanguageMenu(html, definition.key, languageKey);
  if (!menu.updated) throw new Error(`${languageKey}:${definition.route}: language selector not found`);
  return menu.html;
}

export function localizeMappedDocumentLinks(html, languageKey, sourceRoute) {
  const protectedBlocks = [];
  const protect = (block) => {
    const index = protectedBlocks.push(block) - 1;
    return `<chigox-protected-block data-index="${index}"></chigox-protected-block>`;
  };
  let output = html.replace(/<head\b[\s\S]*?<\/head>/gi, protect);
  output = output.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, protect);
  output = output.replace(/<details class="language-menu">[\s\S]*?<\/details>/gi, protect);
  output = output.replace(/\b(href|action)="([^"]*)"/gi, (_, name, value) => `${name}="${localizeInternalUrl(value, languageKey, sourceRoute)}"`);
  output = output.replace(/<chigox-protected-block data-index="(\d+)"><\/chigox-protected-block>/g, (_, index) => protectedBlocks[Number(index)]);
  return output.replace(/(<link rel="canonical" href=")[^"]*(">)/i, `$1${absoluteUrl(languageKey, sourceRoute)}$2`);
}

export function generateCoreLocales({ root = process.cwd(), write = false } = {}) {
  const report = { mode: write ? "write" : "dry-run", languages: {}, files: [] };
  for (const languageKey of ["fr", "pt"]) {
    const catalogFile = path.join(root, "scripts", "i18n", "translations", `core-${languageKey}.json`);
    if (!fs.existsSync(catalogFile)) throw new Error(`Missing translation catalog: ${catalogFile}`);
    const catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
    const languageReport = { pages: 0, changed: 0, missingCatalogEntries: 0 };
    for (const definition of corePageDefinitions) {
      const sourceFile = path.join(root, sourceFileFor(definition.route));
      const targetRelative = fileFor(languageKey, definition.route);
      const targetFile = path.join(root, targetRelative);
      const expected = localizePageHtml(fs.readFileSync(sourceFile, "utf8"), definition, languageKey, catalog);
      const current = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, "utf8") : null;
      languageReport.pages += 1;
      if (current !== expected) {
        languageReport.changed += 1;
        if (write) {
          fs.mkdirSync(path.dirname(targetFile), { recursive: true });
          fs.writeFileSync(targetFile, expected);
        }
      }
      report.files.push(targetRelative);
    }
    report.languages[languageKey] = languageReport;
  }
  return report;
}

import fs from "node:fs";
import path from "node:path";
import { collectTranslatableStrings } from "./core-localization.mjs";
import { blogDefinitions, blogLanguageKeys, collectBlogSourceStrings, loadBlogCatalog } from "./blog-localization.mjs";
import { fileFor } from "./generate-language-metadata.mjs";
import { absoluteUrl, languages } from "./page-map.mjs";
import { compareProtectedTechnicalContent } from "./translation-rules.mjs";

const root = process.cwd();
const errors = [];
const stats = { languages: blogLanguageKeys.length, articles: 0, indexes: 0, translatedStrings: 0 };
const englishStopWords = new Set([
  "the", "and", "for", "with", "from", "into", "before", "after", "when", "where", "what", "which", "how",
  "this", "that", "these", "those", "your", "you", "are", "is", "be", "as", "to", "of", "in", "on", "by", "or",
  "guide", "buying", "compare", "review", "choosing", "choose", "important", "clinical", "clinic", "medical", "veterinary",
  "distributors", "importers", "practical", "supplier", "workflow", "market", "imaging", "support", "common",
]);
const permittedUnchanged = /^(?:CHIGOX|CHIGOX Blog|Blog|WhatsApp:?|Facebook|Instagram|YouTube|DICOM|WiFi|USB|OEM|ODM|ROI|SEO|CE|FDA|ICU|ENT|Linear:?|Phased Array:?|Software|Documentation|Email:?|Deutsch|Italiano|Polski|Türkçe|Français|Português|Español)$/i;

function sourceFileFor(route) {
  return route === "/" ? "index.html" : `${route.slice(1)}index.html`;
}

function visibleEnglishScore(value) {
  const words = (value.match(/[A-Za-z]+/g) ?? []).map((word) => word.toLowerCase());
  return { words: words.length, hits: words.filter((word) => englishStopWords.has(word)).length };
}

for (const languageKey of blogLanguageKeys) {
  const catalog = loadBlogCatalog(root, languageKey);
  const sources = collectBlogSourceStrings(root);
  for (const source of sources) {
    const translation = catalog[source];
    if (!translation) {
      errors.push(`${languageKey}: missing complete Blog translation for ${JSON.stringify(source)}`);
      continue;
    }
    stats.translatedStrings += 1;
    if (translation === source && !permittedUnchanged.test(source)) errors.push(`${languageKey}: unchanged English Blog string ${JSON.stringify(source)}`);
    const { words, hits } = visibleEnglishScore(translation);
    if (languageKey === "ko") {
      if (words >= 8 && !/[가-힣]/.test(translation)) errors.push(`${languageKey}: English-only Blog string ${JSON.stringify(translation)}`);
    } else if (words >= 8 && hits >= 5 && hits / words > 0.32) {
      errors.push(`${languageKey}: probable mixed-language Blog string ${JSON.stringify(translation)}`);
    }
    const technical = compareProtectedTechnicalContent(source, translation);
    if (technical.missing.length || technical.unexpected.length) errors.push(`${languageKey}: technical content changed for ${JSON.stringify(source)}`);
  }

  for (const definition of blogDefinitions) {
    const relativeFile = fileFor(languageKey, definition.route);
    const file = path.join(root, relativeFile);
    if (!fs.existsSync(file)) {
      errors.push(`${languageKey}: missing Blog page ${relativeFile}`);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    const sourceHtml = fs.readFileSync(path.join(root, sourceFileFor(definition.route)), "utf8");
    if (definition.type === "blog-index") stats.indexes += 1;
    else stats.articles += 1;
    if (!html.includes(`<html lang="${languages[languageKey].htmlLang}">`)) errors.push(`${relativeFile}: html lang mismatch`);
    if (!html.includes(`<link rel="canonical" href="${absoluteUrl(languageKey, definition.route)}">`)) errors.push(`${relativeFile}: canonical mismatch`);
    if ((html.match(/<article\b/g) ?? []).length !== (sourceHtml.match(/<article\b/g) ?? []).length) errors.push(`${relativeFile}: article/card count differs from English source`);
    const requiredMarkers = ["<title>", "<h1", "<h2", "alt="];
    if (definition.type === "blog-index") requiredMarkers.push('class="text-link"');
    for (const required of requiredMarkers) {
      if (!html.includes(required)) errors.push(`${relativeFile}: missing translated content marker ${required}`);
    }
    if (/ZXQTECH|CHIGOX-\d{4}/.test(html)) errors.push(`${relativeFile}: translation placeholder leaked`);
    const sourceStrings = collectTranslatableStrings(sourceHtml);
    const localizedStrings = collectTranslatableStrings(html);
    if (!sourceStrings.size || !localizedStrings.size) errors.push(`${relativeFile}: translatable content extraction failed`);
  }
}

if (errors.length) {
  console.error(errors.slice(0, 200).join("\n"));
  if (errors.length > 200) console.error(`... ${errors.length - 200} additional errors`);
  process.exit(1);
}

console.log(JSON.stringify(stats, null, 2));
console.log("CHIGOX eight-language Blog translation validation passed.");

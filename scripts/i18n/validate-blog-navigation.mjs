import fs from "node:fs";
import path from "node:path";
import { fileFor } from "./generate-language-metadata.mjs";
import { localizedPath, pageDefinitions, publishedLanguageKeys } from "./page-map.mjs";

const root = process.cwd();
const languageKeys = publishedLanguageKeys.filter((languageKey) => languageKey !== "en");
const failures = [];
const counts = {};

for (const languageKey of languageKeys) {
  counts[languageKey] = 0;
  for (const definition of pageDefinitions) {
    const relativeFile = fileFor(languageKey, definition.route);
    const html = fs.readFileSync(path.join(root, relativeFile), "utf8");
    const nav = html.match(/<nav\b[^>]*class="[^"]*main-nav[^"]*"[^>]*>[\s\S]*?<\/nav>/)?.[0];
    if (!nav) {
      failures.push(`${relativeFile}: main navigation not found`);
      continue;
    }

    const languageMenuIndex = nav.indexOf('<details class="language-menu">');
    const topNavigation = languageMenuIndex < 0 ? nav : nav.slice(0, languageMenuIndex);
    const aboutPath = localizedPath(languageKey, "/about-us/");
    const blogPath = localizedPath(languageKey, "/blog/");
    const contactPath = localizedPath(languageKey, "/contact-us/");
    const aboutIndex = topNavigation.indexOf(`href="${aboutPath}"`);
    const blogIndex = topNavigation.indexOf(`href="${blogPath}"`);
    const contactIndex = topNavigation.indexOf(`href="${contactPath}"`);
    const blogCount = topNavigation.split(`href="${blogPath}"`).length - 1;
    if (blogCount !== 1) failures.push(`${relativeFile}: expected one top-level Blog link, found ${blogCount}`);
    if (!(aboutIndex >= 0 && aboutIndex < blogIndex && blogIndex < contactIndex)) {
      failures.push(`${relativeFile}: expected About -> Blog -> Contact`);
    }

    const expectsCurrent = definition.type === "blog-index" || definition.type === "blog-article";
    const blogAnchor = topNavigation.match(new RegExp(`<a\\b(?=[^>]*href="${blogPath}")[^>]*>Blog<\\/a>`))?.[0] ?? "";
    if (expectsCurrent !== blogAnchor.includes('aria-current="page"')) {
      failures.push(`${relativeFile}: Blog current-page state is incorrect`);
    }

    const targetFile = path.join(root, fileFor(languageKey, "/blog/"));
    if (!fs.existsSync(targetFile)) failures.push(`${relativeFile}: Blog target is missing`);
    counts[languageKey] += 1;
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: "ok", pages: Object.values(counts).reduce((sum, count) => sum + count, 0), languages: counts }, null, 2));
}

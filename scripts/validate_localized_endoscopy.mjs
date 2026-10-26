import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const languages = ["es", "tr", "de", "it", "pl", "ko"];
const categories = {
  "endoscope-system": ["cge-100"],
  bronchoscope: ["cgb-600r", "disposable-flexible-bronchoscope"],
  cystoscope: ["cgc-350r", "cgc-350d"],
  nasopharyngoscope: ["cgn-350r", "cgn-350d"],
  ureteroscope: ["cgu-750r", "cgu-650d"],
  "rigid-endoscope": ["cgr-100"],
};
const routes = [
  "products/endoscopy-system",
  ...Object.keys(categories).map((category) => `products/endoscopy-system/${category}`),
  ...Object.entries(categories).flatMap(([category, products]) => products.map((product) => `products/endoscopy-system/${category}/${product}`)),
];
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const localizedUrl = (lang, route) => `https://www.chigox.com/${lang ? `${lang}/` : ""}${route}/`;
const alternateCodes = ["en", ...languages, "x-default"];
const expectedAlternates = (route) => Object.fromEntries(alternateCodes.map((code) => [code, localizedUrl(code === "en" || code === "x-default" ? "" : code, route)]));
const forbiddenEnglishCopy = [
  "CGE-100 is a Full HD 1080P medical endoscopy platform",
  "The system consists of a video processor",
  "The CGE-100 system supports an optional medical workstation",
  "Patient information management",
  "Image and video capture",
  "Procedure recording",
  "Case database management",
  "Report generation",
  "Image annotation",
  "USB data export",
  "Pediatric / Adult",
  "Compatible with rigid endoscopes",
  "Inquiry Form",
  "Need a configuration for this category",
  "Tell us your application, quantity, and target market",
  "Browse CHIGOX products in this product hierarchy",
];

const routeToFile = (href) => {
  const pathname = href.split(/[?#]/)[0];
  if (!pathname.endsWith("/")) return pathname.slice(1);
  return `${pathname.slice(1)}index.html`;
};

for (const lang of languages) {
  for (const route of routes) {
    const file = `${lang}/${route}/index.html`;
    assert(exists(file), `${lang}: missing ${route}`);
    if (!exists(file)) continue;
    const html = read(file);
    const expectedCanonical = localizedUrl(lang, route);
    assert(html.includes(`<link rel="canonical" href="${expectedCanonical}">`), `${file}: incorrect canonical`);
    const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
    assert(alternates.length === 8, `${file}: expected 8 hreflang links, found ${alternates.length}`);
    for (const [code, url] of Object.entries(expectedAlternates(route))) {
      assert(alternates.some((match) => match[1] === code && match[2] === url), `${file}: incorrect hreflang ${code}`);
    }
    assert(!/\bundefined\b|\\\$\{lang\}/.test(html), `${file}: unresolved generated value`);
    assert(!/<main>[\s\S]*?\b(Product Overview|Key Features|Standard Configuration|Optional Accessories|View product|Send Inquiry)\b[\s\S]*?<\/main>/.test(html), `${file}: untranslated English UI text in main content`);
    for (const text of forbiddenEnglishCopy) assert(!html.includes(text), `${file}: untranslated English copy: ${text}`);
    assert(html.includes(`<html lang="${lang}">`), `${file}: incorrect html lang`);
    assert(/<title>[^<]+<\/title>/.test(html) && /<meta name="description" content="[^"]+">/.test(html), `${file}: missing localized SEO metadata`);

    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = match[1];
      if (url.startsWith(`/${lang}/`)) assert(exists(routeToFile(url)), `${file}: missing internal target ${url}`);
      if (url.startsWith("/assets/")) assert(exists(url.split(/[?#]/)[0].slice(1)), `${file}: missing asset ${url}`);
    }
  }

  const htmlFiles = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const relative = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(relative);
      else if (entry.name.endsWith(".html")) htmlFiles.push(relative);
    }
  };
  walk(lang);
  for (const file of htmlFiles) {
    const html = read(file);
    const menu = html.match(/<section class="product-menu-group">\s*<img class="product-menu-image" src="\/assets\/内窥镜\.png"[\s\S]*?<\/section>/)?.[0];
    assert(menu, `${file}: Endoscopy menu missing`);
    if (!menu) continue;
    assert((menu.match(/<details class="product-menu-subgroup">/g) || []).length === 6, `${file}: Endoscopy menu does not contain 6 groups`);
    const links = [...menu.matchAll(new RegExp(`href="\/${lang}\/products\/endoscopy-system\/[^\"]+\/"`, "g"))];
    assert(links.length === 10, `${file}: expected 10 product links, found ${links.length}`);
    for (const link of links) {
      const href = link[0].slice(6, -1);
      assert(exists(routeToFile(href)), `${file}: menu target missing ${href}`);
    }
  }
}

for (const route of routes) {
  const file = `${route}/index.html`;
  const html = read(file);
  assert(html.includes(`<link rel="canonical" href="${localizedUrl("", route)}">`), `${file}: incorrect canonical`);
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
  assert(alternates.length === 8, `${file}: expected 8 hreflang links, found ${alternates.length}`);
  for (const [code, url] of Object.entries(expectedAlternates(route))) {
    assert(alternates.some((match) => match[1] === code && match[2] === url), `${file}: incorrect hreflang ${code}`);
  }
}

const sitemap = read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert(new Set(sitemapUrls).size === sitemapUrls.length, "sitemap: duplicate URLs detected");
for (const lang of ["", ...languages]) {
  for (const route of routes) {
    const url = localizedUrl(lang, route);
    assert(sitemapUrls.filter((candidate) => candidate === url).length === 1, `sitemap: expected exactly one ${url}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${languages.length * routes.length} localized Endoscopy routes.`);
console.log(`Validated Products menus across ${languages.length} languages.`);
console.log("Canonical, bidirectional hreflang, sitemap, internal links and image assets passed.");

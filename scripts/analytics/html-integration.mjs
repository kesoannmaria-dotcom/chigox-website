import fs from "node:fs";
import path from "node:path";

export const GTM_ID = "GTM-TNKTN3MB";
export const HEAD_START = "<!-- CHIGOX_ANALYTICS_HEAD_START -->";
export const HEAD_END = "<!-- CHIGOX_ANALYTICS_HEAD_END -->";
export const FOOTER_START = "<!-- CHIGOX_COOKIE_SETTINGS_START -->";
export const FOOTER_END = "<!-- CHIGOX_COOKIE_SETTINGS_END -->";

const headMarkup = `${HEAD_START}
  <link rel="stylesheet" href="/assets/css/chigox-consent.css">
  <script src="/assets/js/chigox-consent.js" data-gtm-id="${GTM_ID}"></script>
  <script src="/assets/js/chigox-analytics.js" defer></script>
  ${HEAD_END}`;

const footerMarkup = `${FOOTER_START}
    <div class="cookie-settings-footer"><button class="cookie-settings-link" type="button" data-cookie-settings></button></div>
  ${FOOTER_END}`;

const removeBlock = (html, start, end) =>
  html.replace(new RegExp(`${start}[\\s\\S]*?${end}`, "g"), "");

const replaceBlock = (html, start, end, markup) =>
  html.replace(new RegExp(`${start}[\\s\\S]*?${end}`, "g"), markup);

export function applyAnalyticsToHtml(input) {
  let html = String(input);

  if (!html.includes("</head>")) {
    throw new Error("HTML document is missing </head>.");
  }

  const hasHeadIntegration = html.includes(HEAD_START) && html.includes(HEAD_END);
  if (hasHeadIntegration) {
    html = replaceBlock(html, HEAD_START, HEAD_END, headMarkup);
  } else {
    html = removeBlock(html, HEAD_START, HEAD_END);
    html = html.replace("</head>", `${headMarkup}\n</head>`);
  }

  const hasFooterIntegration = html.includes(FOOTER_START) && html.includes(FOOTER_END);
  if (html.includes('<footer class="site-footer">')) {
    if (hasFooterIntegration) {
      html = replaceBlock(html, FOOTER_START, FOOTER_END, footerMarkup);
    } else {
      html = removeBlock(html, FOOTER_START, FOOTER_END);
      html = html.replace("</footer>", `${footerMarkup}\n</footer>`);
    }
  }

  return html;
}

export function collectHtmlFiles(root) {
  const ignored = new Set([".git", "node_modules", "outputs", "reports", "work", ".wrangler"]);
  const files = [];

  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
    }
  };

  visit(root);
  return files.sort();
}

export function applyAnalyticsToSite({ root = process.cwd(), write = false } = {}) {
  const files = collectHtmlFiles(root);
  const changed = [];

  for (const file of files) {
    const current = fs.readFileSync(file, "utf8");
    const expected = applyAnalyticsToHtml(current);
    if (current === expected) continue;
    changed.push(path.relative(root, file));
    if (write) fs.writeFileSync(file, expected);
  }

  return { htmlFiles: files.length, changedFiles: changed.length, changed };
}

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
const artifactDirectory = process.env.ARTIFACT_DIR || "/private/tmp/chigox-ga4-consent-artifacts";
fs.mkdirSync(artifactDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});
const report = { checks: [], languages: {}, screenshots: [] };

const check = (condition, label) => {
  assert.ok(condition, label);
  report.checks.push(label);
};

const dataLayerEvents = (page) => page.evaluate(() =>
  (window.dataLayer || [])
    .map((entry) => {
      if (Array.isArray(entry)) return entry;
      if (Object.prototype.toString.call(entry) === "[object Arguments]") return Array.from(entry);
      return entry;
    })
    .filter((entry) => Array.isArray(entry) && entry[0] === "event")
    .map((entry) => ({ name: entry[1], parameters: entry[2] || {} }))
);

const consentCommands = (page) => page.evaluate(() =>
  (window.dataLayer || [])
    .filter((entry) => Object.prototype.toString.call(entry) === "[object Arguments]")
    .map((entry) => Array.from(entry))
    .filter((entry) => entry[0] === "consent")
);

const createContext = async ({ postOk = true, viewport = { width: 1440, height: 1000 } } = {}) => {
  const context = await browser.newContext({ viewport });
  const requests = [];
  await context.route("https://www.googletagmanager.com/gtm.js**", async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.__CHIGOX_GTM_STUB__=(window.__CHIGOX_GTM_STUB__||0)+1;"
    });
  });
  await context.route(/https:\/\/(?:www\.)?google-analytics\.com\/.*/, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ status: 204, body: "" });
  });
  await context.route(`${baseUrl}/api/inquiry`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, turnstileSiteKey: "" }) });
      return;
    }
    await route.fulfill({
      status: postOk ? 200 : 400,
      contentType: "application/json",
      body: JSON.stringify(postOk ? { ok: true, message: "Inquiry sent." } : { ok: false, error: "Rejected." })
    });
  });
  return { context, requests };
};

// Unknown consent: default denied, no Google requests.
{
  const { context, requests } = await createContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  const defaults = await consentCommands(page);
  check(defaults.length === 1 && defaults[0][1] === "default", "Consent default is queued exactly once");
  for (const field of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
    check(defaults[0][2][field] === "denied", `${field} defaults to denied`);
  }
  check(requests.length === 0, "GTM and GA4 do not load before consent");
  check(await page.locator("[data-cookie-banner]").isVisible(), "Cookie banner is visible for a new visitor");
  await page.screenshot({ path: path.join(artifactDirectory, "desktop-cookie-banner.png"), fullPage: true });
  report.screenshots.push("desktop-cookie-banner.png");
  await context.close();
}

// Reject persists and keeps analytics disabled.
{
  const { context, requests } = await createContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-consent-reject]").click();
  await page.reload({ waitUntil: "domcontentloaded" });
  const state = await page.evaluate(() => window.CHIGOXConsent.getState());
  check(state.analytics === false && state.advertising === false, "Reject all persists both optional categories as denied");
  check(requests.length === 0, "Reject all prevents GTM and GA4 requests after reload");
  check(await page.locator("[data-cookie-banner]").isHidden(), "Saved rejection hides the first-visit banner");
  await context.close();
}

// Accept loads GTM once per page, tracks sanitized events, and allows withdrawal.
{
  const { context, requests } = await createContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-consent-accept]").click();
  await page.waitForFunction(() => window.__CHIGOX_GTM_STUB__ === 1);
  check(requests.filter((url) => url.includes("googletagmanager.com/gtm.js")).length === 1, "Accept all loads GTM once on the page");

  await page.evaluate(() => document.addEventListener("click", (event) => {
    if (event.target.closest?.("a[href]")) event.preventDefault();
  }, true));
  await page.locator('a[href*="wa.me/"]').first().click();
  await page.locator('a[href^="mailto:"]').first().click();
  await page.locator('.btn[href*="contact-us"]').first().click();
  const events = await dataLayerEvents(page);
  for (const eventName of ["whatsapp_click", "email_click", "quote_cta_click"]) {
    const event = events.find((candidate) => candidate.name === eventName);
    check(Boolean(event), `${eventName} is pushed after consent`);
    check(!JSON.stringify(event).includes("13979951941") && !JSON.stringify(event).includes("info@chigox.com"), `${eventName} excludes contact PII`);
  }

  await page.locator("[data-cookie-settings]").click();
  await page.locator('[data-consent-choice="analytics"]').uncheck();
  const beforeWithdrawal = requests.length;
  await page.locator("[data-consent-save]").click();
  await page.waitForLoadState("domcontentloaded");
  const withdrawn = await page.evaluate(() => window.CHIGOXConsent.getState());
  check(withdrawn.analytics === false, "Analytics consent can be withdrawn");
  check(requests.length === beforeWithdrawal, "Withdrawal reload does not load GTM again");
  await context.close();
}

// API success produces one form_start and one generate_lead.
{
  const { context } = await createContext({ postOk: true });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/contact-us/`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-consent-accept]").click();
  await page.locator('input[name="Name"]').fill("Analytics Test");
  await page.locator('input[name="Email"]').fill("analytics-test@example.invalid");
  await page.locator('textarea[name="Message"]').fill("Preview analytics verification only.");
  await page.locator('form[action="/api/inquiry"] button[type="submit"]').click();
  await page.locator('.inquiry-form-status[data-state="success"]').waitFor();
  const events = await dataLayerEvents(page);
  check(events.filter((event) => event.name === "form_start").length === 1, "form_start fires once for an API form");
  check(events.filter((event) => event.name === "generate_lead").length === 1, "generate_lead fires once after payload ok");
  check(!JSON.stringify(events).includes("Analytics Test") && !JSON.stringify(events).includes("analytics-test@example.invalid"), "API analytics events exclude form values");
  await context.close();
}

// API failure never produces generate_lead.
{
  const { context } = await createContext({ postOk: false });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/contact-us/`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-consent-accept]").click();
  await page.locator('input[name="Name"]').fill("Failure Test");
  await page.locator('input[name="Email"]').fill("failure@example.invalid");
  await page.locator('textarea[name="Message"]').fill("Expected failure.");
  await page.locator('form[action="/api/inquiry"] button[type="submit"]').click();
  await page.locator('.inquiry-form-status[data-state="error"]').waitFor();
  const events = await dataLayerEvents(page);
  check(events.filter((event) => event.name === "generate_lead").length === 0, "API failure does not produce generate_lead");
  await context.close();
}

// Mailto form interactions never produce generate_lead.
{
  const { context } = await createContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/products/ultrasound/handheld-ultrasound/convex-scanner/cgu-c/`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-consent-accept]").click();
  const form = page.locator('form[action^="mailto:"]');
  await form.locator("input").first().focus();
  await form.evaluate((element) => element.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  const events = await dataLayerEvents(page);
  check(events.filter((event) => event.name === "form_start").length === 1, "form_start fires once for a mailto form");
  check(events.filter((event) => event.name === "email_click").length === 1, "mailto form handoff records email_click");
  check(events.filter((event) => event.name === "generate_lead").length === 0, "mailto form never produces generate_lead");
  await context.close();
}

// All language variants render localized controls.
{
  const paths = { en: "/", es: "/es/", fr: "/fr/", "pt-BR": "/pt/", de: "/de/", it: "/it/", pl: "/pl/", tr: "/tr/", ko: "/ko/" };
  for (const [language, route] of Object.entries(paths)) {
    const { context } = await createContext();
    const page = await context.newPage();
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    const title = (await page.locator("#chigox-cookie-title").textContent()).trim();
    check(Boolean(title), `${language} cookie banner has localized content`);
    report.languages[language] = title;
    await context.close();
  }
}

// Mobile layout and settings panel.
{
  const { context } = await createContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-consent-customize]").click();
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check(noOverflow, "390px consent UI has no horizontal overflow");
  await page.screenshot({ path: path.join(artifactDirectory, "mobile-cookie-settings.png"), fullPage: true });
  report.screenshots.push("mobile-cookie-settings.png");
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(artifactDirectory, "browser-check-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: "passed", ...report }, null, 2));

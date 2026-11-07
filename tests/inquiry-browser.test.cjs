const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const chromePath =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let browser;
let origin;
let server;

const CGUC_PATH =
  "/products/ultrasound/handheld-ultrasound/convex-scanner/cgu-c/";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

before(async () => {
  server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, "http://localhost");
    const relativePath = requestUrl.pathname.endsWith("/")
      ? `${requestUrl.pathname.replace(/^\//, "")}index.html`
      : requestUrl.pathname.replace(/^\//, "");
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }

    try {
      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-type": contentTypes[path.extname(filePath)] || "application/octet-stream"
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: chromePath, headless: true });
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve));
});

const turnstileMock = (token) => `
  (() => {
    let options;
    let widget;
    const installToken = () => {
      let input = widget.querySelector('input[name="cf-turnstile-response"]');
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = "cf-turnstile-response";
        widget.append(input);
      }
      input.value = ${JSON.stringify(token)};
    };
    window.turnstile = {
      render(element, nextOptions) {
        widget = element;
        options = nextOptions;
        installToken();
        queueMicrotask(() => options.callback(${JSON.stringify(token)}));
        return "mock-widget";
      },
      reset() {
        installToken();
        queueMicrotask(() => options.callback(${JSON.stringify(token)}));
      },
      remove() {
        widget.replaceChildren();
      }
    };
  })();
`;

async function openForm({
  pagePath = "/contact-us/",
  query = "",
  apiDelay = 0,
  apiStatus = 200,
  apiBody = {
    ok: true,
    inquiryId: "mock-inquiry-1",
    duplicate: false,
    notificationStatus: "sent"
  },
  configDelay = 0,
  token = "mock-turnstile-token"
} = {}) {
  const page = await browser.newPage();
  const posts = [];

  await page.route("**/api/inquiry", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      if (configDelay) await new Promise((resolve) => setTimeout(resolve, configDelay));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          turnstileSiteKey: "mock-site-key",
          turnstileAction: "inquiry"
        })
      });
      return;
    }

    posts.push({
      body: request.postData() || "",
      method: request.method()
    });
    if (apiDelay) await new Promise((resolve) => setTimeout(resolve, apiDelay));
    await route.fulfill({
      status: apiStatus,
      contentType: "application/json",
      body: JSON.stringify(apiBody)
    });
  });
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js?*",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: turnstileMock(token)
      })
  );
  await page.goto(`${origin}${pagePath}${query}`, {
    waitUntil: "domcontentloaded"
  });
  return { page, posts };
}

async function fillValidInquiry(page) {
  await page.getByLabel("Name", { exact: true }).fill("CHIGOX MOCK TEST");
  await page.getByLabel("Email", { exact: true }).fill("mock@example.com");
  await page.getByLabel("Company", { exact: true }).fill("CHIGOX QA");
  await page.getByLabel("Product", { exact: true }).fill("CGU-C");
  await page.getByLabel("Message", { exact: true }).fill("Mock submission only");
}

test("successful submit sends one POST and shows success", async () => {
  const { page, posts } = await openForm();
  await page.getByText("Security verification ready.", { exact: true }).waitFor();
  await fillValidInquiry(page);
  await page.getByRole("button", { name: "Send Inquiry", exact: true }).click();
  await page
    .getByText("Thank you. Your inquiry has been received.", { exact: true })
    .waitFor();

  assert.equal(posts.length, 1);
  assert.equal(posts[0].method, "POST");
  assert.match(posts[0].body, /CHIGOX MOCK TEST/);
  assert.match(posts[0].body, /CGU-C/);
  assert.equal(await page.getByLabel("Name", { exact: true }).inputValue(), "");
  assert.equal(
    await page.locator("form.inquiry-form").getAttribute("data-inquiry-submitted"),
    "true"
  );
  await page.close();
});

test("rapid duplicate clicks still send only one POST", async () => {
  const { page, posts } = await openForm({ apiDelay: 100 });
  await page.getByText("Security verification ready.", { exact: true }).waitFor();
  await fillValidInquiry(page);
  await page.locator('button[type="submit"]').evaluate((button) => {
    button.click();
    button.click();
  });
  await page
    .getByText("Thank you. Your inquiry has been received.", { exact: true })
    .waitFor();

  assert.equal(posts.length, 1);
  await page.close();
});

test("storage failure keeps form data and never shows success", async () => {
  const { page, posts } = await openForm({
    apiStatus: 503,
    apiBody: {
      ok: false,
      code: "STORAGE_UNAVAILABLE",
      message: "Your inquiry could not be saved. Please try again."
    }
  });
  await page.getByText("Security verification ready.", { exact: true }).waitFor();
  await fillValidInquiry(page);
  await page.getByRole("button", { name: "Send Inquiry", exact: true }).click();
  await page
    .getByText("Your inquiry could not be saved. Please try again.", {
      exact: true
    })
    .waitFor();

  assert.equal(posts.length, 1);
  assert.equal(
    await page.getByLabel("Name", { exact: true }).inputValue(),
    "CHIGOX MOCK TEST"
  );
  assert.equal(
    await page.getByText("Thank you. Your inquiry has been received.", {
      exact: true
    }).count(),
    0
  );
  await page.close();
});

test("missing Turnstile token blocks POST with clear feedback", async () => {
  const { page, posts } = await openForm({ token: "" });
  await page.getByText("Security verification ready.", { exact: true }).waitFor();
  await fillValidInquiry(page);
  await page.locator("form.inquiry-form").evaluate((form) => form.requestSubmit());
  await page
    .getByText("Please complete the security verification.", { exact: true })
    .waitFor();

  assert.equal(posts.length, 0);
  await page.close();
});

test("submit is blocked while configuration is still loading", async () => {
  const { page, posts } = await openForm({ configDelay: 250 });
  await page.locator("form.inquiry-form").evaluate((form) => form.requestSubmit());
  await page.getByText("Security verification ready.", { exact: true }).waitFor();

  assert.equal(posts.length, 0);
  assert.equal(page.url(), `${origin}/contact-us/`);
  await page.close();
});

test("CGU-C form submits canonical fields, fixed product code, and attribution context", async () => {
  const { page, posts } = await openForm({
    pagePath: CGUC_PATH,
    query: "?utm_source=google&utm_medium=organic&utm_campaign=cgu_c_mock"
  });
  await page.getByText("Security verification ready.", { exact: true }).waitFor();
  await fillValidInquiry(page);
  await page.getByRole("button", { name: "Send Inquiry", exact: true }).click();
  await page
    .getByText("Thank you. Your inquiry has been received.", { exact: true })
    .waitFor();

  assert.equal(posts.length, 1);
  const payload = posts[0].body;
  for (const field of ["name", "email", "company", "product", "message"]) {
    assert.match(payload, new RegExp(`name="${field}"`));
  }
  assert.match(payload, /name="product_code"\r\n\r\nCGU-C/);
  assert.match(payload, /name="language"\r\n\r\nen/);
  assert.match(payload, /name="utm_source"\r\n\r\ngoogle/);
  assert.match(payload, /name="utm_medium"\r\n\r\norganic/);
  assert.match(payload, /name="utm_campaign"\r\n\r\ncgu_c_mock/);
  assert.match(
    payload,
    new RegExp(
      `name="page_url"\\r\\n\\r\\n${origin.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}${CGUC_PATH}`
    )
  );
  await page.close();
});

test("CGU-C form blocks submission without a Turnstile token", async () => {
  const { page, posts } = await openForm({ pagePath: CGUC_PATH, token: "" });
  await page.getByText("Security verification ready.", { exact: true }).waitFor();
  await fillValidInquiry(page);
  await page.locator("form.inquiry-form").evaluate((form) => form.requestSubmit());
  await page
    .getByText("Please complete the security verification.", { exact: true })
    .waitFor();

  assert.equal(posts.length, 0);
  await page.close();
});

test("CGU-C form shows API failure without clearing customer input", async () => {
  const { page, posts } = await openForm({
    pagePath: CGUC_PATH,
    apiStatus: 503,
    apiBody: { ok: false, code: "STORAGE_UNAVAILABLE" }
  });
  await page.getByText("Security verification ready.", { exact: true }).waitFor();
  await fillValidInquiry(page);
  await page.getByRole("button", { name: "Send Inquiry", exact: true }).click();
  await page
    .getByText("Your inquiry could not be saved. Please try again.", {
      exact: true
    })
    .waitFor();

  assert.equal(posts.length, 1);
  assert.equal(
    await page.getByLabel("Name", { exact: true }).inputValue(),
    "CHIGOX MOCK TEST"
  );
  await page.close();
});

test("CGU-C form prevents rapid duplicate submissions", async () => {
  const { page, posts } = await openForm({
    pagePath: CGUC_PATH,
    apiDelay: 100
  });
  await page.getByText("Security verification ready.", { exact: true }).waitFor();
  await fillValidInquiry(page);
  await page.locator('button[type="submit"]').evaluate((button) => {
    button.click();
    button.click();
  });
  await page
    .getByText("Thank you. Your inquiry has been received.", { exact: true })
    .waitFor();

  assert.equal(posts.length, 1);
  await page.close();
});

test("CGU-C form enforces required fields before POST", async () => {
  const { page, posts } = await openForm({ pagePath: CGUC_PATH });
  await page.getByText("Security verification ready.", { exact: true }).waitFor();
  await page.getByLabel("Name", { exact: true }).fill("CHIGOX MOCK TEST");
  await page.getByLabel("Email", { exact: true }).fill("mock@example.com");
  await page.getByRole("button", { name: "Send Inquiry", exact: true }).click();

  assert.equal(posts.length, 0);
  assert.equal(
    await page.getByLabel("Message", { exact: true }).evaluate((field) => field.validity.valueMissing),
    true
  );
  await page.close();
});

test("CGU-C form keeps its desktop and mobile layout within the viewport", async () => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 }
  ]) {
    const { page } = await openForm({ pagePath: CGUC_PATH });
    await page.setViewportSize(viewport);
    await page.getByText("Security verification ready.", { exact: true }).waitFor();
    const form = page.locator("form.inquiry-form");
    await form.scrollIntoViewIfNeeded();
    assert.equal(await form.isVisible(), true);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true
    );
    await page.close();
  }
});

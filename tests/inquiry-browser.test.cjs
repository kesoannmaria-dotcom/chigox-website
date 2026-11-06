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
    const relativePath =
      requestUrl.pathname === "/contact-us/"
        ? "contact-us/index.html"
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
  await page.goto(`${origin}/contact-us/`, { waitUntil: "domcontentloaded" });
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

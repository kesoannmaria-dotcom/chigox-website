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

const CGUC_LOCALES = [
  {
    code: "en",
    htmlLang: "en",
    path: CGUC_PATH,
    labels: ["Name", "Email", "Company", "Product", "Message"],
    success: "Thank you. Your inquiry has been received.",
    storageError: "Your inquiry could not be saved. Please try again."
  },
  {
    code: "es",
    htmlLang: "es",
    path: `/es${CGUC_PATH}`,
    labels: ["Nombre", "Correo electrónico", "Empresa", "Producto", "Mensaje"],
    success: "Gracias. Hemos recibido su consulta.",
    storageError: "No se pudo guardar la consulta. Inténtelo de nuevo."
  },
  {
    code: "tr",
    htmlLang: "tr",
    path: `/tr${CGUC_PATH}`,
    labels: ["Ad", "E-posta", "Şirket", "Ürün", "Mesaj"],
    success: "Teşekkürler. Talebiniz alındı.",
    storageError: "Talebiniz kaydedilemedi. Lütfen tekrar deneyin."
  },
  {
    code: "de",
    htmlLang: "de",
    path: `/de${CGUC_PATH}`,
    labels: ["Name", "E-Mail", "Unternehmen", "Produkt", "Nachricht"],
    success: "Vielen Dank. Ihre Anfrage ist eingegangen.",
    storageError: "Ihre Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."
  },
  {
    code: "it",
    htmlLang: "it",
    path: `/it${CGUC_PATH}`,
    labels: ["Nome", "Email", "Azienda", "Prodotto", "Messaggio"],
    success: "Grazie. La richiesta è stata ricevuta.",
    storageError: "Non è stato possibile salvare la richiesta. Riprova."
  },
  {
    code: "pl",
    htmlLang: "pl",
    path: `/pl${CGUC_PATH}`,
    labels: ["Imię", "E-mail", "Firma", "Produkt", "Wiadomość"],
    success: "Dziękujemy. Zapytanie zostało odebrane.",
    storageError: "Nie udało się zapisać zapytania. Spróbuj ponownie."
  },
  {
    code: "ko",
    htmlLang: "ko",
    path: `/ko${CGUC_PATH}`,
    labels: ["이름", "이메일", "회사", "제품", "메시지"],
    success: "감사합니다. 문의가 접수되었습니다.",
    storageError: "문의를 저장할 수 없습니다. 다시 시도해 주세요."
  },
  {
    code: "fr",
    htmlLang: "fr",
    path: `/fr${CGUC_PATH}`,
    labels: ["Nom", "Courriel", "Entreprise", "Produit", "Message"],
    success: "Merci. Votre demande a bien été reçue.",
    storageError: "Votre demande n'a pas pu être enregistrée. Veuillez réessayer."
  },
  {
    code: "pt",
    htmlLang: "pt-BR",
    path: `/pt${CGUC_PATH}`,
    labels: ["Nome", "E-mail", "Empresa", "Produto", "Mensagem"],
    success: "Obrigado. Sua consulta foi recebida.",
    storageError: "Não foi possível salvar sua consulta. Tente novamente."
  }
];

const PRODUCT_MIGRATION_SAMPLES = [
  ["en", "/products/plastic-surgery/cg-7c/", "CG-7C"],
  ["es", "/es/products/ultrasound/handheld-ultrasound/linear-scanner/cgu-l/", "CGU-L"],
  ["tr", "/tr/products/veterinary/endoscope-system/cgv-300/", "CGV-300H"],
  ["de", "/de/products/video-laryngoscope/disposable-video-laryngoscope/bd-dp/", "Disposable Video Laryngoscope"],
  ["it", "/it/products/endoscopy-system/bronchoscope/cgb-600r/", "CGB-600R"],
  ["pl", "/pl/products/veterinary/x-ray-system/cgv-dr07/", "CGV-DR07"],
  ["ko", "/ko/products/ultrasound/cart-ultrasound/cgvu-21-pro/", "CGVU-21 Pro"],
  ["fr", "/fr/products/endoscopy-system/bronchoscope/disposable-flexible-bronchoscope/", "Disposable Flexible Bronchoscope"],
  ["pt-BR", "/pt/products/video-laryngoscope/reusable-video-laryngoscope/reusable-system/", "Reusable Video Laryngoscope"]
];

const CONTACT_LOCALES = CGUC_LOCALES
  .filter(({ code }) => ["es", "tr", "de", "it", "pl", "ko"].includes(code))
  .map((locale) => ({ ...locale, path: `/${locale.code}/contact-us/` }));

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

async function fillCanonicalInquiry(page) {
  const form = page.locator("form.inquiry-form");
  await form.locator('[name="name"]').fill("CHIGOX MOCK TEST");
  await form.locator('[name="email"]').fill("mock@example.com");
  await form.locator('[name="company"]').fill("CHIGOX QA");
  await form.locator('[name="message"]').fill("Mock submission only");
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

test("all nine CGU-C pages preserve localized labels and canonical field mapping", async () => {
  for (const locale of CGUC_LOCALES) {
    const { page } = await openForm({ pagePath: locale.path });
    await page.getByText(/Security verification ready\.|Verificación de seguridad lista\.|Güvenlik doğrulaması hazır\.|Sicherheitsprüfung ist bereit\.|Verifica di sicurezza pronta\.|Weryfikacja bezpieczeństwa jest gotowa\.|보안 인증이 준비되었습니다\.|La vérification de sécurité est prête\.|Verificação de segurança pronta\./).waitFor();
    assert.equal(await page.locator("html").getAttribute("lang"), locale.htmlLang);

    const form = page.locator("form.inquiry-form");
    assert.equal(await form.getAttribute("action"), "/api/inquiry");
    assert.equal(await form.locator('[name="product_code"]').inputValue(), "CGU-C");
    assert.equal(await form.locator('[name="message"]').getAttribute("required"), "");
    assert.equal(
      await page.locator('script[src="/assets/js/inquiry-turnstile.js"]').count(),
      1
    );

    for (const [index, field] of ["name", "email", "company", "product", "message"].entries()) {
      const label = form.locator(`[name="${field}"]`).locator("xpath=ancestor::label");
      assert.match((await label.textContent()).trim(), new RegExp(`^${locale.labels[index]}`));
    }
    await page.close();
  }
});

test("all nine CGU-C pages submit localized success and attribution once", async () => {
  for (const locale of CGUC_LOCALES) {
    const { page, posts } = await openForm({
      pagePath: locale.path,
      query: `?utm_source=google&utm_medium=organic&utm_campaign=cgu_c_${locale.code}`
    });
    await page.locator('button[type="submit"]:not([disabled])').waitFor();
    await fillCanonicalInquiry(page);
    await page.locator('button[type="submit"]').evaluate((button) => {
      button.click();
      button.click();
    });
    await page.getByText(locale.success, { exact: true }).waitFor();

    assert.equal(posts.length, 1);
    assert.match(posts[0].body, /name="product_code"\r\n\r\nCGU-C/);
    assert.match(posts[0].body, new RegExp(`name="language"\\r\\n\\r\\n${locale.htmlLang}`));
    assert.match(posts[0].body, /name="utm_source"\r\n\r\ngoogle/);
    assert.match(posts[0].body, /name="utm_medium"\r\n\r\norganic/);
    assert.match(
      posts[0].body,
      new RegExp(`name="utm_campaign"\\r\\n\\r\\ncgu_c_${locale.code}`)
    );
    await page.close();
  }
});

test("all nine CGU-C pages show localized API failure without success", async () => {
  for (const locale of CGUC_LOCALES) {
    const { page, posts } = await openForm({
      pagePath: locale.path,
      apiStatus: 503,
      apiBody: { ok: false, code: "STORAGE_UNAVAILABLE" }
    });
    await page.locator('button[type="submit"]:not([disabled])').waitFor();
    await fillCanonicalInquiry(page);
    await page.locator('button[type="submit"]').click();
    await page.getByText(locale.storageError, { exact: true }).waitFor();

    assert.equal(posts.length, 1);
    assert.equal(await page.getByText(locale.success, { exact: true }).count(), 0);
    assert.equal(
      await page.locator('[name="name"]').inputValue(),
      "CHIGOX MOCK TEST"
    );
    await page.close();
  }
});

test("all nine CGU-C pages fit desktop and mobile viewports", async () => {
  for (const locale of CGUC_LOCALES) {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 }
    ]) {
      const { page } = await openForm({ pagePath: locale.path });
      await page.setViewportSize(viewport);
      await page.locator('button[type="submit"]:not([disabled])').waitFor();
      const form = page.locator("form.inquiry-form");
      await form.scrollIntoViewIfNeeded();
      assert.equal(await form.isVisible(), true);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        true
      );
      await page.close();
    }
  }
});

test("migrated product samples preserve identifiers, images, and responsive layouts", async () => {
  for (const [htmlLang, pagePath, productCode] of PRODUCT_MIGRATION_SAMPLES) {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 }
    ]) {
      const { page, posts } = await openForm({ pagePath });
      await page.setViewportSize(viewport);
      await page.locator('button[type="submit"]:not([disabled])').waitFor();

      const form = page.locator("form.inquiry-form");
      await form.scrollIntoViewIfNeeded();
      assert.equal(await page.locator("html").getAttribute("lang"), htmlLang);
      assert.equal(await form.getAttribute("action"), "/api/inquiry");
      assert.equal(await form.locator('[name="product_code"]').inputValue(), productCode);
      assert.equal(await form.locator('[name="message"]').getAttribute("required"), "");
      assert.equal(
        await page.locator('script[src="/assets/js/inquiry-turnstile.js"]').count(),
        1
      );
      assert.equal(posts.length, 0);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        true
      );
      assert.deepEqual(
        await page.locator("main img").evaluateAll((images) =>
          images
            .filter((image) => image.complete)
            .map((image) => ({ src: image.getAttribute("src"), width: image.naturalWidth }))
            .filter(({ src }) => src && !src.startsWith("data:"))
            .map(({ width }) => width > 0)
        ),
        await page.locator("main img").evaluateAll((images) =>
          images
            .filter((image) => image.complete)
            .map((image) => image.getAttribute("src"))
            .filter((src) => src && !src.startsWith("data:"))
            .map(() => true)
        )
      );
      await page.close();
    }
  }
});

test("six localized Contact forms submit general inquiries once with attribution", async () => {
  for (const locale of CONTACT_LOCALES) {
    const { page, posts } = await openForm({
      pagePath: locale.path,
      query: `?utm_source=google&utm_medium=organic&utm_campaign=contact_${locale.code}`
    });
    await page.locator('button[type="submit"]:not([disabled])').waitFor();
    await fillCanonicalInquiry(page);
    await page.locator('button[type="submit"]').evaluate((button) => {
      button.click();
      button.click();
    });
    await page.getByText(locale.success, { exact: true }).waitFor();

    assert.equal(posts.length, 1);
    assert.doesNotMatch(posts[0].body, /name="product_code"/);
    assert.match(posts[0].body, /name="product"\r\n\r\n\r\n/);
    assert.match(posts[0].body, new RegExp(`name="language"\\r\\n\\r\\n${locale.htmlLang}`));
    assert.match(posts[0].body, /name="utm_source"\r\n\r\ngoogle/);
    assert.match(posts[0].body, new RegExp(`name="utm_campaign"\\r\\n\\r\\ncontact_${locale.code}`));
    await page.close();
  }
});

test("six localized Contact forms show localized storage failures", async () => {
  for (const locale of CONTACT_LOCALES) {
    const { page, posts } = await openForm({
      pagePath: locale.path,
      apiStatus: 503,
      apiBody: { ok: false, code: "STORAGE_UNAVAILABLE" }
    });
    await page.locator('button[type="submit"]:not([disabled])').waitFor();
    await fillCanonicalInquiry(page);
    await page.locator('button[type="submit"]').click();
    await page.getByText(locale.storageError, { exact: true }).waitFor();

    assert.equal(posts.length, 1);
    assert.equal(await page.locator('[name="name"]').inputValue(), "CHIGOX MOCK TEST");
    assert.equal(await page.getByText(locale.success, { exact: true }).count(), 0);
    await page.close();
  }
});

test("six localized Contact forms require a message but allow an empty product", async () => {
  for (const locale of CONTACT_LOCALES) {
    const { page, posts } = await openForm({ pagePath: locale.path });
    await page.locator('button[type="submit"]:not([disabled])').waitFor();
    await page.locator('[name="name"]').fill("CHIGOX MOCK TEST");
    await page.locator('[name="email"]').fill("mock@example.com");
    await page.locator('button[type="submit"]').click();

    assert.equal(posts.length, 0);
    assert.equal(await page.locator('[name="product"]').inputValue(), "");
    assert.equal(
      await page.locator('[name="message"]').evaluate((field) => field.validity.valueMissing),
      true
    );
    await page.close();
  }
});

test("six localized Contact forms fit desktop and mobile viewports", async () => {
  for (const locale of CONTACT_LOCALES) {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 }
    ]) {
      const { page, posts } = await openForm({ pagePath: locale.path });
      await page.setViewportSize(viewport);
      await page.locator('button[type="submit"]:not([disabled])').waitFor();
      const form = page.locator("form.inquiry-form");
      await form.scrollIntoViewIfNeeded();

      assert.equal(await form.isVisible(), true);
      assert.equal(await form.getAttribute("action"), "/api/inquiry");
      assert.equal(await page.locator('script[src="/assets/js/inquiry-turnstile.js"]').count(), 1);
      assert.equal(posts.length, 0);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        true
      );
      await page.close();
    }
  }
});

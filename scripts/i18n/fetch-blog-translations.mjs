import fs from "node:fs";
import { blogCatalogFile, blogLanguageKeys, collectBlogSourceStrings } from "./blog-localization.mjs";
import { extractProtectedTechnicalTokens, terminology } from "./translation-rules.mjs";
import { curateBlogCatalog } from "./blog-curated-overrides.mjs";

const ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const BING_TRANSLATOR = "https://www.bing.com/translator";
const BING_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36";
const TARGETS = Object.freeze({ es: "es", tr: "tr", de: "de", it: "it", pl: "pl", ko: "ko", fr: "fr", pt: "pt" });
const MAX_BATCH_CHARACTERS = 2400;

function protectTechnicalContent(source) {
  const tokens = [
    ...extractProtectedTechnicalTokens(source),
    ...(source.match(/\b\S*\d\S*\b/g) ?? []),
    ...(source.match(/https?:\/\/[^\s]+|[^\s@]+@[^\s@]+/g) ?? []),
    ...(source.match(/\b(?:CHIGOX|WhatsApp|Facebook|Instagram|YouTube|DICOM|WiFi|USB|OEM|ODM)\b/g) ?? []),
  ].filter(Boolean).sort((a, b) => b.length - a.length);
  let protectedText = source;
  const placeholders = [];
  for (const token of [...new Set(tokens)]) {
    if (!protectedText.includes(token)) continue;
    const placeholder = `ZXQTECH${String(placeholders.length).padStart(4, "0")}QXZ`;
    protectedText = protectedText.replaceAll(token, placeholder);
    placeholders.push({ placeholder, token });
  }
  return { source, protectedText, placeholders };
}

function restoreTechnicalContent(translated, placeholders) {
  let output = translated;
  for (const { placeholder, token } of placeholders) output = output.replace(new RegExp(placeholder, "gi"), token);
  return output.trim();
}

function createBatches(entries) {
  const limit = provider === "bing" ? 900 : MAX_BATCH_CHARACTERS;
  const batches = [];
  let current = [];
  let length = 0;
  for (const entry of entries) {
    const addition = entry.protectedText.length + 32;
    if (current.length && length + addition > limit) {
      batches.push(current);
      current = [];
      length = 0;
    }
    current.push(entry);
    length += addition;
  }
  if (current.length) batches.push(current);
  return batches;
}

async function translateBatch(batch, target) {
  if (provider === "bing") return translateBatchWithBing(batch, target);
  const payload = batch.map((entry, index) => `⟦CHIGOX-${String(index).padStart(4, "0")}⟧\n${entry.protectedText}`).join("\n");
  const body = new URLSearchParams({ client: "gtx", sl: "en", tl: target, dt: "t", q: payload });
  let response;
  for (let attempt = 0; attempt < 7; attempt += 1) {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
    });
    if (response.ok) break;
    if (response.status !== 429 || attempt === 6) throw new Error(`Translation request failed (${response.status})`);
    await new Promise((resolve) => setTimeout(resolve, Math.min(30_000, 2_000 * (2 ** attempt))));
  }
  const data = await response.json();
  const translated = data[0].map((part) => part[0]).join("");
  const matches = [...translated.matchAll(/⟦CHIGOX-(\d{4})⟧\s*\n?/g)];
  if (matches.length !== batch.length) throw new Error(`Translation marker mismatch: expected ${batch.length}, received ${matches.length}`);
  return matches.map((match, index) => translated.slice(match.index + match[0].length, matches[index + 1]?.index ?? translated.length).trim());
}

let bingSessionPromise;
async function getBingSession() {
  if (!bingSessionPromise) {
    bingSessionPromise = (async () => {
      const response = await fetch(BING_TRANSLATOR, { headers: { "user-agent": BING_USER_AGENT } });
      if (!response.ok) throw new Error(`Bing translator session failed (${response.status})`);
      const cookies = response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
      const html = await response.text();
      const abuse = html.match(/params_AbusePreventionHelper\s*=\s*\[\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*\]/);
      const ig = html.match(/IG\s*:\s*"([A-Fa-f0-9]+)"/)?.[1];
      const iid = html.match(/data-iid="([^"]+)"/)?.[1];
      if (!abuse || !ig || !iid) throw new Error("Bing translator authentication parameters were not found");
      return { key: abuse[1], token: abuse[2], ig, iid, cookies };
    })();
  }
  return bingSessionPromise;
}

async function requestBingTranslation(payload, target, attempt = 0) {
  const session = await getBingSession();
  const body = new URLSearchParams({
    fromLang: "en",
    to: target,
    text: payload,
    token: session.token,
    key: session.key,
    tryFetchingGenderDebiasedTranslations: "true",
  });
  const response = await fetch(`https://www.bing.com/ttranslatev3?isVertical=1&IG=${session.ig}&IID=${session.iid}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": BING_USER_AGENT,
      cookie: session.cookies,
      origin: "https://www.bing.com",
      referer: BING_TRANSLATOR,
    },
    body,
  });
  if (!response.ok) {
    if (attempt < 3) {
      bingSessionPromise = undefined;
      await new Promise((resolve) => setTimeout(resolve, 2_000 * (attempt + 1)));
      return requestBingTranslation(payload, target, attempt + 1);
    }
    throw new Error(`Bing translation request failed (${response.status})`);
  }
  const data = await response.json();
  const translated = data[0]?.translations?.[0]?.text ?? "";
  await new Promise((resolve) => setTimeout(resolve, 350));
  return translated;
}

async function translateBatchWithBing(batch, target) {
  const payload = batch.map((entry, index) => `⟦CHIGOX-${String(index).padStart(4, "0")}⟧\n${entry.protectedText}`).join("\n");
  const translated = await requestBingTranslation(payload, target);
  const matches = [...translated.matchAll(/⟦CHIGOX-(\d{4})⟧\s*\n?/g)];
  if (matches.length === batch.length) {
    return matches.map((match, index) => translated.slice(match.index + match[0].length, matches[index + 1]?.index ?? translated.length).trim());
  }
  if (batch.length === 1) {
    const single = await requestBingTranslation(batch[0].protectedText, target);
    if (!single) throw new Error(`Bing returned an empty translation for ${JSON.stringify(batch[0].source)}`);
    return [single.trim()];
  }
  const midpoint = Math.ceil(batch.length / 2);
  return [
    ...await translateBatchWithBing(batch.slice(0, midpoint), target),
    ...await translateBatchWithBing(batch.slice(midpoint), target),
  ];
}

async function buildCatalog(root, languageKey) {
  const sources = collectBlogSourceStrings(root);
  const output = blogCatalogFile(root, languageKey);
  const existing = !refresh && fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, "utf8")) : {};
  const catalog = Object.fromEntries(sources.filter((source) => existing[source]).map((source) => [source, existing[source]]));
  const entries = sources.filter((source) => !catalog[source]).map(protectTechnicalContent);
  const batches = createBatches(entries);
  const concurrency = provider === "bing" ? 6 : 1;
  for (let index = 0; index < batches.length; index += concurrency) {
    const group = batches.slice(index, index + concurrency);
    const results = await Promise.all(group.map((batch) => translateBatch(batch, TARGETS[languageKey])));
    group.forEach((batch, batchIndex) => results[batchIndex].forEach((value, valueIndex) => {
      const entry = batch[valueIndex];
      catalog[entry.source] = restoreTechnicalContent(value, entry.placeholders);
    }));
    fs.writeFileSync(output, `${JSON.stringify(Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b, "en"))), null, 2)}\n`);
    console.log(`${languageKey}: translated ${Math.min(index + group.length, batches.length)}/${batches.length} complete Blog batches`);
    if (provider !== "bing") await new Promise((resolve) => setTimeout(resolve, 2_500));
  }
  for (const [key, source] of Object.entries(terminology.en)) {
    if (catalog[source]) catalog[source] = terminology[languageKey][key];
  }
  const curated = curateBlogCatalog(catalog, languageKey);
  return Object.fromEntries(Object.entries(curated).sort(([a], [b]) => a.localeCompare(b, "en")));
}

const root = process.cwd();
const provider = process.argv.find((argument) => argument.startsWith("--provider="))?.split("=")[1] ?? "google";
if (!new Set(["google", "bing"]).has(provider)) throw new Error(`Unsupported translation provider: ${provider}`);
const refresh = process.argv.includes("--refresh");
const requested = process.argv.find((argument) => argument.startsWith("--languages="))?.split("=")[1]?.split(",").filter(Boolean);
const languageKeys = requested?.length ? requested : blogLanguageKeys;
for (const languageKey of languageKeys) {
  if (!TARGETS[languageKey]) throw new Error(`Unsupported Blog language: ${languageKey}`);
  const catalog = await buildCatalog(root, languageKey);
  fs.writeFileSync(blogCatalogFile(root, languageKey), `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`${languageKey}: wrote ${Object.keys(catalog).length} complete-string translations`);
}

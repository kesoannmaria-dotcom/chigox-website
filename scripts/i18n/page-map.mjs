export const SITE_ORIGIN = "https://www.chigox.com";

export const languages = Object.freeze({
  en: { code: "en", prefix: "", htmlLang: "en", label: "English", enabled: true, status: "published" },
  es: { code: "es", prefix: "es", htmlLang: "es", label: "Español", enabled: true, status: "published" },
  tr: { code: "tr", prefix: "tr", htmlLang: "tr", label: "Türkçe", enabled: true, status: "published" },
  de: { code: "de", prefix: "de", htmlLang: "de", label: "Deutsch", enabled: true, status: "published" },
  it: { code: "it", prefix: "it", htmlLang: "it", label: "Italiano", enabled: true, status: "published" },
  pl: { code: "pl", prefix: "pl", htmlLang: "pl", label: "Polski", enabled: true, status: "published" },
  ko: { code: "ko", prefix: "ko", htmlLang: "ko", label: "한국어", enabled: true, status: "published" },
  fr: { code: "fr", prefix: "fr", htmlLang: "fr", label: "Français", enabled: true, status: "published" },
  pt: { code: "pt-BR", prefix: "pt", htmlLang: "pt-BR", label: "Português", enabled: true, status: "published" },
});

export const activeLanguageKeys = Object.freeze(["en", "es", "tr", "de", "it", "pl", "ko", "fr", "pt"]);
export const plannedLanguageKeys = Object.freeze([]);
export const localizedLanguageKeys = Object.freeze(["es", "tr", "de", "it", "pl", "ko"]);
export const publishedLanguageKeys = activeLanguageKeys;

const page = (key, route, type, parentKey = null) => ({ key, route, type, parentKey });

export const pageDefinitions = Object.freeze([
  page("home", "/", "home"),
  page("about", "/about-us/", "corporate", "home"),
  page("blog", "/blog/", "blog-index", "home"),
  page("blog-convex-transvaginal-guide", "/blog/convex-transvaginal-ultrasound-buying-guide/", "blog-article", "blog"),
  page("blog-rigid-endoscope-guide", "/blog/rigid-endoscope-buying-guide/", "blog-article", "blog"),
  page("blog-ureteroscope-guide", "/blog/ureteroscope-buying-guide/", "blog-article", "blog"),
  page("blog-handheld-ultrasound-checklist", "/blog/handheld-ultrasound-buying-checklist/", "blog-article", "blog"),
  page("blog-handheld-probe-types", "/blog/handheld-ultrasound-probe-types-linear-convex-phased-array/", "blog-article", "blog"),
  page("blog-veterinary-endoscope-guide", "/blog/how-to-choose-veterinary-endoscope/", "blog-article", "blog"),
  page("blog-portable-veterinary-ultrasound", "/blog/portable-veterinary-ultrasound-guide/", "blog-article", "blog"),
  page("blog-veterinary-endoscopy-roi", "/blog/veterinary-endoscopy-roi/", "blog-article", "blog"),
  page("blog-veterinary-anesthesia-guide", "/blog/veterinary-anesthesia-machine-buying-guide/", "blog-article", "blog"),
  page("contact", "/contact-us/", "corporate", "home"),
  page("products", "/products/", "product-index", "home"),
  page("anesthesia-machine", "/products/anesthesia-machine/", "product-category", "products"),
  page("endoscopy-system", "/products/endoscopy-system/", "product-category", "products"),
  page("endoscope-system", "/products/endoscopy-system/endoscope-system/", "product-category", "endoscopy-system"),
  page("cge-100", "/products/endoscopy-system/endoscope-system/cge-100/", "product-detail", "endoscope-system"),
  page("neurology-equipment", "/products/neurology-equipment/", "product-category", "products"),
  page("patient-monitor", "/products/patient-monitor/", "product-category", "products"),
  page("plastic-surgery", "/products/plastic-surgery/", "product-category", "products"),
  page("cg-7c", "/products/plastic-surgery/cg-7c/", "product-detail", "plastic-surgery"),
  page("cg-q1", "/products/plastic-surgery/cg-q1/", "product-detail", "plastic-surgery"),
  page("surgical-instruments", "/products/surgical-instruments/", "product-category", "products"),
  page("ultrasound", "/products/ultrasound/", "product-category", "products"),
  page("cart-ultrasound", "/products/ultrasound/cart-ultrasound/", "product-category", "ultrasound"),
  page("cgvu-21-pro", "/products/ultrasound/cart-ultrasound/cgvu-21-pro/", "product-detail", "cart-ultrasound"),
  page("handheld-ultrasound", "/products/ultrasound/handheld-ultrasound/", "product-category", "ultrasound"),
  page("three-in-one-scanner", "/products/ultrasound/handheld-ultrasound/3-in-1-linear-convex-phased-array-scanner/", "product-category", "handheld-ultrasound"),
  page("cgu-lcp", "/products/ultrasound/handheld-ultrasound/3-in-1-linear-convex-phased-array-scanner/cgu-lcp/", "product-detail", "three-in-one-scanner"),
  page("convex-scanner", "/products/ultrasound/handheld-ultrasound/convex-scanner/", "product-category", "handheld-ultrasound"),
  page("cgu-c", "/products/ultrasound/handheld-ultrasound/convex-scanner/cgu-c/", "product-detail", "convex-scanner"),
  page("convex-transvaginal-scanner", "/products/ultrasound/handheld-ultrasound/convex-transvaginal-scanner/", "product-category", "handheld-ultrasound"),
  page("cgu-03", "/products/ultrasound/handheld-ultrasound/convex-transvaginal-scanner/cgu-03/", "product-detail", "convex-transvaginal-scanner"),
  page("linear-scanner", "/products/ultrasound/handheld-ultrasound/linear-scanner/", "product-category", "handheld-ultrasound"),
  page("cgu-l", "/products/ultrasound/handheld-ultrasound/linear-scanner/cgu-l/", "product-detail", "linear-scanner"),
  page("phased-array-scanner", "/products/ultrasound/handheld-ultrasound/phased-array-scanner/", "product-category", "handheld-ultrasound"),
  page("cgu-4p", "/products/ultrasound/handheld-ultrasound/phased-array-scanner/cgu-4p/", "product-detail", "phased-array-scanner"),
  page("veterinary", "/products/veterinary/", "product-category", "products"),
  page("veterinary-endoscope-system", "/products/veterinary/endoscope-system/", "product-category", "veterinary"),
  page("cgv-300", "/products/veterinary/endoscope-system/cgv-300/", "product-detail", "veterinary-endoscope-system"),
  page("veterinary-gastroscope", "/products/veterinary/gastroscope/", "product-category", "veterinary"),
  page("cgv-300h", "/products/veterinary/gastroscope/cgv-300h/", "product-detail", "veterinary-gastroscope"),
  page("cgv-g", "/products/veterinary/gastroscope/cgv-g/", "product-detail", "veterinary-gastroscope"),
  page("vet-anesthesia-machine", "/products/veterinary/vet-anesthesia-machine/", "product-category", "veterinary"),
  page("cgvet-a220t", "/products/veterinary/vet-anesthesia-machine/cgvet-a220t/", "product-detail", "vet-anesthesia-machine"),
  page("cgvet-30", "/products/veterinary/vet-anesthesia-machine/cgvet-30/", "product-detail", "vet-anesthesia-machine"),
  page("veterinary-bronchoscope-rhinoscope", "/products/veterinary/veterinary-bronchoscope-rhinoscope/", "product-category", "veterinary"),
  page("cgv-m", "/products/veterinary/veterinary-bronchoscope-rhinoscope/cgv-m/", "product-detail", "veterinary-bronchoscope-rhinoscope"),
  page("veterinary-x-ray", "/products/veterinary/x-ray-system/", "product-category", "veterinary"),
  page("cgv-dr07", "/products/veterinary/x-ray-system/cgv-dr07/", "product-detail", "veterinary-x-ray"),
  page("cgv-dr2", "/products/veterinary/x-ray-system/cgv-dr2/", "product-detail", "veterinary-x-ray"),
  page("cgv-dr605", "/products/veterinary/x-ray-system/cgv-dr605/", "product-detail", "veterinary-x-ray"),
  page("video-laryngoscope", "/products/video-laryngoscope/", "product-category", "products"),
  page("disposable-video-laryngoscope", "/products/video-laryngoscope/disposable-video-laryngoscope/", "product-category", "video-laryngoscope"),
  page("bd-dp", "/products/video-laryngoscope/disposable-video-laryngoscope/bd-dp/", "product-detail", "disposable-video-laryngoscope"),
  page("reusable-video-laryngoscope", "/products/video-laryngoscope/reusable-video-laryngoscope/", "product-category", "video-laryngoscope"),
  page("reusable-system", "/products/video-laryngoscope/reusable-video-laryngoscope/reusable-system/", "product-detail", "reusable-video-laryngoscope"),
  page("video-rigid-stylet", "/products/video-laryngoscope/video-rigid-stylet/", "product-category", "video-laryngoscope"),
  page("bd-m3-vs-a", "/products/video-laryngoscope/video-rigid-stylet/bd-m3-vs-a/", "product-detail", "video-rigid-stylet"),
  page("portable-color-ultrasound", "/products/ultrasound/portable-color-ultrasound/", "product-category", "ultrasound"),
  page("cg-p31", "/products/ultrasound/portable-color-ultrasound/cg-p31/", "product-detail", "portable-color-ultrasound"),
  page("bronchoscope", "/products/endoscopy-system/bronchoscope/", "product-category", "endoscopy-system"),
  page("cystoscope", "/products/endoscopy-system/cystoscope/", "product-category", "endoscopy-system"),
  page("nasopharyngoscope", "/products/endoscopy-system/nasopharyngoscope/", "product-category", "endoscopy-system"),
  page("ureteroscope", "/products/endoscopy-system/ureteroscope/", "product-category", "endoscopy-system"),
  page("rigid-endoscope", "/products/endoscopy-system/rigid-endoscope/", "product-category", "endoscopy-system"),
  page("cgb-600r", "/products/endoscopy-system/bronchoscope/cgb-600r/", "product-detail", "bronchoscope"),
  page("disposable-flexible-bronchoscope", "/products/endoscopy-system/bronchoscope/disposable-flexible-bronchoscope/", "product-detail", "bronchoscope"),
  page("cgc-350r", "/products/endoscopy-system/cystoscope/cgc-350r/", "product-detail", "cystoscope"),
  page("cgc-350d", "/products/endoscopy-system/cystoscope/cgc-350d/", "product-detail", "cystoscope"),
  page("cgn-350r", "/products/endoscopy-system/nasopharyngoscope/cgn-350r/", "product-detail", "nasopharyngoscope"),
  page("cgn-350d", "/products/endoscopy-system/nasopharyngoscope/cgn-350d/", "product-detail", "nasopharyngoscope"),
  page("cgu-750r", "/products/endoscopy-system/ureteroscope/cgu-750r/", "product-detail", "ureteroscope"),
  page("cgu-650d", "/products/endoscopy-system/ureteroscope/cgu-650d/", "product-detail", "ureteroscope"),
  page("cgr-100", "/products/endoscopy-system/rigid-endoscope/cgr-100/", "product-detail", "rigid-endoscope"),
]);

export const corePageDefinitions = pageDefinitions;

export const phase1CRoutes = new Set([
  "/blog/convex-transvaginal-ultrasound-buying-guide/",
  "/blog/rigid-endoscope-buying-guide/",
  "/blog/ureteroscope-buying-guide/",
  "/blog/handheld-ultrasound-buying-checklist/",
  "/blog/handheld-ultrasound-probe-types-linear-convex-phased-array/",
  "/blog/how-to-choose-veterinary-endoscope/",
  "/blog/portable-veterinary-ultrasound-guide/",
  "/blog/veterinary-endoscopy-roi/",
  "/blog/veterinary-anesthesia-machine-buying-guide/",
  "/products/veterinary/vet-anesthesia-machine/",
  "/products/veterinary/vet-anesthesia-machine/cgvet-a220t/",
  "/products/veterinary/vet-anesthesia-machine/cgvet-30/",
  "/products/veterinary/x-ray-system/cgv-dr07/",
  "/products/ultrasound/portable-color-ultrasound/",
  "/products/ultrasound/portable-color-ultrasound/cg-p31/",
]);

export const missingSixLanguageRoutes = new Set();

export const pageByKey = new Map(pageDefinitions.map((definition) => [definition.key, definition]));
export const pageByRoute = new Map(pageDefinitions.map((definition) => [definition.route, definition]));

export function localizedPath(languageKey, route) {
  const language = languages[languageKey];
  if (!language) throw new Error(`Unknown language: ${languageKey}`);
  if (!route.startsWith("/") || !route.endsWith("/")) throw new Error(`Route must start and end with '/': ${route}`);
  return language.prefix ? `/${language.prefix}${route}` : route;
}

export function absoluteUrl(languageKey, route) {
  return `${SITE_ORIGIN}${localizedPath(languageKey, route)}`;
}

export function translationStatus(pageKey, languageKey) {
  const definition = pageByKey.get(pageKey);
  const language = languages[languageKey];
  if (!definition) throw new Error(`Unknown page: ${pageKey}`);
  if (!language) throw new Error(`Unknown language: ${languageKey}`);
  if (languageKey === "en") return "published";
  return "published";
}

export function resolveLanguageTarget(pageKey, languageKey) {
  const language = languages[languageKey];
  let definition = pageByKey.get(pageKey);
  if (!definition || !language) throw new Error(`Cannot resolve ${pageKey} in ${languageKey}`);

  if (!language.enabled) {
    return { languageKey, status: translationStatus(pageKey, languageKey), kind: "disabled", path: null, pageKey: null };
  }

  if (translationStatus(pageKey, languageKey) === "published") {
    return { languageKey, status: "published", kind: "exact", path: localizedPath(languageKey, definition.route), pageKey: definition.key };
  }

  while (definition.parentKey) {
    definition = pageByKey.get(definition.parentKey);
    if (translationStatus(definition.key, languageKey) === "published") {
      return { languageKey, status: "published", kind: "fallback", path: localizedPath(languageKey, definition.route), pageKey: definition.key };
    }
  }

  return { languageKey, status: "published", kind: "fallback", path: localizedPath(languageKey, "/"), pageKey: "home" };
}

export function exactPublishedAlternates(pageKey) {
  const alternates = publishedLanguageKeys
    .filter((languageKey) => translationStatus(pageKey, languageKey) === "published")
    .map((languageKey) => ({
      languageKey,
      hreflang: languages[languageKey].code,
      href: absoluteUrl(languageKey, pageByKey.get(pageKey).route),
    }));

  alternates.push({ languageKey: "x-default", hreflang: "x-default", href: absoluteUrl("en", pageByKey.get(pageKey).route) });
  return alternates;
}

export const resolvedRouteDecisions = Object.freeze([
  {
    id: "convex-transvaginal-independent-category",
    route: "/products/ultrasound/handheld-ultrasound/convex-transvaginal-scanner/",
    detail: "Retained as an independent CGU-03 category; CGU-C remains under the separate convex-scanner category.",
  },
  {
    id: "cgvet-a220t-canonical-product",
    route: "/products/veterinary/vet-anesthesia-machine/cgvet-a220t/",
    detail: "Retained as an independent canonical product because it is published in the category, global product menu and dedicated product page. Inventory availability is not inferred.",
  },
  {
    id: "portable-color-canonical-route",
    route: "/products/ultrasound/medical/portable-color-ultrasound/",
    detail: "Legacy physical mirrors were removed; permanent redirects continue to target /products/ultrasound/portable-color-ultrasound/.",
  },
]);

export const knownRouteAnomalies = Object.freeze([]);

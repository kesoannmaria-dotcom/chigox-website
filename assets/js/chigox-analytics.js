(() => {
  "use strict";

  const TRACKED_EVENTS = new Set([
    "quote_cta_click",
    "whatsapp_click",
    "email_click",
    "form_start",
    "generate_lead"
  ]);
  const SAFE_PARAMETER_KEYS = new Set([
    "page_path",
    "page_language",
    "product_code",
    "cta_location",
    "form_type"
  ]);
  const startedForms = new WeakSet();
  const completedForms = new WeakSet();

  const cleanValue = (value, maxLength = 120) =>
    String(value || "")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);

  const pageLanguage = () => {
    const language = cleanValue(document.documentElement.lang || "en", 12).toLowerCase();
    if (language.startsWith("pt")) return "pt-BR";
    return language.split("-")[0] || "en";
  };

  const productCode = () => {
    const candidates = [
      decodeURIComponent(window.location.pathname),
      document.querySelector("main h1")?.textContent,
      document.title
    ];

    for (const candidate of candidates) {
      const match = String(candidate || "").toUpperCase().match(/\b(?:CG[A-Z0-9]+(?:-[A-Z0-9]+)+|BD-[A-Z0-9-]+)\b/);
      if (match) return match[0].slice(0, 40);
    }

    return "";
  };

  const formType = (form) => {
    const action = cleanValue(form?.getAttribute("action"), 200).toLowerCase();
    if (action === "/api/inquiry") return "api_inquiry";
    if (action.startsWith("mailto:")) return "mailto_inquiry";
    return "website_form";
  };

  const ctaLocation = (element) => {
    if (element?.closest(".floating-contact")) return "floating_contact";
    if (element?.closest("footer")) return "footer";
    if (element?.closest(".page-hero, .product-hero, .hero")) return "hero";
    if (element?.closest(".inquiry-section, .inquiry-form")) return "inquiry";
    if (element?.closest("nav, header")) return "navigation";
    return "content";
  };

  const baseParameters = () => {
    const parameters = {
      page_path: cleanValue(window.location.pathname, 180),
      page_language: pageLanguage()
    };
    const code = productCode();
    if (code) parameters.product_code = code;
    return parameters;
  };

  const sanitizeParameters = (parameters) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(parameters || {})) {
      if (!SAFE_PARAMETER_KEYS.has(key)) continue;
      const cleaned = cleanValue(value, key === "page_path" ? 180 : 80);
      if (cleaned) sanitized[key] = cleaned;
    }
    return sanitized;
  };

  const track = (eventName, parameters = {}) => {
    if (!TRACKED_EVENTS.has(eventName)) return false;
    if (!window.CHIGOXConsent?.hasAnalyticsConsent?.()) return false;
    if (typeof window.gtag !== "function") return false;

    window.gtag("event", eventName, sanitizeParameters({
      ...baseParameters(),
      ...parameters
    }));
    return true;
  };

  const trackFormStart = (form) => {
    if (!form || startedForms.has(form)) return false;
    startedForms.add(form);
    return track("form_start", { form_type: formType(form) });
  };

  const trackGenerateLead = (form) => {
    if (!form || completedForms.has(form)) return false;
    completedForms.add(form);
    return track("generate_lead", { form_type: formType(form) });
  };

  const handleClick = (event) => {
    const link = event.target.closest?.("a[href]");
    if (!link) return;
    const href = cleanValue(link.getAttribute("href"), 240).toLowerCase();

    if (href.includes("wa.me/") || href.includes("api.whatsapp.com/")) {
      track("whatsapp_click", { cta_location: ctaLocation(link) });
      return;
    }

    if (href.startsWith("mailto:")) {
      track("email_click", { cta_location: ctaLocation(link) });
      return;
    }

    if (link.matches('.btn[href="#inquiry"], .btn[href*="/contact-us/"], .btn[href$="contact-us/"]')) {
      track("quote_cta_click", { cta_location: ctaLocation(link) });
    }
  };

  const handleFormInteraction = (event) => {
    const form = event.target.closest?.("form.inquiry-form");
    if (form) trackFormStart(form);
  };

  const handleMailtoSubmit = (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!cleanValue(form.getAttribute("action"), 200).toLowerCase().startsWith("mailto:")) return;
    track("email_click", {
      cta_location: "inquiry",
      form_type: "mailto_inquiry"
    });
  };

  document.addEventListener("click", handleClick);
  document.addEventListener("focusin", handleFormInteraction);
  document.addEventListener("input", handleFormInteraction);
  document.addEventListener("change", handleFormInteraction);
  document.addEventListener("submit", handleMailtoSubmit, true);

  window.CHIGOXAnalytics = Object.freeze({
    track,
    trackFormStart,
    trackGenerateLead
  });
})();

(() => {
  const API_URL = "/api/inquiry";
  const STORAGE_KEY = "chigox_inquiry_attribution";
  const initializedForms = new WeakSet();

  const safeSessionGet = (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const safeSessionSet = (key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // The form still works when storage is unavailable.
    }
  };

  const stripUrl = (value) => {
    if (!value) return "";
    try {
      const url = new URL(value, location.origin);
      return `${url.origin}${url.pathname}`;
    } catch {
      return "";
    }
  };

  const readAttribution = () => {
    const existing = safeSessionGet(STORAGE_KEY);
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch {
        // Replace invalid local data with a fresh privacy-safe record.
      }
    }

    const search = new URLSearchParams(location.search);
    const attribution = {
      landing_page: location.pathname,
      referrer: stripUrl(document.referrer),
      utm_source: (search.get("utm_source") || "").slice(0, 160),
      utm_medium: (search.get("utm_medium") || "").slice(0, 160),
      utm_campaign: (search.get("utm_campaign") || "").slice(0, 160),
    };
    safeSessionSet(STORAGE_KEY, JSON.stringify(attribution));
    return attribution;
  };

  const analyticsAllowed = () => window.CHIGOX_ANALYTICS_CONSENT === "granted";

  const pushAnalytics = (eventName) => {
    if (!analyticsAllowed()) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      page_path: location.pathname,
      page_language: document.documentElement.lang || "und",
    });
  };

  const readField = (formData, name) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };

  const createSubmissionId = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `web_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  };

  const loadTurnstile = () => {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-chigox-turnstile="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.turnstile), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.chigoxTurnstile = "true";
      script.addEventListener("load", () => resolve(window.turnstile), { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.append(script);
    });
  };

  const makeHoneypot = () => {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.style.position = "absolute";
    wrapper.style.left = "-10000px";
    wrapper.style.width = "1px";
    wrapper.style.height = "1px";
    wrapper.style.overflow = "hidden";
    const label = document.createElement("label");
    label.textContent = "Website";
    const input = document.createElement("input");
    input.name = "website";
    input.type = "text";
    input.tabIndex = -1;
    input.autocomplete = "off";
    label.append(input);
    wrapper.append(label);
    return wrapper;
  };

  const makeStatus = () => {
    const status = document.createElement("p");
    status.className = "inquiry-form-status full";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.style.margin = "0";
    status.style.fontSize = "14px";
    status.style.lineHeight = "1.5";
    return status;
  };

  const initializeForm = async (form, config, turnstile) => {
    if (initializedForms.has(form)) return;
    initializedForms.add(form);

    const attribution = readAttribution();
    const honeypot = makeHoneypot();
    const challenge = document.createElement("div");
    challenge.className = "inquiry-turnstile full";
    const status = makeStatus();
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitButton) {
      form.insertBefore(honeypot, submitButton);
      form.insertBefore(challenge, submitButton);
      form.append(status);
    } else {
      form.append(honeypot, challenge, status);
    }

    const widgetId = turnstile.render(challenge, {
      sitekey: config.site_key,
      action: config.action,
      appearance: "interaction-only",
      size: "flexible",
    });

    let formStarted = false;
    form.addEventListener("input", () => {
      if (formStarted) return;
      formStarted = true;
      pushAnalytics("form_start");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "";
      status.style.color = "#5d6d7c";

      const turnstileToken = turnstile.getResponse(widgetId);
      if (!turnstileToken) {
        status.textContent = "Please complete the verification and submit again.";
        status.style.color = "#a33b2f";
        return;
      }

      const formData = new FormData(form);
      const payload = {
        submission_id: createSubmissionId(),
        name: readField(formData, "name"),
        email: readField(formData, "email"),
        company: readField(formData, "company"),
        product: readField(formData, "product"),
        message: readField(formData, "message"),
        website: readField(formData, "website"),
        turnstile_token: turnstileToken,
        page_path: location.pathname,
        page_language: document.documentElement.lang || "und",
        landing_page: attribution.landing_page,
        referrer: attribution.referrer,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
      };

      if (submitButton) submitButton.disabled = true;
      status.textContent = "Sending your inquiry…";

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.lead_saved) throw new Error(result.error || "submission_failed");

        form.reset();
        turnstile.reset(widgetId);
        status.textContent = `Thank you. Your inquiry reference is ${result.lead_id}.`;
        status.style.color = "#087474";

        // No names, emails, companies, messages, or other personal fields are sent to GA4.
        if (result.analytics_event === "generate_lead") pushAnalytics("generate_lead");
      } catch {
        turnstile.reset(widgetId);
        status.textContent = "Your inquiry was not confirmed. Please try again or contact CHIGOX by email.";
        status.style.color = "#a33b2f";
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  };

  const start = async () => {
    const forms = [...document.querySelectorAll("form.inquiry-form")];
    if (!forms.length) return;

    try {
      const [configResponse, turnstile] = await Promise.all([
        fetch(API_URL, { credentials: "same-origin", cache: "no-store" }),
        loadTurnstile(),
      ]);
      if (!configResponse.ok) return;
      const config = await configResponse.json();
      if (!config.enabled || !config.site_key || config.action !== "inquiry_form") return;
      await Promise.all(forms.map((form) => initializeForm(form, config, turnstile)));
    } catch {
      // Never fall back to an external mail client or a non-HTTPS endpoint.
      // The form action remains the same-origin API route.
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();

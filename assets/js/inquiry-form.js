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
      // Attribution remains optional when browser storage is unavailable.
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
      utm_content: (search.get("utm_content") || "").slice(0, 160),
      utm_term: (search.get("utm_term") || "").slice(0, 160),
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

  const initializeForm = (form) => {
    if (initializedForms.has(form)) return;
    initializedForms.add(form);

    const attribution = readAttribution();
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    const status = makeStatus();
    if (submitButton) {
      form.insertBefore(makeHoneypot(), submitButton);
      form.insertBefore(status, submitButton);
    } else {
      form.append(makeHoneypot(), status);
    }

    let formStarted = false;
    form.addEventListener("input", () => {
      if (formStarted) return;
      formStarted = true;
      pushAnalytics("form_start");
    });

    // The standard implicit Turnstile widget creates cf-turnstile-response itself.
    // This handler never renders, executes, resets, or otherwise manages the widget.
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "";
      status.style.color = "#5d6d7c";

      const formData = new FormData(form);
      const turnstileToken = readField(formData, "cf-turnstile-response");
      if (!turnstileToken) {
        status.textContent = "Please complete the verification before sending your inquiry.";
        status.style.color = "#a33b2f";
        return;
      }

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
        utm_content: attribution.utm_content,
        utm_term: attribution.utm_term,
      };

      try {
        if (submitButton) submitButton.disabled = true;
        status.textContent = "Sending your inquiry…";

        const response = await fetch(API_URL, {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.lead_saved) throw new Error(result.error || "submission_failed");

        form.reset();
        status.textContent = `Thank you. Your inquiry reference is ${result.lead_id}.`;
        status.style.color = "#087474";

        // No names, emails, companies, messages, or other personal fields are sent to GA4.
        if (result.analytics_event === "generate_lead") pushAnalytics("generate_lead");
      } catch {
        status.textContent = "Your inquiry was not confirmed. Please try again or contact CHIGOX by email.";
        status.style.color = "#a33b2f";
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  };

  const start = () => {
    const forms = [...document.querySelectorAll('form.inquiry-form[data-inquiry-turnstile="implicit"]')];
    forms.forEach((form) => initializeForm(form));
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();

(() => {
  const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  const messages = {
    en: {
      sending: "Sending your inquiry...",
      success: "Thank you. Your inquiry has been sent.",
      error: "Your inquiry could not be sent. Please try again."
    },
    fr: {
      sending: "Envoi de votre demande...",
      success: "Merci. Votre demande a bien été envoyée.",
      error: "Votre demande n'a pas pu être envoyée. Veuillez réessayer."
    },
    "pt-BR": {
      sending: "Enviando sua solicitação...",
      success: "Obrigado. Sua solicitação foi enviada.",
      error: "Não foi possível enviar sua solicitação. Tente novamente."
    }
  };

  const pageLanguage = () => {
    const language = String(document.documentElement.lang || "en").toLowerCase();
    if (language.startsWith("pt")) return "pt-BR";
    return messages[language.split("-")[0]] ? language.split("-")[0] : "en";
  };

  const message = () => messages[pageLanguage()];

  const loadTurnstileScript = () => {
    if (document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)) return;

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.head.append(script);
  };

  const insertTurnstileWidget = (form, siteKey) => {
    if (form.querySelector(".cf-turnstile")) return;

    const widget = document.createElement("div");
    widget.className = "cf-turnstile";
    widget.dataset.sitekey = siteKey;

    const submitButton = form.querySelector('button[type="submit"], button');
    if (submitButton) {
      submitButton.before(widget);
      return;
    }

    form.append(widget);
  };

  const statusElement = (form) => {
    let status = form.querySelector(".inquiry-form-status");
    if (status) return status;

    status = document.createElement("p");
    status.className = "inquiry-form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const submitButton = form.querySelector('button[type="submit"], button');
    if (submitButton) submitButton.after(status);
    else form.append(status);
    return status;
  };

  const setupInquirySubmission = (form) => {
    if (form.dataset.inquirySubmissionReady === "true") return;
    form.dataset.inquirySubmissionReady = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (form.dataset.inquirySubmitting === "true") return;

      const copy = message();
      const status = statusElement(form);
      const submitButton = form.querySelector('button[type="submit"], button');
      form.dataset.inquirySubmitting = "true";
      if (submitButton) submitButton.disabled = true;
      status.dataset.state = "pending";
      status.textContent = copy.sending;

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { accept: "application/json" }
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) throw new Error("Inquiry request was not accepted.");

        window.CHIGOXAnalytics?.trackGenerateLead?.(form);
        status.dataset.state = "success";
        status.textContent = copy.success;
        form.reset();
        window.turnstile?.reset?.();
      } catch (error) {
        console.warn("Inquiry submission could not be completed.", error);
        status.dataset.state = "error";
        status.textContent = copy.error;
      } finally {
        delete form.dataset.inquirySubmitting;
        if (submitButton) submitButton.disabled = false;
      }
    });
  };

  const setupTurnstile = async () => {
    const forms = [...document.querySelectorAll('form[action="/api/inquiry"]')];
    if (!forms.length) return;
    forms.forEach(setupInquirySubmission);

    try {
      const response = await fetch("/api/inquiry", {
        headers: { accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Inquiry endpoint config request failed.");

      const config = await response.json();
      const siteKey = String(config.turnstileSiteKey || "").trim();
      if (!siteKey) {
        console.warn("Inquiry verification is not configured.");
        return;
      }

      forms.forEach((form) => insertTurnstileWidget(form, siteKey));
      loadTurnstileScript();
    } catch (error) {
      console.warn("Inquiry verification could not be loaded.", error);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupTurnstile);
    return;
  }

  setupTurnstile();
})();

(() => {
  const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

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

  const setupTurnstile = async () => {
    const forms = [...document.querySelectorAll('form[action="/api/inquiry"]')];
    if (!forms.length) return;

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

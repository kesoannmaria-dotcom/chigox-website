(() => {
  const classifyInquirySource = ({ utmSource, referrer }) => {
    const normalize = (value) => String(value || "").toLowerCase();
    const bucket = (value) => {
      const text = normalize(value);
      if (!text) return "";
      if (text.includes("google")) return "Google";
      if (text.includes("facebook") || text.includes("fb.com") || text.includes("instagram") || text.includes("meta")) return "Facebook";
      if (text.includes("direct")) return "Direct";
      return "";
    };
    const utmBucket = bucket(utmSource);
    if (utmSource) return utmBucket || "Referral";
    if (!referrer) return "Direct";

    let referrerHost = "";
    try {
      referrerHost = new URL(referrer).hostname;
    } catch {
      referrerHost = referrer;
    }

    if (!referrerHost || referrerHost.endsWith("chigox.com")) return "Direct";
    return bucket(referrerHost) || "Referral";
  };

  const ensureField = (form, name) => {
    const existing = form.elements[name];
    if (existing) return existing;

    const field = document.createElement("input");
    field.type = "hidden";
    field.name = name;
    form.append(field);
    return field;
  };

  const params = new URLSearchParams(window.location.search);
  const attribution = {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_term: params.get("utm_term") || "",
    utm_content: params.get("utm_content") || "",
    referrer: document.referrer || "",
    landing_page: `${window.location.pathname}${window.location.search}`,
    submitted_page: window.location.href
  };

  attribution.source = classifyInquirySource({
    utmSource: attribution.utm_source,
    referrer: attribution.referrer
  });

  const applyAttribution = (form) => {
    attribution.submitted_page = window.location.href;
    Object.entries(attribution).forEach(([name, value]) => {
      ensureField(form, name).value = value;
    });
  };

  document.querySelectorAll('form[action="/api/inquiry"]').forEach((form) => {
    applyAttribution(form);
    form.addEventListener("submit", () => applyAttribution(form));
  });
})();

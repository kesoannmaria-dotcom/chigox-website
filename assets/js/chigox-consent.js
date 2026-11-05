(() => {
  "use strict";

  const STORAGE_KEY = "chigox_consent_v2";
  const STORAGE_VERSION = 2;
  const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
  const GTM_SCRIPT_ID = "chigox-gtm-script";

  const translations = {
    en: {
      bannerTitle: "Your privacy choices",
      bannerText: "We use optional analytics cookies to understand website use and improve CHIGOX. Advertising cookies are optional. Necessary cookies are always active.",
      acceptAll: "Accept all",
      rejectAll: "Reject all",
      customize: "Customize settings",
      settingsTitle: "Cookie settings",
      settingsText: "Choose which optional cookies CHIGOX may use. You can change these settings at any time.",
      necessary: "Necessary cookies",
      necessaryText: "Required for security and core website functions. Always active.",
      analytics: "Analytics cookies",
      analyticsText: "Help us understand how visitors use the website so we can improve it.",
      advertising: "Advertising cookies",
      advertisingText: "Allow measurement related to advertising performance. No advertising cookies are used without your choice.",
      save: "Save choices",
      cancel: "Cancel",
      close: "Close cookie settings",
      footer: "Cookie settings"
    },
    es: {
      bannerTitle: "Tus opciones de privacidad",
      bannerText: "Utilizamos cookies analíticas opcionales para comprender el uso del sitio y mejorar CHIGOX. Las cookies publicitarias son opcionales. Las cookies necesarias están siempre activas.",
      acceptAll: "Aceptar todo",
      rejectAll: "Rechazar todo",
      customize: "Configurar",
      settingsTitle: "Configuración de cookies",
      settingsText: "Elige qué cookies opcionales puede utilizar CHIGOX. Puedes cambiar esta configuración en cualquier momento.",
      necessary: "Cookies necesarias",
      necessaryText: "Necesarias para la seguridad y las funciones básicas del sitio. Siempre activas.",
      analytics: "Cookies analíticas",
      analyticsText: "Nos ayudan a comprender cómo se utiliza el sitio para poder mejorarlo.",
      advertising: "Cookies publicitarias",
      advertisingText: "Permiten medir el rendimiento publicitario. No se utilizan sin tu elección.",
      save: "Guardar opciones",
      cancel: "Cancelar",
      close: "Cerrar configuración de cookies",
      footer: "Configuración de cookies"
    },
    fr: {
      bannerTitle: "Vos choix de confidentialité",
      bannerText: "Nous utilisons des cookies analytiques facultatifs pour comprendre l'utilisation du site et améliorer CHIGOX. Les cookies publicitaires sont facultatifs. Les cookies nécessaires restent toujours actifs.",
      acceptAll: "Tout accepter",
      rejectAll: "Tout refuser",
      customize: "Personnaliser",
      settingsTitle: "Paramètres des cookies",
      settingsText: "Choisissez les cookies facultatifs que CHIGOX peut utiliser. Vous pouvez modifier ces choix à tout moment.",
      necessary: "Cookies nécessaires",
      necessaryText: "Indispensables à la sécurité et aux fonctions essentielles du site. Toujours actifs.",
      analytics: "Cookies analytiques",
      analyticsText: "Ils nous aident à comprendre l'utilisation du site afin de l'améliorer.",
      advertising: "Cookies publicitaires",
      advertisingText: "Ils permettent de mesurer les performances publicitaires. Ils ne sont pas utilisés sans votre choix.",
      save: "Enregistrer mes choix",
      cancel: "Annuler",
      close: "Fermer les paramètres des cookies",
      footer: "Paramètres des cookies"
    },
    "pt-BR": {
      bannerTitle: "Suas escolhas de privacidade",
      bannerText: "Usamos cookies opcionais de análise para entender o uso do site e melhorar a CHIGOX. Cookies de publicidade são opcionais. Cookies necessários permanecem sempre ativos.",
      acceptAll: "Aceitar todos",
      rejectAll: "Rejeitar todos",
      customize: "Personalizar",
      settingsTitle: "Configurações de cookies",
      settingsText: "Escolha quais cookies opcionais a CHIGOX pode usar. Você pode alterar essas escolhas a qualquer momento.",
      necessary: "Cookies necessários",
      necessaryText: "Necessários para a segurança e as funções essenciais do site. Sempre ativos.",
      analytics: "Cookies de análise",
      analyticsText: "Ajudam a entender como o site é usado para que possamos melhorá-lo.",
      advertising: "Cookies de publicidade",
      advertisingText: "Permitem medir o desempenho de publicidade. Não são usados sem a sua escolha.",
      save: "Salvar escolhas",
      cancel: "Cancelar",
      close: "Fechar configurações de cookies",
      footer: "Configurações de cookies"
    },
    de: {
      bannerTitle: "Ihre Datenschutzauswahl",
      bannerText: "Wir verwenden optionale Analyse-Cookies, um die Nutzung der Website zu verstehen und CHIGOX zu verbessern. Werbe-Cookies sind optional. Notwendige Cookies sind immer aktiv.",
      acceptAll: "Alle akzeptieren",
      rejectAll: "Alle ablehnen",
      customize: "Einstellungen anpassen",
      settingsTitle: "Cookie-Einstellungen",
      settingsText: "Wählen Sie aus, welche optionalen Cookies CHIGOX verwenden darf. Sie können diese Auswahl jederzeit ändern.",
      necessary: "Notwendige Cookies",
      necessaryText: "Für Sicherheit und grundlegende Website-Funktionen erforderlich. Immer aktiv.",
      analytics: "Analyse-Cookies",
      analyticsText: "Sie helfen uns zu verstehen, wie die Website genutzt wird, damit wir sie verbessern können.",
      advertising: "Werbe-Cookies",
      advertisingText: "Ermöglichen die Messung der Werbeleistung. Ohne Ihre Auswahl werden sie nicht verwendet.",
      save: "Auswahl speichern",
      cancel: "Abbrechen",
      close: "Cookie-Einstellungen schließen",
      footer: "Cookie-Einstellungen"
    },
    it: {
      bannerTitle: "Le tue scelte sulla privacy",
      bannerText: "Utilizziamo cookie analitici facoltativi per comprendere l'uso del sito e migliorare CHIGOX. I cookie pubblicitari sono facoltativi. I cookie necessari sono sempre attivi.",
      acceptAll: "Accetta tutto",
      rejectAll: "Rifiuta tutto",
      customize: "Personalizza",
      settingsTitle: "Impostazioni dei cookie",
      settingsText: "Scegli quali cookie facoltativi può utilizzare CHIGOX. Puoi modificare queste scelte in qualsiasi momento.",
      necessary: "Cookie necessari",
      necessaryText: "Necessari per la sicurezza e le funzioni essenziali del sito. Sempre attivi.",
      analytics: "Cookie analitici",
      analyticsText: "Ci aiutano a capire come viene utilizzato il sito per poterlo migliorare.",
      advertising: "Cookie pubblicitari",
      advertisingText: "Consentono di misurare le prestazioni pubblicitarie. Non vengono utilizzati senza la tua scelta.",
      save: "Salva le scelte",
      cancel: "Annulla",
      close: "Chiudi le impostazioni dei cookie",
      footer: "Impostazioni dei cookie"
    },
    pl: {
      bannerTitle: "Twoje ustawienia prywatności",
      bannerText: "Używamy opcjonalnych plików cookie do analizy korzystania z witryny i ulepszania CHIGOX. Reklamowe pliki cookie są opcjonalne. Niezbędne pliki cookie są zawsze aktywne.",
      acceptAll: "Akceptuj wszystkie",
      rejectAll: "Odrzuć wszystkie",
      customize: "Dostosuj ustawienia",
      settingsTitle: "Ustawienia plików cookie",
      settingsText: "Wybierz, z których opcjonalnych plików cookie może korzystać CHIGOX. Ustawienia można zmienić w dowolnym momencie.",
      necessary: "Niezbędne pliki cookie",
      necessaryText: "Wymagane do zapewnienia bezpieczeństwa i podstawowego działania witryny. Zawsze aktywne.",
      analytics: "Analityczne pliki cookie",
      analyticsText: "Pomagają nam zrozumieć sposób korzystania z witryny i ją ulepszać.",
      advertising: "Reklamowe pliki cookie",
      advertisingText: "Umożliwiają pomiar skuteczności reklam. Nie są używane bez Twojej zgody.",
      save: "Zapisz ustawienia",
      cancel: "Anuluj",
      close: "Zamknij ustawienia plików cookie",
      footer: "Ustawienia plików cookie"
    },
    tr: {
      bannerTitle: "Gizlilik tercihleriniz",
      bannerText: "Site kullanımını anlamak ve CHIGOX'u geliştirmek için isteğe bağlı analiz çerezleri kullanıyoruz. Reklam çerezleri isteğe bağlıdır. Zorunlu çerezler her zaman etkindir.",
      acceptAll: "Tümünü kabul et",
      rejectAll: "Tümünü reddet",
      customize: "Ayarları özelleştir",
      settingsTitle: "Çerez ayarları",
      settingsText: "CHIGOX'un kullanabileceği isteğe bağlı çerezleri seçin. Bu tercihleri istediğiniz zaman değiştirebilirsiniz.",
      necessary: "Zorunlu çerezler",
      necessaryText: "Güvenlik ve temel site işlevleri için gereklidir. Her zaman etkindir.",
      analytics: "Analiz çerezleri",
      analyticsText: "Siteyi nasıl kullandığınızı anlamamıza ve geliştirmemize yardımcı olur.",
      advertising: "Reklam çerezleri",
      advertisingText: "Reklam performansının ölçülmesini sağlar. Tercihiniz olmadan kullanılmaz.",
      save: "Tercihleri kaydet",
      cancel: "İptal",
      close: "Çerez ayarlarını kapat",
      footer: "Çerez ayarları"
    },
    ko: {
      bannerTitle: "개인정보 보호 선택",
      bannerText: "CHIGOX는 웹사이트 이용 현황을 파악하고 서비스를 개선하기 위해 선택적 분석 쿠키를 사용합니다. 광고 쿠키는 선택 사항이며, 필수 쿠키는 항상 활성화됩니다.",
      acceptAll: "모두 허용",
      rejectAll: "모두 거부",
      customize: "설정 관리",
      settingsTitle: "쿠키 설정",
      settingsText: "CHIGOX가 사용할 수 있는 선택적 쿠키를 지정하세요. 언제든지 설정을 변경할 수 있습니다.",
      necessary: "필수 쿠키",
      necessaryText: "보안과 웹사이트의 기본 기능에 필요하며 항상 활성화됩니다.",
      analytics: "분석 쿠키",
      analyticsText: "웹사이트 이용 방식을 파악하여 서비스를 개선하는 데 사용됩니다.",
      advertising: "광고 쿠키",
      advertisingText: "광고 성과 측정을 허용합니다. 사용자가 선택하기 전에는 사용되지 않습니다.",
      save: "선택 저장",
      cancel: "취소",
      close: "쿠키 설정 닫기",
      footer: "쿠키 설정"
    }
  };

  const normalizeLanguage = (value) => {
    const language = String(value || "en").toLowerCase();
    if (language.startsWith("pt")) return "pt-BR";
    const short = language.split("-")[0];
    return translations[short] ? short : "en";
  };

  const language = normalizeLanguage(document.documentElement.lang);
  const copy = translations[language];
  const scriptElement = document.currentScript;
  const gtmId = scriptElement?.dataset.gtmId || "";
  let currentConsent = null;
  let lastFocusedElement = null;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const consentValues = (state) => ({
    analytics_storage: state?.analytics ? "granted" : "denied",
    ad_storage: state?.advertising ? "granted" : "denied",
    ad_user_data: state?.advertising ? "granted" : "denied",
    ad_personalization: state?.advertising ? "granted" : "denied",
    functionality_storage: "granted",
    security_storage: "granted"
  });

  window.gtag("consent", "default", consentValues(null));

  const readConsent = () => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      const valid = parsed &&
        parsed.version === STORAGE_VERSION &&
        typeof parsed.analytics === "boolean" &&
        typeof parsed.advertising === "boolean" &&
        Number.isFinite(parsed.updatedAt) &&
        Number.isFinite(parsed.expiresAt) &&
        parsed.expiresAt > Date.now();

      if (!valid) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };

  const writeConsent = ({ analytics, advertising }) => {
    const updatedAt = Date.now();
    const state = {
      version: STORAGE_VERSION,
      analytics: Boolean(analytics),
      advertising: Boolean(advertising),
      updatedAt,
      expiresAt: updatedAt + CONSENT_LIFETIME_MS
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Consent still applies to this page even if browser storage is unavailable.
    }

    return state;
  };

  const loadGtm = () => {
    if (!gtmId || document.getElementById(GTM_SCRIPT_ID)) return;

    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.id = GTM_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    document.head.append(script);
  };

  const updateGtmConsent = (state) => {
    window.gtag("consent", "update", consentValues(state));
    window.dataLayer.push({
      event: "chigox_consent_update",
      consent_analytics: state.analytics ? "granted" : "denied",
      consent_advertising: state.advertising ? "granted" : "denied"
    });
  };

  currentConsent = readConsent();
  if (currentConsent) {
    updateGtmConsent(currentConsent);
    if (currentConsent.analytics) loadGtm();
  }

  const createChoice = ({ label, description, checked = false, disabled = false, name }) => {
    const row = document.createElement("label");
    row.className = "chigox-cookie-choice";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.disabled = disabled;
    input.dataset.consentChoice = name;
    const text = document.createElement("span");
    text.innerHTML = `<strong>${label}</strong><small>${description}</small>`;
    row.append(input, text);
    return row;
  };

  const renderControls = () => {
    const banner = document.createElement("section");
    banner.className = "chigox-cookie-banner";
    banner.dataset.cookieBanner = "";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-labelledby", "chigox-cookie-title");
    banner.hidden = Boolean(currentConsent);
    banner.innerHTML = `
      <div class="chigox-cookie-copy">
        <h2 id="chigox-cookie-title">${copy.bannerTitle}</h2>
        <p>${copy.bannerText}</p>
      </div>
      <div class="chigox-cookie-actions">
        <button type="button" class="chigox-cookie-button chigox-cookie-primary" data-consent-accept>${copy.acceptAll}</button>
        <button type="button" class="chigox-cookie-button" data-consent-reject>${copy.rejectAll}</button>
        <button type="button" class="chigox-cookie-link" data-consent-customize>${copy.customize}</button>
      </div>`;

    const modal = document.createElement("div");
    modal.className = "chigox-cookie-modal";
    modal.dataset.cookieModal = "";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="chigox-cookie-dialog" role="dialog" aria-modal="true" aria-labelledby="chigox-cookie-settings-title">
        <button type="button" class="chigox-cookie-close" data-consent-close aria-label="${copy.close}">×</button>
        <h2 id="chigox-cookie-settings-title">${copy.settingsTitle}</h2>
        <p>${copy.settingsText}</p>
        <div class="chigox-cookie-choices"></div>
        <div class="chigox-cookie-dialog-actions">
          <button type="button" class="chigox-cookie-button chigox-cookie-primary" data-consent-save>${copy.save}</button>
          <button type="button" class="chigox-cookie-button" data-consent-close>${copy.cancel}</button>
        </div>
      </div>`;

    const choices = modal.querySelector(".chigox-cookie-choices");
    choices.append(
      createChoice({ label: copy.necessary, description: copy.necessaryText, checked: true, disabled: true, name: "necessary" }),
      createChoice({ label: copy.analytics, description: copy.analyticsText, checked: false, name: "analytics" }),
      createChoice({ label: copy.advertising, description: copy.advertisingText, checked: false, name: "advertising" })
    );

    document.body.append(banner, modal);

    const analyticsChoice = modal.querySelector('[data-consent-choice="analytics"]');
    const advertisingChoice = modal.querySelector('[data-consent-choice="advertising"]');

    const closeSettings = () => {
      modal.hidden = true;
      document.documentElement.classList.remove("chigox-cookie-dialog-open");
      lastFocusedElement?.focus?.();
    };

    const openSettings = () => {
      lastFocusedElement = document.activeElement;
      analyticsChoice.checked = Boolean(currentConsent?.analytics);
      advertisingChoice.checked = Boolean(currentConsent?.advertising);
      modal.hidden = false;
      document.documentElement.classList.add("chigox-cookie-dialog-open");
      modal.querySelector("[data-consent-save]").focus();
    };

    const applyConsent = (next) => {
      const previouslyGranted = Boolean(currentConsent?.analytics);
      currentConsent = writeConsent(next);
      updateGtmConsent(currentConsent);
      banner.hidden = true;
      closeSettings();

      if (currentConsent.analytics) {
        loadGtm();
      } else if (previouslyGranted) {
        window.setTimeout(() => window.location.reload(), 50);
      }
    };

    banner.querySelector("[data-consent-accept]").addEventListener("click", () => applyConsent({ analytics: true, advertising: true }));
    banner.querySelector("[data-consent-reject]").addEventListener("click", () => applyConsent({ analytics: false, advertising: false }));
    banner.querySelector("[data-consent-customize]").addEventListener("click", openSettings);
    modal.querySelector("[data-consent-save]").addEventListener("click", () => applyConsent({ analytics: analyticsChoice.checked, advertising: advertisingChoice.checked }));
    modal.querySelectorAll("[data-consent-close]").forEach((button) => button.addEventListener("click", closeSettings));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeSettings();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeSettings();
    });

    document.querySelectorAll("[data-cookie-settings]").forEach((button) => {
      button.textContent = copy.footer;
      button.setAttribute("aria-label", copy.footer);
      button.addEventListener("click", openSettings);
    });

    window.CHIGOXConsent.openSettings = openSettings;
  };

  window.CHIGOXConsent = {
    hasAnalyticsConsent: () => Boolean(currentConsent?.analytics),
    getState: () => currentConsent ? { ...currentConsent } : null,
    openSettings: () => {}
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderControls, { once: true });
  } else {
    renderControls();
  }
})();

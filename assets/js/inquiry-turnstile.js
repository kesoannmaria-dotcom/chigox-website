(() => {
  const API_URL = "/api/inquiry";
  const TURNSTILE_SCRIPT_SRC =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

  const COPY = {
    en: {
      loading: "Preparing secure submission...",
      ready: "Security verification ready.",
      sending: "Sending your inquiry...",
      success: "Thank you. Your inquiry has been received.",
      CONFIG_UNAVAILABLE: "Inquiry service is temporarily unavailable. Please try again later.",
      VERIFICATION_REQUIRED: "Please complete the security verification.",
      VERIFICATION_FAILED: "Security verification failed. Please try again.",
      NAME_REQUIRED: "Please enter your name.",
      EMAIL_REQUIRED: "Please enter your email address.",
      EMAIL_INVALID: "Please enter a valid email address.",
      MESSAGE_REQUIRED: "Please enter your inquiry message.",
      FIELD_TOO_LONG: "One or more fields are too long.",
      INVALID_LANGUAGE: "The selected language is invalid.",
      INVALID_PAGE_URL: "The page address is invalid.",
      INVALID_IDEMPOTENCY_KEY: "The request identifier is invalid. Please reload and try again.",
      IDEMPOTENCY_CONFLICT: "This form was already submitted with different content. Please reload and try again.",
      STORAGE_UNAVAILABLE: "Your inquiry could not be saved. Please try again.",
      RATE_LIMITED: "Too many requests. Please wait and try again.",
      default: "Your inquiry could not be sent. Please check the form and try again."
    },
    es: {
      loading: "Preparando el envío seguro...",
      ready: "Verificación de seguridad lista.",
      sending: "Enviando su consulta...",
      success: "Gracias. Hemos recibido su consulta.",
      CONFIG_UNAVAILABLE: "El servicio de consultas no está disponible temporalmente.",
      VERIFICATION_REQUIRED: "Complete la verificación de seguridad.",
      VERIFICATION_FAILED: "La verificación de seguridad falló. Inténtelo de nuevo.",
      NAME_REQUIRED: "Introduzca su nombre.",
      EMAIL_REQUIRED: "Introduzca su dirección de correo electrónico.",
      EMAIL_INVALID: "Introduzca una dirección de correo válida.",
      MESSAGE_REQUIRED: "Escriba el mensaje de su consulta.",
      FIELD_TOO_LONG: "Uno o varios campos son demasiado largos.",
      INVALID_LANGUAGE: "El idioma seleccionado no es válido.",
      INVALID_PAGE_URL: "La dirección de la página no es válida.",
      INVALID_IDEMPOTENCY_KEY: "El identificador de la solicitud no es válido. Recargue la página e inténtelo de nuevo.",
      IDEMPOTENCY_CONFLICT: "Este formulario ya se envió con otro contenido. Recargue la página e inténtelo de nuevo.",
      STORAGE_UNAVAILABLE: "No se pudo guardar la consulta. Inténtelo de nuevo.",
      RATE_LIMITED: "Demasiadas solicitudes. Espere e inténtelo de nuevo.",
      default: "No se pudo enviar la consulta. Revise el formulario e inténtelo de nuevo."
    },
    tr: {
      loading: "Güvenli gönderim hazırlanıyor...",
      ready: "Güvenlik doğrulaması hazır.",
      sending: "Talebiniz gönderiliyor...",
      success: "Teşekkürler. Talebiniz alındı.",
      CONFIG_UNAVAILABLE: "Talep hizmeti geçici olarak kullanılamıyor.",
      VERIFICATION_REQUIRED: "Lütfen güvenlik doğrulamasını tamamlayın.",
      VERIFICATION_FAILED: "Güvenlik doğrulaması başarısız oldu. Tekrar deneyin.",
      NAME_REQUIRED: "Lütfen adınızı girin.",
      EMAIL_REQUIRED: "Lütfen e-posta adresinizi girin.",
      EMAIL_INVALID: "Geçerli bir e-posta adresi girin.",
      MESSAGE_REQUIRED: "Lütfen talep mesajınızı yazın.",
      FIELD_TOO_LONG: "Bir veya daha fazla alan çok uzun.",
      INVALID_LANGUAGE: "Seçilen dil geçersiz.",
      INVALID_PAGE_URL: "Sayfa adresi geçersiz.",
      INVALID_IDEMPOTENCY_KEY: "İstek kimliği geçersiz. Sayfayı yenileyip tekrar deneyin.",
      IDEMPOTENCY_CONFLICT: "Bu form daha önce farklı içerikle gönderildi. Sayfayı yenileyip tekrar deneyin.",
      STORAGE_UNAVAILABLE: "Talebiniz kaydedilemedi. Lütfen tekrar deneyin.",
      RATE_LIMITED: "Çok fazla istek gönderildi. Lütfen bekleyip tekrar deneyin.",
      default: "Talebiniz gönderilemedi. Formu kontrol edip tekrar deneyin."
    },
    de: {
      loading: "Sichere Übermittlung wird vorbereitet...",
      ready: "Sicherheitsprüfung ist bereit.",
      sending: "Ihre Anfrage wird gesendet...",
      success: "Vielen Dank. Ihre Anfrage ist eingegangen.",
      CONFIG_UNAVAILABLE: "Der Anfragedienst ist vorübergehend nicht verfügbar.",
      VERIFICATION_REQUIRED: "Bitte schließen Sie die Sicherheitsprüfung ab.",
      VERIFICATION_FAILED: "Die Sicherheitsprüfung ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
      NAME_REQUIRED: "Bitte geben Sie Ihren Namen ein.",
      EMAIL_REQUIRED: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
      EMAIL_INVALID: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      MESSAGE_REQUIRED: "Bitte geben Sie Ihre Anfrage ein.",
      FIELD_TOO_LONG: "Ein oder mehrere Felder sind zu lang.",
      INVALID_LANGUAGE: "Die ausgewählte Sprache ist ungültig.",
      INVALID_PAGE_URL: "Die Seitenadresse ist ungültig.",
      INVALID_IDEMPOTENCY_KEY: "Die Anfragekennung ist ungültig. Bitte laden Sie die Seite neu und versuchen Sie es erneut.",
      IDEMPOTENCY_CONFLICT: "Dieses Formular wurde bereits mit anderem Inhalt gesendet. Bitte laden Sie die Seite neu.",
      STORAGE_UNAVAILABLE: "Ihre Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
      RATE_LIMITED: "Zu viele Anfragen. Bitte warten Sie und versuchen Sie es erneut.",
      default: "Ihre Anfrage konnte nicht gesendet werden. Bitte prüfen Sie das Formular."
    },
    it: {
      loading: "Preparazione dell'invio sicuro...",
      ready: "Verifica di sicurezza pronta.",
      sending: "Invio della richiesta...",
      success: "Grazie. La richiesta è stata ricevuta.",
      CONFIG_UNAVAILABLE: "Il servizio richieste non è temporaneamente disponibile.",
      VERIFICATION_REQUIRED: "Completa la verifica di sicurezza.",
      VERIFICATION_FAILED: "Verifica di sicurezza non riuscita. Riprova.",
      NAME_REQUIRED: "Inserisci il tuo nome.",
      EMAIL_REQUIRED: "Inserisci il tuo indirizzo email.",
      EMAIL_INVALID: "Inserisci un indirizzo email valido.",
      MESSAGE_REQUIRED: "Inserisci il messaggio della richiesta.",
      FIELD_TOO_LONG: "Uno o più campi sono troppo lunghi.",
      INVALID_LANGUAGE: "La lingua selezionata non è valida.",
      INVALID_PAGE_URL: "L'indirizzo della pagina non è valido.",
      INVALID_IDEMPOTENCY_KEY: "L'identificativo della richiesta non è valido. Ricarica la pagina e riprova.",
      IDEMPOTENCY_CONFLICT: "Questo modulo è già stato inviato con contenuti diversi. Ricarica la pagina e riprova.",
      STORAGE_UNAVAILABLE: "Non è stato possibile salvare la richiesta. Riprova.",
      RATE_LIMITED: "Troppe richieste. Attendi e riprova.",
      default: "Impossibile inviare la richiesta. Controlla il modulo e riprova."
    },
    pl: {
      loading: "Przygotowywanie bezpiecznego wysyłania...",
      ready: "Weryfikacja bezpieczeństwa jest gotowa.",
      sending: "Wysyłanie zapytania...",
      success: "Dziękujemy. Zapytanie zostało odebrane.",
      CONFIG_UNAVAILABLE: "Usługa zapytań jest tymczasowo niedostępna.",
      VERIFICATION_REQUIRED: "Ukończ weryfikację bezpieczeństwa.",
      VERIFICATION_FAILED: "Weryfikacja bezpieczeństwa nie powiodła się. Spróbuj ponownie.",
      NAME_REQUIRED: "Wpisz swoje imię i nazwisko.",
      EMAIL_REQUIRED: "Wpisz swój adres e-mail.",
      EMAIL_INVALID: "Wprowadź prawidłowy adres e-mail.",
      MESSAGE_REQUIRED: "Wpisz treść zapytania.",
      FIELD_TOO_LONG: "Co najmniej jedno pole jest zbyt długie.",
      INVALID_LANGUAGE: "Wybrany język jest nieprawidłowy.",
      INVALID_PAGE_URL: "Adres strony jest nieprawidłowy.",
      INVALID_IDEMPOTENCY_KEY: "Identyfikator żądania jest nieprawidłowy. Odśwież stronę i spróbuj ponownie.",
      IDEMPOTENCY_CONFLICT: "Ten formularz został już wysłany z inną treścią. Odśwież stronę i spróbuj ponownie.",
      STORAGE_UNAVAILABLE: "Nie udało się zapisać zapytania. Spróbuj ponownie.",
      RATE_LIMITED: "Zbyt wiele prób. Poczekaj i spróbuj ponownie.",
      default: "Nie udało się wysłać zapytania. Sprawdź formularz i spróbuj ponownie."
    },
    ko: {
      loading: "안전한 제출을 준비하고 있습니다...",
      ready: "보안 인증이 준비되었습니다.",
      sending: "문의를 전송하고 있습니다...",
      success: "감사합니다. 문의가 접수되었습니다.",
      CONFIG_UNAVAILABLE: "문의 서비스가 일시적으로 제공되지 않습니다.",
      VERIFICATION_REQUIRED: "보안 인증을 완료해 주세요.",
      VERIFICATION_FAILED: "보안 인증에 실패했습니다. 다시 시도해 주세요.",
      NAME_REQUIRED: "이름을 입력해 주세요.",
      EMAIL_REQUIRED: "이메일 주소를 입력해 주세요.",
      EMAIL_INVALID: "유효한 이메일 주소를 입력해 주세요.",
      MESSAGE_REQUIRED: "문의 내용을 입력해 주세요.",
      FIELD_TOO_LONG: "하나 이상의 입력 내용이 너무 깁니다.",
      INVALID_LANGUAGE: "선택한 언어가 올바르지 않습니다.",
      INVALID_PAGE_URL: "페이지 주소가 올바르지 않습니다.",
      INVALID_IDEMPOTENCY_KEY: "요청 식별자가 올바르지 않습니다. 페이지를 새로 고친 후 다시 시도해 주세요.",
      IDEMPOTENCY_CONFLICT: "이 양식은 다른 내용으로 이미 제출되었습니다. 페이지를 새로 고친 후 다시 시도해 주세요.",
      STORAGE_UNAVAILABLE: "문의를 저장할 수 없습니다. 다시 시도해 주세요.",
      RATE_LIMITED: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      default: "문의를 전송하지 못했습니다. 양식을 확인하고 다시 시도해 주세요."
    },
    fr: {
      loading: "Préparation de l'envoi sécurisé...",
      ready: "La vérification de sécurité est prête.",
      sending: "Envoi de votre demande...",
      success: "Merci. Votre demande a bien été reçue.",
      CONFIG_UNAVAILABLE: "Le service de demande est temporairement indisponible.",
      VERIFICATION_REQUIRED: "Veuillez effectuer la vérification de sécurité.",
      VERIFICATION_FAILED: "La vérification de sécurité a échoué. Veuillez réessayer.",
      NAME_REQUIRED: "Veuillez saisir votre nom.",
      EMAIL_REQUIRED: "Veuillez saisir votre adresse e-mail.",
      EMAIL_INVALID: "Veuillez saisir une adresse e-mail valide.",
      MESSAGE_REQUIRED: "Veuillez saisir le contenu de votre demande.",
      FIELD_TOO_LONG: "Un ou plusieurs champs sont trop longs.",
      INVALID_LANGUAGE: "La langue sélectionnée n'est pas valide.",
      INVALID_PAGE_URL: "L'adresse de la page n'est pas valide.",
      INVALID_IDEMPOTENCY_KEY: "L'identifiant de la demande n'est pas valide. Rechargez la page et réessayez.",
      IDEMPOTENCY_CONFLICT: "Ce formulaire a déjà été envoyé avec un contenu différent. Rechargez la page et réessayez.",
      STORAGE_UNAVAILABLE: "Votre demande n'a pas pu être enregistrée. Veuillez réessayer.",
      RATE_LIMITED: "Trop de demandes. Patientez avant de réessayer.",
      default: "Votre demande n'a pas pu être envoyée. Vérifiez le formulaire."
    },
    pt: {
      loading: "Preparando o envio seguro...",
      ready: "Verificação de segurança pronta.",
      sending: "Enviando sua consulta...",
      success: "Obrigado. Sua consulta foi recebida.",
      CONFIG_UNAVAILABLE: "O serviço de consultas está temporariamente indisponível.",
      VERIFICATION_REQUIRED: "Conclua a verificação de segurança.",
      VERIFICATION_FAILED: "A verificação de segurança falhou. Tente novamente.",
      NAME_REQUIRED: "Informe seu nome.",
      EMAIL_REQUIRED: "Informe seu endereço de e-mail.",
      EMAIL_INVALID: "Insira um endereço de e-mail válido.",
      MESSAGE_REQUIRED: "Escreva a mensagem da sua consulta.",
      FIELD_TOO_LONG: "Um ou mais campos são longos demais.",
      INVALID_LANGUAGE: "O idioma selecionado não é válido.",
      INVALID_PAGE_URL: "O endereço da página não é válido.",
      INVALID_IDEMPOTENCY_KEY: "O identificador da solicitação não é válido. Recarregue a página e tente novamente.",
      IDEMPOTENCY_CONFLICT: "Este formulário já foi enviado com outro conteúdo. Recarregue a página e tente novamente.",
      STORAGE_UNAVAILABLE: "Não foi possível salvar sua consulta. Tente novamente.",
      RATE_LIMITED: "Muitas solicitações. Aguarde e tente novamente.",
      default: "Não foi possível enviar a consulta. Verifique o formulário e tente novamente."
    }
  };

  const language = (() => {
    const code = String(document.documentElement.lang || "en")
      .toLowerCase()
      .split("-")[0];
    return COPY[code] ? code : "en";
  })();
  const copy = COPY[language];

  const safeSession = {
    get(key) {
      try {
        return sessionStorage.getItem(key) || "";
      } catch {
        return "";
      }
    },
    set(key, value) {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // Submission remains functional when storage is blocked.
      }
    }
  };

  const landingKey = "chigox_inquiry_landing_page";
  const firstLanding =
    safeSession.get(landingKey) || document.referrer || window.location.href;
  safeSession.set(landingKey, firstLanding);

  const loadTurnstile = () =>
    new Promise((resolve, reject) => {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }
      const existing = document.querySelector(
        `script[src="${TURNSTILE_SCRIPT_SRC}"]`
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(window.turnstile), {
          once: true
        });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", () => resolve(window.turnstile), {
        once: true
      });
      script.addEventListener("error", reject, { once: true });
      document.head.append(script);
    });

  const statusElement = (form) => {
    const status = document.createElement("p");
    status.className = "inquiry-form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.style.gridColumn = "1 / -1";
    status.style.margin = "0";
    form.append(status);
    return status;
  };

  const setStatus = (status, text, isError = false) => {
    status.textContent = text;
    status.style.color = isError ? "#a61b1b" : "#145c42";
  };

  const createIdempotencyKey = () =>
    globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const appendContext = (data, form) => {
    const url = new URL(window.location.href);
    data.set("language", document.documentElement.lang || "en");
    data.set("page_url", `${url.origin}${url.pathname}`);
    data.set("landing_page", firstLanding);
    for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
      data.set(key, url.searchParams.get(key) || safeSession.get(key));
      const value = url.searchParams.get(key);
      if (value) safeSession.set(key, value);
    }
    if (!form.dataset.inquiryIdempotencyKey) {
      form.dataset.inquiryIdempotencyKey = createIdempotencyKey();
    }
    data.set("idempotency_key", form.dataset.inquiryIdempotencyKey);
  };

  const setupForm = async (form, config) => {
    const submit = form.querySelector('button[type="submit"]');
    if (!submit) return;
    const status = statusElement(form);
    submit.disabled = true;
    setStatus(status, copy.loading);

    const widget = document.createElement("div");
    widget.className = "inquiry-turnstile";
    submit.before(widget);

    let widgetId;
    try {
      const turnstile = await loadTurnstile();
      widgetId = turnstile.render(widget, {
        sitekey: config.turnstileSiteKey,
        action: config.turnstileAction || "inquiry",
        callback: () => {
          submit.disabled = false;
          setStatus(status, copy.ready);
        },
        "expired-callback": () => {
          submit.disabled = true;
          setStatus(status, copy.VERIFICATION_REQUIRED, true);
        },
        "error-callback": () => {
          submit.disabled = true;
          setStatus(status, copy.VERIFICATION_FAILED, true);
        }
      });
    } catch {
      setStatus(status, copy.CONFIG_UNAVAILABLE, true);
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submit.disabled) return;
      submit.disabled = true;
      setStatus(status, copy.sending);

      const data = new FormData(form);
      appendContext(data, form);
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          body: data,
          headers: { accept: "application/json" }
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          const message = copy[result.code] || copy.default;
          setStatus(status, message, true);
          window.turnstile?.reset(widgetId);
          return;
        }

        setStatus(status, copy.success);
        form.reset();
        delete form.dataset.inquiryIdempotencyKey;
        form.dataset.inquirySubmitted = "true";
        window.turnstile?.remove(widgetId);
      } catch {
        setStatus(status, copy.default, true);
        window.turnstile?.reset(widgetId);
      }
    });
  };

  const setup = async () => {
    const forms = [...document.querySelectorAll('form[action="/api/inquiry"]')];
    if (!forms.length) return;

    let config;
    try {
      const response = await fetch(API_URL, {
        headers: { accept: "application/json" },
        cache: "no-store"
      });
      config = await response.json();
      if (
        !response.ok ||
        !config.ok ||
        !config.turnstileSiteKey ||
        !config.turnstileAction
      ) {
        throw new Error("Inquiry service is not configured");
      }
    } catch {
      forms.forEach((form) => {
        const submit = form.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        setStatus(statusElement(form), copy.CONFIG_UNAVAILABLE, true);
      });
      return;
    }

    forms.forEach((form) => setupForm(form, config));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }
})();

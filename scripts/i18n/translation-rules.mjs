export const terminology = Object.freeze({
  en: {
    endoscopySystem: "Endoscopy System",
    bronchoscope: "Bronchoscope",
    cystoscope: "Cystoscope",
    nasopharyngoscope: "Nasopharyngoscope",
    ureteroscope: "Ureteroscope",
    rigidEndoscope: "Rigid Endoscope",
    ultrasound: "Ultrasound",
    veterinary: "Veterinary",
    reusable: "Reusable",
    disposable: "Disposable",
    requestQuote: "Request Quote",
    sendInquiry: "Send Inquiry",
  },
  es: {
    endoscopySystem: "Sistema de endoscopia", bronchoscope: "Broncoscopio", cystoscope: "Cistoscopio",
    nasopharyngoscope: "Nasofaringoscopio", ureteroscope: "Ureteroscopio", rigidEndoscope: "Endoscopio rígido",
    ultrasound: "Ultrasonido", veterinary: "Veterinaria", reusable: "Reutilizable", disposable: "Desechable",
    requestQuote: "Solicitar cotización", sendInquiry: "Enviar consulta",
  },
  tr: {
    endoscopySystem: "Endoskopi Sistemi", bronchoscope: "Bronkoskop", cystoscope: "Sistoskop",
    nasopharyngoscope: "Nazofaringoskop", ureteroscope: "Üreteroskop", rigidEndoscope: "Rijit Endoskop",
    ultrasound: "Ultrason", veterinary: "Veteriner", reusable: "Yeniden kullanılabilir", disposable: "Tek kullanımlık",
    requestQuote: "Teklif isteyin", sendInquiry: "Talep gönder",
  },
  de: {
    endoscopySystem: "Endoskopiesystem", bronchoscope: "Bronchoskop", cystoscope: "Zystoskop",
    nasopharyngoscope: "Nasopharyngoskop", ureteroscope: "Ureteroskop", rigidEndoscope: "Starres Endoskop",
    ultrasound: "Ultraschall", veterinary: "Veterinärmedizin", reusable: "Wiederverwendbar", disposable: "Einweg",
    requestQuote: "Angebot anfordern", sendInquiry: "Anfrage senden",
  },
  it: {
    endoscopySystem: "Sistema endoscopico", bronchoscope: "Broncoscopio", cystoscope: "Cistoscopio",
    nasopharyngoscope: "Nasofaringoscopio", ureteroscope: "Ureteroscopio", rigidEndoscope: "Endoscopio rigido",
    ultrasound: "Ecografia", veterinary: "Veterinaria", reusable: "Riutilizzabile", disposable: "Monouso",
    requestQuote: "Richiedi un preventivo", sendInquiry: "Invia richiesta",
  },
  pl: {
    endoscopySystem: "System endoskopowy", bronchoscope: "Bronchoskop", cystoscope: "Cystoskop",
    nasopharyngoscope: "Nasofaryngoskop", ureteroscope: "Ureteroskop", rigidEndoscope: "Endoskop sztywny",
    ultrasound: "Ultrasonografia", veterinary: "Weterynaria", reusable: "Wielokrotnego użytku", disposable: "Jednorazowy",
    requestQuote: "Poproś o wycenę", sendInquiry: "Wyślij zapytanie",
  },
  ko: {
    endoscopySystem: "내시경 시스템", bronchoscope: "기관지경", cystoscope: "방광경",
    nasopharyngoscope: "비인두경", ureteroscope: "요관경", rigidEndoscope: "경성 내시경",
    ultrasound: "초음파", veterinary: "수의학", reusable: "재사용형", disposable: "일회용",
    requestQuote: "견적 요청", sendInquiry: "문의 보내기",
  },
  fr: {
    endoscopySystem: "Système d'endoscopie", bronchoscope: "Bronchoscope", cystoscope: "Cystoscope",
    nasopharyngoscope: "Nasopharyngoscope", ureteroscope: "Urétéroscope", rigidEndoscope: "Endoscope rigide",
    ultrasound: "Échographie", veterinary: "Vétérinaire", reusable: "Réutilisable", disposable: "À usage unique",
    requestQuote: "Demander un devis", sendInquiry: "Envoyer la demande",
  },
  pt: {
    endoscopySystem: "Sistema de endoscopia", bronchoscope: "Broncoscópio", cystoscope: "Cistoscópio",
    nasopharyngoscope: "Nasofaringoscópio", ureteroscope: "Ureteroscópio", rigidEndoscope: "Endoscópio rígido",
    ultrasound: "Ultrassom", veterinary: "Veterinária", reusable: "Reutilizável", disposable: "Descartável",
    requestQuote: "Solicitar cotação", sendInquiry: "Enviar consulta",
  },
});

const immutablePatterns = [
  /\b(?:BD|CG[A-Z]*)-[A-Z0-9]+(?:-[A-Z0-9]+)*(?:\s+Pro|\s+Series)?\b/g,
  /\b(?:HD|Full HD|4K|1080P|720P)\b/gi,
  /\b(?:CE|FDA|ISO\s?\d{4,5}|IEC\s?\d{4,5}(?:-\d+)*)\b/g,
  /\b\d+(?:\.\d+)?\s?(?:mm|cm|m|kg|g|MHz|Hz|kHz|V|W|mAh|°|pixels?)(?=$|[\s,.;:)/])/g,
  /\b\d+(?:\.\d+)?\s?[×x]\s?\d+(?:\.\d+)?(?:\s?[×x]\s?\d+(?:\.\d+)?)?\s?(?:mm|cm|pixels?)?\b/gi,
];

export const immutableTranslationPatterns = Object.freeze(immutablePatterns);

export function extractProtectedTechnicalTokens(value) {
  const tokens = [];
  for (const pattern of immutablePatterns) {
    pattern.lastIndex = 0;
    for (const match of value.matchAll(pattern)) tokens.push(match[0].replaceAll(/\s+/g, " ").trim());
  }
  return [...new Set(tokens)].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export function compareProtectedTechnicalContent(source, translation) {
  const sourceTokens = extractProtectedTechnicalTokens(source);
  const translatedTokens = extractProtectedTechnicalTokens(translation);
  const normalized = (token) => token.toLowerCase().replaceAll(/\s+/g, "");
  const translatedSet = new Set(translatedTokens.map(normalized));
  const sourceSet = new Set(sourceTokens.map(normalized));
  const normalizedTranslation = normalized(translation);
  return {
    sourceTokens,
    translatedTokens,
    missing: sourceTokens.filter((token) => !translatedSet.has(normalized(token)) && !normalizedTranslation.includes(normalized(token))),
    unexpected: translatedTokens.filter((token) => !sourceSet.has(normalized(token))),
  };
}

export function assertProtectedTechnicalContent(source, translation, context = "translation") {
  const comparison = compareProtectedTechnicalContent(source, translation);
  if (comparison.missing.length || comparison.unexpected.length) {
    const details = [
      comparison.missing.length ? `missing: ${comparison.missing.join(", ")}` : null,
      comparison.unexpected.length ? `unexpected: ${comparison.unexpected.join(", ")}` : null,
    ].filter(Boolean).join("; ");
    throw new Error(`${context} changed protected technical content (${details})`);
  }
  return comparison;
}

export const translationChecklist = Object.freeze([
  "Keep product model identifiers character-for-character identical.",
  "Keep numeric specifications, dimensions, units, resolutions and standards identical.",
  "Translate medical terms using the approved terminology table, not general-purpose synonyms.",
  "Do not add claims, certifications, indications, parameters or accessories absent from the English source.",
  "Review title, description, navigation, footer, CTA, inquiry form and structured data in the target language.",
]);

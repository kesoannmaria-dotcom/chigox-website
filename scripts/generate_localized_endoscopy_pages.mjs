import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const languageCodes = ["es", "tr", "de", "it", "pl", "ko"];
const hreflangCodes = ["en", ...languageCodes];

const categoryOrder = [
  { slug: "endoscope-system", productSlugs: ["cge-100"] },
  { slug: "bronchoscope", productSlugs: ["cgb-600r", "disposable-flexible-bronchoscope"] },
  { slug: "cystoscope", productSlugs: ["cgc-350r", "cgc-350d"] },
  { slug: "nasopharyngoscope", productSlugs: ["cgn-350r", "cgn-350d"] },
  { slug: "ureteroscope", productSlugs: ["cgu-750r", "cgu-650d"] },
  { slug: "rigid-endoscope", productSlugs: ["cgr-100"] },
];

const products = {
  "cgb-600r": {
    category: "bronchoscope",
    model: "CGB-600R Series",
    type: "flexible",
    variant: "reusable",
    images: ["cgb-600-reusable.png"],
    features: ["hdCmos", "imageQuality", "multipleDiameters", "ergonomicHandle", "largeDeflection", "ledIllumination", "processorCompatible", "smoothInsertion", "sterilizableReusable", "diagnosticInterventional"],
    applications: ["bronchialExam", "airwayDiagnosis", "foreignBodyRemoval", "bronchialBiopsy", "respiratoryIntervention", "icuBronchoscopy", "thoracicSurgery", "pulmonaryMedicine"],
    standard: ["flexibleBronchoscope", "waterproofCap", "leakTester", "cleaningBrush", "biopsyValve", "carryingCase", "userManual"],
    optional: ["biopsyForceps", "foreignBodyForceps", "cytologyBrush", "cleaningKit", "endoscopyWorkstation", "videoProcessor", "medicalMonitor", "trolley"],
  },
  "disposable-flexible-bronchoscope": {
    category: "bronchoscope",
    model: "Contact CHIGOX",
    type: "flexible",
    variant: "disposable",
    images: ["cgb-600-disposable.png"],
    features: ["sterileSingleUse", "airwayVisualization", "ergonomicHandheld", "noReprocessing", "reducedCrossContamination", "respiratoryExam"],
    applications: ["airwayExam", "respiratoryDiagnosis", "icuBronchoscopy", "emergencyAirway", "foreignBodyInspection"],
    standard: ["disposableBronchoscope", "sterilePackaging", "userManual"],
    optional: ["endoscopyVideoProcessor", "medicalMonitor", "endoscopyWorkstation", "medicalTrolley"],
  },
  "cgc-350r": {
    category: "cystoscope",
    model: "CGC-350R Series",
    type: "flexible",
    variant: "reusable",
    images: ["cgc-350r.png"],
    features: ["hdCmos", "reusableTube", "imageQuality", "largeDeflection", "irrigation", "ergonomicHandle", "preciseManeuverability", "hdSystemCompatible", "repeatedSterilization", "longTermPerformance"],
    applications: ["diagnosticCystoscopy", "bladderDisease", "urethralExam", "bladderBiopsy", "foreignBodyInspection", "urologyFollowUp", "routineUrology"],
    standard: ["reusableCystoscope", "waterproofCap", "leakTester", "cleaningBrush", "sterilizationCap", "userManual"],
    optional: ["hdProcessor", "medicalMonitor", "endoscopyWorkstation", "medicalTrolley", "biopsyForceps", "irrigationPump", "imageRecording", "sterilizationTray"],
  },
  "cgc-350d": {
    category: "cystoscope",
    model: "CGC-350D Series",
    type: "flexible",
    variant: "disposable",
    images: ["cgc-350d.png"],
    features: ["sterileSingleUse", "hdCmos", "flexibility", "multipleDiameters", "largeDeflection", "ergonomicHandle", "patientComfort", "hdSystemCompatible", "noMaintenance", "reducedCrossContamination"],
    applications: ["bladderExam", "urethralExam", "hematuriaDiagnosis", "bladderBiopsy", "foreignBodyInspection", "urologicalDiagnosis", "minimallyInvasiveCystoscopy"],
    standard: ["disposableCystoscope", "sterilePackaging", "userManual"],
    optional: ["hdProcessor", "medicalMonitor", "endoscopyWorkstation", "medicalTrolley", "biopsyForceps", "irrigationPump", "recordingSystem"],
  },
  "cgn-350r": {
    category: "nasopharyngoscope",
    model: "CGN-350R Series",
    type: "flexible",
    variant: "reusable",
    images: ["cgn-350r.png"],
    features: ["hdCmos", "reusableTube", "flexibility", "largeDeflection", "ergonomicHandle", "imageQuality", "repeatedSterilization", "patientComfort", "hdSystemCompatible", "longTermPerformance"],
    applications: ["nasalExam", "nasopharyngealDiagnosis", "laryngealExam", "vocalCord", "entOutpatient", "foreignBodyInspection", "biopsyAssistance", "routineEnt"],
    standard: ["reusableNasopharyngoscope", "waterproofCap", "leakTester", "cleaningBrush", "sterilizationCap", "userManual"],
    optional: ["hdProcessor", "medicalMonitor", "endoscopyWorkstation", "medicalTrolley", "biopsyForceps", "imageRecording", "irrigationAccessories", "sterilizationTray"],
  },
  "cgn-350d": {
    category: "nasopharyngoscope",
    model: "CGN-350D Series",
    type: "flexible",
    variant: "disposable",
    images: ["cgn-350d.png"],
    features: ["sterileSingleUse", "hdCmos", "ergonomicHandle", "flexibility", "largeDeflection", "multipleDiameters", "patientComfort", "hdSystemCompatible", "noMaintenance", "reducedCrossContamination"],
    applications: ["nasalExam", "nasopharyngealExam", "laryngealExam", "vocalCord", "entOutpatientDiagnosis", "foreignBodyInspection", "biopsyAssistance", "routineEnt"],
    standard: ["disposableNasopharyngoscope", "sterilePackaging", "userManual"],
    optional: ["hdProcessor", "medicalMonitor", "endoscopyWorkstation", "medicalTrolley", "biopsyForceps", "imageRecording", "irrigationAccessories"],
  },
  "cgu-750r": {
    category: "ureteroscope",
    model: "CGU-750R Series",
    type: "flexible",
    variant: "reusable",
    images: ["cgu-750r.png"],
    features: ["hdCmos", "reusableTube", "sterilizationDurability", "largeDeflection", "irrigation", "ergonomicHandle", "preciseNavigation", "hdProcessorCompatible", "imageClarity", "routineClinical"],
    applications: ["flexibleUreteroscopy", "kidneyStoneDiagnosis", "laserLithotripsy", "ureteralBiopsy", "upperUrinaryExam", "urinaryEndoscopicTreatment", "minimallyInvasiveUrology"],
    standard: ["reusableUreteroscope", "waterproofCap", "leakTester", "cleaningBrush", "sterilizationCap", "userManual"],
    optional: ["hdProcessor", "medicalMonitor", "endoscopyWorkstation", "medicalTrolley", "stoneBasket", "biopsyForceps", "irrigationPump", "sterilizationTray"],
  },
  "cgu-650d": {
    category: "ureteroscope",
    model: "CGU-650D Series",
    type: "flexible",
    variant: "disposable",
    images: ["cgu-650d.png"],
    features: ["sterileSingleUse", "hdCmos", "flexibility", "highDeflection", "multipleDiameters", "ergonomicHandle", "irrigation", "processorCompatible", "smoothOperation", "reducedReprocessingCost"],
    applications: ["ureteralStoneDiagnosis", "kidneyStoneExam", "laserLithotripsy", "ureteralBiopsy", "urinaryInspection", "upperUrinaryIntervention", "minimallyInvasiveUrology"],
    standard: ["disposableUreteroscope", "sterilePackaging", "userManual"],
    optional: ["endoscopyVideoProcessor", "medicalMonitor", "endoscopyWorkstation", "medicalTrolley", "stoneBasket", "biopsyForceps", "irrigationPump", "lightSource"],
  },
  "cgr-100": {
    category: "rigid-endoscope",
    model: "CGR-100 Series",
    type: "rigid",
    variant: null,
    images: ["cgr-100-1.jpg", "cgr-100-2.jpg", "cgr-100-3.jpg"],
    features: ["hdOptical", "sapphireWindow", "medicalSteel", "fullyAutoclavable", "colorReproduction", "lightTransmission", "cameraCompatible", "viewingAngles", "multipleDiameters", "minimallyInvasiveSurgery"],
    applications: ["generalSurgery", "laparoscopicSurgery", "arthroscopy", "entSurgery", "sinusSurgery", "urology", "gynecology", "minimallyInvasiveSurgery"],
    standard: ["rigidEndoscope", "protectiveCap", "userManual"],
    optional: ["hdCameraHead", "ledLightSource", "fiberLightCable", "medicalMonitor", "videoProcessor", "endoscopyWorkstation", "medicalTrolley", "sterilizationTray", "endoscopicInstruments"],
  },
};

const productRoute = (product) => `products/endoscopy-system/${product.category}`;
const localizedUrl = (lang, route) => `https://www.chigox.com/${lang ? `${lang}/` : ""}${route}/`;
const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const list = (items) => `<ul class="check-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;

const packs = {
  es: {
    ui: {
      endoscopy: "Sistema de endoscopia", productCategory: "Categoría de producto", products: "Productos", viewProduct: "Ver producto",
      humanUse: "Uso humano", reusable: "Reutilizable", disposable: "Desechable", images: "Imágenes", productImages: "Imágenes del producto",
      overview: "Resumen", productOverview: "Descripción del producto", keyFeatures: "Características principales", applications: "Aplicaciones",
      basicInfo: "Información básica", productName: "Nombre del producto", model: "Modelo", productType: "Categoría del producto",
      specifications: "Especificaciones", technicalSpecifications: "Especificaciones técnicas", standardConfiguration: "Configuración estándar",
      optionalAccessories: "Accesorios opcionales", requestQuote: "Solicitar cotización", inquiryForm: "Formulario de consulta",
      inquiryIntro: "Comparta su mercado, aplicación y configuración objetivo. El equipo de CHIGOX le responderá por correo electrónico.",
      name: "Nombre", email: "Correo electrónico", company: "Empresa", product: "Producto", message: "Mensaje", sendInquiry: "Enviar consulta",
      placeholder: "Indíquenos su aplicación, cantidad y mercado objetivo.", needConfiguration: "¿Necesita una configuración para esta categoría?",
      configurationPrompt: "Indíquenos su aplicación, mercado de destino y configuración requerida.", contact: "Contacto", emailSales: "Enviar email a ventas",
      subcategories: "Subcategorías", subcategoryHeading: "Subcategorías del sistema de endoscopia", productSingular: "producto", productPlural: "productos",
      flexibleType: "Endoscopio médico flexible", rigidType: "Endoscopio médico rígido",
      reusableOverview: "Su diseño reutilizable está concebido para la esterilización repetida y el uso clínico habitual con un sistema de endoscopia compatible.",
      disposableOverview: "Su presentación estéril de un solo uso ayuda a reducir el riesgo de contaminación cruzada y evita el reprocesamiento rutinario del endoscopio.",
      rigidOverview: "La construcción óptica y de acero inoxidable está diseñada para ofrecer imágenes nítidas y un rendimiento fiable en procedimientos mínimamente invasivos.",
    },
    categories: {
      "endoscope-system": ["Sistema de endoscopia", "Plataforma de endoscopia médica Full HD para endoscopios flexibles y rígidos compatibles."],
      bronchoscope: ["Broncoscopio", "Broncoscopios flexibles para diagnóstico de la vía aérea, biopsia, extracción de cuerpos extraños e intervenciones respiratorias."],
      cystoscope: ["Cistoscopio", "Cistoscopios flexibles desechables y reutilizables para procedimientos de vejiga y vías urinarias inferiores."],
      nasopharyngoscope: ["Nasofaringoscopio", "Nasofaringoscopios flexibles para el examen de alta definición de la cavidad nasal, la faringe y la laringe."],
      ureteroscope: ["Ureteroscopio", "Ureteroscopios flexibles desechables y reutilizables para diagnóstico y tratamiento mínimamente invasivo de las vías urinarias."],
      "rigid-endoscope": ["Endoscopio rígido", "Endoscopios rígidos autoclavables para ORL, artroscopia, urología, ginecología y cirugía laparoscópica."],
    },
    productCopy: {
      "cgb-600r": ["Broncoscopio flexible reutilizable de la serie CGB-600R", "Broncoscopio flexible reutilizable de alta definición para procedimientos de vía aérea en adultos, pediátricos e intervencionistas."],
      "disposable-flexible-bronchoscope": ["Broncoscopio flexible desechable", "Broncoscopio flexible estéril de un solo uso para exploración de la vía aérea y procedimientos respiratorios."],
      "cgc-350r": ["Cistoscopio flexible reutilizable de la serie CGC-350R", "Cistoscopio flexible HD reutilizable para procedimientos diagnósticos y terapéuticos de la vejiga y las vías urinarias inferiores."],
      "cgc-350d": ["Cistoscopio flexible desechable de la serie CGC-350D", "Cistoscopio flexible estéril de un solo uso para diagnóstico y tratamiento de las vías urinarias inferiores."],
      "cgn-350r": ["Nasofaringoscopio flexible reutilizable de la serie CGN-350R", "Nasofaringoscopio flexible HD reutilizable para exploraciones ORL habituales y procedimientos mínimamente invasivos."],
      "cgn-350d": ["Nasofaringoscopio flexible desechable de la serie CGN-350D", "Nasofaringoscopio HD estéril de un solo uso para examinar la cavidad nasal, la faringe y la laringe."],
      "cgu-750r": ["Ureteroscopio flexible reutilizable de la serie CGU-750R", "Ureteroscopio flexible reutilizable y duradero para procedimientos habituales y avanzados de las vías urinarias superiores."],
      "cgu-650d": ["Ureteroscopio flexible desechable de la serie CGU-650D", "Ureteroscopio flexible estéril de un solo uso para diagnóstico y tratamiento mínimamente invasivo de las vías urinarias."],
      "cgr-100": ["Endoscopio rígido de la serie CGR-100", "Endoscopios rígidos HD autoclavables para diagnóstico y cirugía mínimamente invasivos en diversas especialidades."],
      "cge-100": ["CGE-100 solución de endoscopia médica Full HD", "Plataforma de endoscopia médica Full HD 1080P para procedimientos gastrointestinales, respiratorios, ORL, urológicos y de endoscopia rígida."],
    },
  },
  tr: {
    ui: {
      endoscopy: "Endoskopi Sistemi", productCategory: "Ürün kategorisi", products: "Ürünler", viewProduct: "Ürünü görüntüle",
      humanUse: "İnsan kullanımı", reusable: "Yeniden kullanılabilir", disposable: "Tek kullanımlık", images: "Görseller", productImages: "Ürün görselleri",
      overview: "Genel bakış", productOverview: "Ürüne genel bakış", keyFeatures: "Temel özellikler", applications: "Uygulamalar",
      basicInfo: "Temel bilgiler", productName: "Ürün adı", model: "Model", productType: "Ürün kategorisi",
      specifications: "Teknik bilgiler", technicalSpecifications: "Teknik özellikler", standardConfiguration: "Standart konfigürasyon",
      optionalAccessories: "Opsiyonel aksesuarlar", requestQuote: "Teklif isteyin", inquiryForm: "Talep formu",
      inquiryIntro: "Pazarınızı, uygulamanızı ve hedef konfigürasyonu paylaşın. CHIGOX ekibi e-posta ile sizinle iletişime geçecektir.",
      name: "Ad", email: "E-posta", company: "Şirket", product: "Ürün", message: "Mesaj", sendInquiry: "Talep gönder",
      placeholder: "Uygulamanızı, miktarı ve hedef pazarı belirtin.", needConfiguration: "Bu kategori için konfigürasyona mı ihtiyacınız var?",
      configurationPrompt: "Uygulamanızı, hedef pazarınızı ve gereken konfigürasyonu belirtin.", contact: "İletişim", emailSales: "Satış ekibine e-posta gönder",
      subcategories: "Alt kategoriler", subcategoryHeading: "Endoskopi sistemi alt kategorileri", productSingular: "ürün", productPlural: "ürün",
      flexibleType: "Medikal esnek endoskop", rigidType: "Medikal rijit endoskop",
      reusableOverview: "Yeniden kullanılabilir tasarım, uyumlu bir endoskopi sistemiyle tekrarlı sterilizasyon ve rutin klinik kullanım için geliştirilmiştir.",
      disposableOverview: "Steril tek kullanımlık format, çapraz kontaminasyon riskini azaltmaya yardımcı olur ve rutin endoskop yeniden işleme ihtiyacını ortadan kaldırır.",
      rigidOverview: "Optik ve paslanmaz çelik yapı, minimal invaziv işlemlerde net görüntü ve güvenilir performans sağlamak üzere tasarlanmıştır.",
    },
    categories: {
      "endoscope-system": ["Endoskop sistemi", "Uyumlu esnek ve rijit endoskoplar için Full HD medikal endoskopi platformu."],
      bronchoscope: ["Bronkoskop", "Hava yolu tanısı, biyopsi, yabancı cisim çıkarma ve solunum müdahaleleri için esnek bronkoskoplar."],
      cystoscope: ["Sistoskop", "Mesane ve alt üriner sistem işlemleri için tek kullanımlık ve yeniden kullanılabilir esnek sistoskoplar."],
      nasopharyngoscope: ["Nazofaringoskop", "Burun boşluğu, farinks ve larinksin yüksek çözünürlüklü muayenesi için esnek nazofaringoskoplar."],
      ureteroscope: ["Üreteroskop", "Üriner sistem tanısı ve minimal invaziv tedavi için tek kullanımlık ve yeniden kullanılabilir esnek üreteroskoplar."],
      "rigid-endoscope": ["Rijit endoskop", "KBB, artroskopi, üroloji, jinekoloji ve laparoskopik cerrahi için otoklavlanabilir rijit endoskoplar."],
    },
    productCopy: {
      "cgb-600r": ["CGB-600R Serisi yeniden kullanılabilir esnek bronkoskop", "Yetişkin, pediatrik ve girişimsel hava yolu işlemleri için yüksek çözünürlüklü, yeniden kullanılabilir esnek bronkoskop."],
      "disposable-flexible-bronchoscope": ["Tek kullanımlık esnek bronkoskop", "Hava yolu muayenesi ve solunum işlemleri için steril, tek kullanımlık esnek bronkoskop."],
      "cgc-350r": ["CGC-350R Serisi yeniden kullanılabilir esnek sistoskop", "Mesane ve alt üriner sistemin tanısal ve terapötik işlemleri için yeniden kullanılabilir HD esnek sistoskop."],
      "cgc-350d": ["CGC-350D Serisi tek kullanımlık esnek sistoskop", "Alt üriner sistem tanı ve tedavisi için steril, tek kullanımlık esnek sistoskop."],
      "cgn-350r": ["CGN-350R Serisi yeniden kullanılabilir esnek nazofaringoskop", "Rutin KBB muayeneleri ve minimal invaziv işlemler için yeniden kullanılabilir HD esnek nazofaringoskop."],
      "cgn-350d": ["CGN-350D Serisi tek kullanımlık esnek nazofaringoskop", "Burun boşluğu, farinks ve larinks muayenesi için steril, tek kullanımlık HD nazofaringoskop."],
      "cgu-750r": ["CGU-750R Serisi yeniden kullanılabilir esnek üreteroskop", "Rutin ve ileri üst üriner sistem işlemleri için dayanıklı, yeniden kullanılabilir esnek üreteroskop."],
      "cgu-650d": ["CGU-650D Serisi tek kullanımlık esnek üreteroskop", "Üriner sistemin minimal invaziv tanı ve tedavisi için steril, tek kullanımlık esnek üreteroskop."],
      "cgr-100": ["CGR-100 Serisi rijit endoskop", "Farklı uzmanlık alanlarında minimal invaziv tanı ve cerrahi için otoklavlanabilir HD rijit endoskoplar."],
      "cge-100": ["CGE-100 Full HD medikal endoskopi çözümü", "Gastrointestinal, solunum, KBB, üroloji ve rijit endoskopi işlemleri için Full HD 1080P medikal endoskopi platformu."],
    },
  },
  de: {
    ui: {
      endoscopy: "Endoskopiesystem", productCategory: "Produktkategorie", products: "Produkte", viewProduct: "Produkt ansehen",
      humanUse: "Humanmedizin", reusable: "Wiederverwendbar", disposable: "Einweg", images: "Bilder", productImages: "Produktbilder",
      overview: "Überblick", productOverview: "Produktübersicht", keyFeatures: "Hauptmerkmale", applications: "Anwendungen",
      basicInfo: "Grundinformationen", productName: "Produktname", model: "Modell", productType: "Produktkategorie",
      specifications: "Spezifikationen", technicalSpecifications: "Technische Daten", standardConfiguration: "Standardkonfiguration",
      optionalAccessories: "Optionales Zubehör", requestQuote: "Angebot anfordern", inquiryForm: "Anfrageformular",
      inquiryIntro: "Teilen Sie uns Ihren Markt, Ihre Anwendung und die gewünschte Konfiguration mit. Das CHIGOX-Team meldet sich per E-Mail.",
      name: "Name", email: "E-Mail", company: "Unternehmen", product: "Produkt", message: "Nachricht", sendInquiry: "Anfrage senden",
      placeholder: "Nennen Sie uns Anwendung, Menge und Zielmarkt.", needConfiguration: "Benötigen Sie eine Konfiguration für diese Kategorie?",
      configurationPrompt: "Nennen Sie uns Ihre Anwendung, den Zielmarkt und die benötigte Konfiguration.", contact: "Kontakt", emailSales: "E-Mail an den Vertrieb",
      subcategories: "Unterkategorien", subcategoryHeading: "Unterkategorien des Endoskopiesystems", productSingular: "Produkt", productPlural: "Produkte",
      flexibleType: "Medizinisches flexibles Endoskop", rigidType: "Medizinisches starres Endoskop",
      reusableOverview: "Die wiederverwendbare Ausführung ist für wiederholte Sterilisation und den klinischen Routineeinsatz mit einem kompatiblen Endoskopiesystem ausgelegt.",
      disposableOverview: "Die sterile Einwegausführung hilft, das Risiko einer Kreuzkontamination zu reduzieren, und macht die routinemäßige Wiederaufbereitung des Endoskops überflüssig.",
      rigidOverview: "Die optische Konstruktion aus Edelstahl ist für klare Bilder und zuverlässige Leistung bei minimalinvasiven Eingriffen ausgelegt.",
    },
    categories: {
      "endoscope-system": ["Endoskopiesystem", "Medizinische Full-HD-Endoskopieplattform für kompatible flexible und starre Endoskope."],
      bronchoscope: ["Bronchoskop", "Flexible Bronchoskope für Atemwegsdiagnostik, Biopsie, Fremdkörperentfernung und respiratorische Interventionen."],
      cystoscope: ["Zystoskop", "Flexible Einweg- und Mehrwegzystoskope für Eingriffe an Blase und unteren Harnwegen."],
      nasopharyngoscope: ["Nasopharyngoskop", "Flexible Nasopharyngoskope für die hochauflösende Untersuchung von Nasenhöhle, Pharynx und Larynx."],
      ureteroscope: ["Ureteroskop", "Flexible Einweg- und Mehrwegureteroskope zur Diagnostik und minimalinvasiven Behandlung der Harnwege."],
      "rigid-endoscope": ["Starres Endoskop", "Autoklavierbare starre Endoskope für HNO, Arthroskopie, Urologie, Gynäkologie und laparoskopische Chirurgie."],
    },
    productCopy: {
      "cgb-600r": ["Wiederverwendbares flexibles Bronchoskop der CGB-600R Serie", "Hochauflösendes wiederverwendbares flexibles Bronchoskop für Atemwegseingriffe bei Erwachsenen, Kindern und interventionellen Anwendungen."],
      "disposable-flexible-bronchoscope": ["Flexibles Einweg-Bronchoskop", "Steriles flexibles Einweg-Bronchoskop für Atemwegsuntersuchungen und respiratorische Verfahren."],
      "cgc-350r": ["Wiederverwendbares flexibles Zystoskop der CGC-350R Serie", "Wiederverwendbares flexibles HD-Zystoskop für diagnostische und therapeutische Eingriffe an Blase und unteren Harnwegen."],
      "cgc-350d": ["Flexibles Einweg-Zystoskop der CGC-350D Serie", "Steriles flexibles Einweg-Zystoskop zur Diagnostik und Behandlung der unteren Harnwege."],
      "cgn-350r": ["Wiederverwendbares flexibles Nasopharyngoskop der CGN-350R Serie", "Wiederverwendbares flexibles HD-Nasopharyngoskop für routinemäßige HNO-Untersuchungen und minimalinvasive Eingriffe."],
      "cgn-350d": ["Flexibles Einweg-Nasopharyngoskop der CGN-350D Serie", "Steriles HD-Einweg-Nasopharyngoskop zur Untersuchung von Nasenhöhle, Pharynx und Larynx."],
      "cgu-750r": ["Wiederverwendbares flexibles Ureteroskop der CGU-750R Serie", "Robustes wiederverwendbares flexibles Ureteroskop für routinemäßige und anspruchsvolle Eingriffe an den oberen Harnwegen."],
      "cgu-650d": ["Flexibles Einweg-Ureteroskop der CGU-650D Serie", "Steriles flexibles Einweg-Ureteroskop zur minimalinvasiven Diagnostik und Behandlung der Harnwege."],
      "cgr-100": ["Starres Endoskop der CGR-100 Serie", "Autoklavierbare starre HD-Endoskope für minimalinvasive Diagnostik und Chirurgie in mehreren Fachgebieten."],
      "cge-100": ["CGE-100 medizinische Full-HD-Endoskopielösung", "Medizinische Full-HD-1080P-Endoskopieplattform für gastrointestinale, respiratorische, HNO-, urologische und starre Endoskopieverfahren."],
    },
  },
  it: {
    ui: {
      endoscopy: "Sistema di endoscopia", productCategory: "Categoria di prodotto", products: "Prodotti", viewProduct: "Vedi prodotto",
      humanUse: "Uso umano", reusable: "Riutilizzabile", disposable: "Monouso", images: "Immagini", productImages: "Immagini del prodotto",
      overview: "Panoramica", productOverview: "Panoramica del prodotto", keyFeatures: "Caratteristiche principali", applications: "Applicazioni",
      basicInfo: "Informazioni di base", productName: "Nome del prodotto", model: "Modello", productType: "Categoria del prodotto",
      specifications: "Specifiche", technicalSpecifications: "Specifiche tecniche", standardConfiguration: "Configurazione standard",
      optionalAccessories: "Accessori opzionali", requestQuote: "Richiedi un preventivo", inquiryForm: "Modulo di richiesta",
      inquiryIntro: "Indicate mercato, applicazione e configurazione desiderata. Il team CHIGOX vi contatterà via e-mail.",
      name: "Nome", email: "E-mail", company: "Azienda", product: "Prodotto", message: "Messaggio", sendInquiry: "Invia richiesta",
      placeholder: "Indicate applicazione, quantità e mercato di destinazione.", needConfiguration: "Serve una configurazione per questa categoria?",
      configurationPrompt: "Indicate applicazione, mercato di destinazione e configurazione richiesta.", contact: "Contatti", emailSales: "Invia un'e-mail alle vendite",
      subcategories: "Sottocategorie", subcategoryHeading: "Sottocategorie del sistema di endoscopia", productSingular: "prodotto", productPlural: "prodotti",
      flexibleType: "Endoscopio flessibile medicale", rigidType: "Endoscopio rigido medicale",
      reusableOverview: "Il design riutilizzabile è progettato per sterilizzazioni ripetute e per l'impiego clinico ordinario con un sistema di endoscopia compatibile.",
      disposableOverview: "Il formato sterile monouso contribuisce a ridurre il rischio di contaminazione crociata ed elimina il ricondizionamento ordinario dell'endoscopio.",
      rigidOverview: "La struttura ottica in acciaio inossidabile è progettata per offrire immagini nitide e prestazioni affidabili nelle procedure mini-invasive.",
    },
    categories: {
      "endoscope-system": ["Sistema di endoscopia", "Piattaforma di endoscopia medicale Full HD per endoscopi flessibili e rigidi compatibili."],
      bronchoscope: ["Broncoscopio", "Broncoscopi flessibili per diagnosi delle vie aeree, biopsia, rimozione di corpi estranei e interventi respiratori."],
      cystoscope: ["Cistoscopio", "Cistoscopi flessibili monouso e riutilizzabili per procedure della vescica e delle basse vie urinarie."],
      nasopharyngoscope: ["Nasofaringoscopio", "Nasofaringoscopi flessibili per l'esame ad alta definizione di cavità nasale, faringe e laringe."],
      ureteroscope: ["Ureteroscopio", "Ureteroscopi flessibili monouso e riutilizzabili per diagnosi e trattamento mini-invasivo delle vie urinarie."],
      "rigid-endoscope": ["Endoscopio rigido", "Endoscopi rigidi autoclavabili per ORL, artroscopia, urologia, ginecologia e chirurgia laparoscopica."],
    },
    productCopy: {
      "cgb-600r": ["Broncoscopio flessibile riutilizzabile serie CGB-600R", "Broncoscopio flessibile riutilizzabile ad alta definizione per procedure delle vie aeree in adulti, pazienti pediatrici e interventistiche."],
      "disposable-flexible-bronchoscope": ["Broncoscopio flessibile monouso", "Broncoscopio flessibile sterile monouso per l'esame delle vie aeree e le procedure respiratorie."],
      "cgc-350r": ["Cistoscopio flessibile riutilizzabile serie CGC-350R", "Cistoscopio flessibile HD riutilizzabile per procedure diagnostiche e terapeutiche della vescica e delle basse vie urinarie."],
      "cgc-350d": ["Cistoscopio flessibile monouso serie CGC-350D", "Cistoscopio flessibile sterile monouso per la diagnosi e il trattamento delle basse vie urinarie."],
      "cgn-350r": ["Nasofaringoscopio flessibile riutilizzabile serie CGN-350R", "Nasofaringoscopio flessibile HD riutilizzabile per esami ORL di routine e procedure mini-invasive."],
      "cgn-350d": ["Nasofaringoscopio flessibile monouso serie CGN-350D", "Nasofaringoscopio HD sterile monouso per l'esame della cavità nasale, della faringe e della laringe."],
      "cgu-750r": ["Ureteroscopio flessibile riutilizzabile serie CGU-750R", "Ureteroscopio flessibile riutilizzabile e resistente per procedure ordinarie e avanzate delle alte vie urinarie."],
      "cgu-650d": ["Ureteroscopio flessibile monouso serie CGU-650D", "Ureteroscopio flessibile sterile monouso per la diagnosi e il trattamento mini-invasivo delle vie urinarie."],
      "cgr-100": ["Endoscopio rigido serie CGR-100", "Endoscopi rigidi HD autoclavabili per diagnosi e chirurgia mini-invasive in diverse specialità."],
      "cge-100": ["CGE-100 soluzione di endoscopia medicale Full HD", "Piattaforma di endoscopia medicale Full HD 1080P per procedure gastrointestinali, respiratorie, ORL, urologiche e con endoscopio rigido."],
    },
  },
  pl: {
    ui: {
      endoscopy: "System endoskopowy", productCategory: "Kategoria produktu", products: "Produkty", viewProduct: "Zobacz produkt",
      humanUse: "Zastosowanie u ludzi", reusable: "Wielorazowy", disposable: "Jednorazowy", images: "Zdjęcia", productImages: "Zdjęcia produktu",
      overview: "Przegląd", productOverview: "Opis produktu", keyFeatures: "Najważniejsze cechy", applications: "Zastosowania",
      basicInfo: "Podstawowe informacje", productName: "Nazwa produktu", model: "Model", productType: "Kategoria produktu",
      specifications: "Specyfikacja", technicalSpecifications: "Dane techniczne", standardConfiguration: "Konfiguracja standardowa",
      optionalAccessories: "Akcesoria opcjonalne", requestQuote: "Poproś o wycenę", inquiryForm: "Formularz zapytania",
      inquiryIntro: "Podaj rynek, zastosowanie i oczekiwaną konfigurację. Zespół CHIGOX skontaktuje się z Tobą e-mailem.",
      name: "Imię i nazwisko", email: "E-mail", company: "Firma", product: "Produkt", message: "Wiadomość", sendInquiry: "Wyślij zapytanie",
      placeholder: "Podaj zastosowanie, ilość i rynek docelowy.", needConfiguration: "Potrzebujesz konfiguracji dla tej kategorii?",
      configurationPrompt: "Podaj zastosowanie, rynek docelowy i wymaganą konfigurację.", contact: "Kontakt", emailSales: "Wyślij e-mail do działu sprzedaży",
      subcategories: "Podkategorie", subcategoryHeading: "Podkategorie systemu endoskopowego", productSingular: "produkt", productPlural: "produkty",
      flexibleType: "Medyczny endoskop giętki", rigidType: "Medyczny endoskop sztywny",
      reusableOverview: "Konstrukcja wielorazowa jest przeznaczona do powtarzanej sterylizacji i rutynowego zastosowania klinicznego z kompatybilnym systemem endoskopowym.",
      disposableOverview: "Sterylna konstrukcja jednorazowa pomaga ograniczyć ryzyko zakażenia krzyżowego i eliminuje rutynowe przygotowanie endoskopu do ponownego użycia.",
      rigidOverview: "Układ optyczny i konstrukcja ze stali nierdzewnej zapewniają wyraźny obraz oraz niezawodne działanie podczas zabiegów małoinwazyjnych.",
    },
    categories: {
      "endoscope-system": ["System endoskopowy", "Medyczna platforma endoskopowa Full HD do kompatybilnych endoskopów giętkich i sztywnych."],
      bronchoscope: ["Bronchoskop", "Bronchoskopy giętkie do diagnostyki dróg oddechowych, biopsji, usuwania ciał obcych i zabiegów oddechowych."],
      cystoscope: ["Cystoskop", "Jednorazowe i wielorazowe cystoskopy giętkie do zabiegów pęcherza i dolnych dróg moczowych."],
      nasopharyngoscope: ["Nasofaryngoskop", "Nasofaryngoskopy giętkie do badania jamy nosowej, gardła i krtani w wysokiej rozdzielczości."],
      ureteroscope: ["Ureteroskop", "Jednorazowe i wielorazowe ureteroskopy giętkie do diagnostyki oraz małoinwazyjnego leczenia dróg moczowych."],
      "rigid-endoscope": ["Endoskop sztywny", "Autoklawowalne endoskopy sztywne do laryngologii, artroskopii, urologii, ginekologii i chirurgii laparoskopowej."],
    },
    productCopy: {
      "cgb-600r": ["Wielorazowy bronchoskop giętki serii CGB-600R", "Wielorazowy bronchoskop giętki wysokiej rozdzielczości do zabiegów dróg oddechowych u dorosłych, dzieci i procedur interwencyjnych."],
      "disposable-flexible-bronchoscope": ["Jednorazowy bronchoskop giętki", "Sterylny jednorazowy bronchoskop giętki do badania dróg oddechowych i procedur pulmonologicznych."],
      "cgc-350r": ["Wielorazowy cystoskop giętki serii CGC-350R", "Wielorazowy cystoskop giętki HD do procedur diagnostycznych i terapeutycznych pęcherza oraz dolnych dróg moczowych."],
      "cgc-350d": ["Jednorazowy cystoskop giętki serii CGC-350D", "Sterylny jednorazowy cystoskop giętki do diagnostyki i leczenia dolnych dróg moczowych."],
      "cgn-350r": ["Wielorazowy nasofaryngoskop giętki serii CGN-350R", "Wielorazowy nasofaryngoskop giętki HD do rutynowych badań laryngologicznych i procedur małoinwazyjnych."],
      "cgn-350d": ["Jednorazowy nasofaryngoskop giętki serii CGN-350D", "Sterylny jednorazowy nasofaryngoskop HD do badania jamy nosowej, gardła i krtani."],
      "cgu-750r": ["Wielorazowy ureteroskop giętki serii CGU-750R", "Trwały wielorazowy ureteroskop giętki do rutynowych i zaawansowanych zabiegów górnych dróg moczowych."],
      "cgu-650d": ["Jednorazowy ureteroskop giętki serii CGU-650D", "Sterylny jednorazowy ureteroskop giętki do małoinwazyjnej diagnostyki i leczenia dróg moczowych."],
      "cgr-100": ["Endoskop sztywny serii CGR-100", "Autoklawowalne endoskopy sztywne HD do małoinwazyjnej diagnostyki i chirurgii w wielu specjalizacjach."],
      "cge-100": ["CGE-100 medyczne rozwiązanie endoskopowe Full HD", "Medyczna platforma endoskopowa Full HD 1080P do procedur gastroenterologicznych, oddechowych, laryngologicznych, urologicznych i endoskopii sztywnej."],
    },
  },
  ko: {
    ui: {
      endoscopy: "내시경 시스템", productCategory: "제품 카테고리", products: "제품", viewProduct: "제품 보기",
      humanUse: "인체용", reusable: "재사용형", disposable: "일회용", images: "이미지", productImages: "제품 이미지",
      overview: "개요", productOverview: "제품 개요", keyFeatures: "주요 특징", applications: "적용 분야",
      basicInfo: "기본 정보", productName: "제품명", model: "모델", productType: "제품 카테고리",
      specifications: "사양", technicalSpecifications: "기술 사양", standardConfiguration: "표준 구성",
      optionalAccessories: "옵션 액세서리", requestQuote: "견적 요청", inquiryForm: "문의 양식",
      inquiryIntro: "시장, 적용 분야 및 원하는 구성을 알려주시면 CHIGOX 팀이 이메일로 연락드립니다.",
      name: "이름", email: "이메일", company: "회사", product: "제품", message: "메시지", sendInquiry: "문의 보내기",
      placeholder: "적용 분야, 수량 및 목표 시장을 알려주세요.", needConfiguration: "이 카테고리의 구성이 필요하신가요?",
      configurationPrompt: "적용 분야, 목표 시장 및 필요한 구성을 알려주세요.", contact: "문의하기", emailSales: "영업팀에 이메일 보내기",
      subcategories: "하위 카테고리", subcategoryHeading: "내시경 시스템 하위 카테고리", productSingular: "개 제품", productPlural: "개 제품",
      flexibleType: "의료용 연성 내시경", rigidType: "의료용 경성 내시경",
      reusableOverview: "재사용형 설계로 호환되는 내시경 시스템과 함께 반복 멸균 및 일상적인 임상 사용에 적합합니다.",
      disposableOverview: "멸균 일회용 방식으로 교차 오염 위험을 줄이고 일상적인 내시경 재처리 과정을 없애는 데 도움이 됩니다.",
      rigidOverview: "광학계와 스테인리스강 구조는 최소 침습 시술에서 선명한 영상과 안정적인 성능을 제공하도록 설계되었습니다.",
    },
    categories: {
      "endoscope-system": ["내시경 시스템", "호환되는 연성 및 경성 내시경을 위한 Full HD 의료용 내시경 플랫폼입니다."],
      bronchoscope: ["기관지경", "기도 진단, 생검, 이물 제거 및 호흡기 중재를 위한 연성 기관지경입니다."],
      cystoscope: ["방광경", "방광 및 하부 요로 시술을 위한 일회용 및 재사용형 연성 방광경입니다."],
      nasopharyngoscope: ["비인두경", "비강, 인두 및 후두의 고해상도 검사를 위한 연성 비인두경입니다."],
      ureteroscope: ["요관경", "요로 진단 및 최소 침습 치료를 위한 일회용 및 재사용형 연성 요관경입니다."],
      "rigid-endoscope": ["경성 내시경", "이비인후과, 관절경, 비뇨기과, 산부인과 및 복강경 수술용 오토클레이브 경성 내시경입니다."],
    },
    productCopy: {
      "cgb-600r": ["CGB-600R 시리즈 재사용형 연성 기관지경", "성인, 소아 및 중재적 기도 시술을 위한 고해상도 재사용형 연성 기관지경입니다."],
      "disposable-flexible-bronchoscope": ["일회용 연성 기관지경", "기도 검사 및 호흡기 시술을 위한 멸균 일회용 연성 기관지경입니다."],
      "cgc-350r": ["CGC-350R 시리즈 재사용형 연성 방광경", "방광 및 하부 요로의 진단과 치료 시술을 위한 재사용형 HD 연성 방광경입니다."],
      "cgc-350d": ["CGC-350D 시리즈 일회용 연성 방광경", "하부 요로 진단 및 치료를 위한 멸균 일회용 연성 방광경입니다."],
      "cgn-350r": ["CGN-350R 시리즈 재사용형 연성 비인두경", "일상적인 이비인후과 검사와 최소 침습 시술을 위한 재사용형 HD 연성 비인두경입니다."],
      "cgn-350d": ["CGN-350D 시리즈 일회용 연성 비인두경", "비강, 인두 및 후두 검사를 위한 멸균 일회용 HD 비인두경입니다."],
      "cgu-750r": ["CGU-750R 시리즈 재사용형 연성 요관경", "일상 및 고난도 상부 요로 시술을 위한 내구성 높은 재사용형 연성 요관경입니다."],
      "cgu-650d": ["CGU-650D 시리즈 일회용 연성 요관경", "요로의 최소 침습 진단과 치료를 위한 멸균 일회용 연성 요관경입니다."],
      "cgr-100": ["CGR-100 시리즈 경성 내시경", "여러 진료과의 최소 침습 진단 및 수술을 위한 오토클레이브 HD 경성 내시경입니다."],
      "cge-100": ["CGE-100 Full HD 의료용 내시경 솔루션", "위장관, 호흡기, 이비인후과, 비뇨기과 및 경성 내시경 시술을 위한 Full HD 1080P 의료용 내시경 플랫폼입니다."],
    },
  },
};

const localizedRows = (rows) => Object.fromEntries(rows.map(([key, ...values]) => [key, Object.fromEntries(languageCodes.map((lang, index) => [lang, values[index]]))]));

const featureLabels = localizedRows([
  ["hdCmos", "Imagen digital CMOS de alta definición", "Yüksek çözünürlüklü CMOS dijital görüntüleme", "Hochauflösende digitale CMOS-Bildgebung", "Imaging digitale CMOS ad alta definizione", "Cyfrowe obrazowanie CMOS wysokiej rozdzielczości", "고해상도 CMOS 디지털 영상"],
  ["imageQuality", "Excelente calidad de imagen y reproducción del color", "Mükemmel görüntü kalitesi ve renk üretimi", "Hervorragende Bildqualität und Farbwiedergabe", "Eccellente qualità dell'immagine e resa cromatica", "Doskonała jakość obrazu i odwzorowanie kolorów", "우수한 화질과 색 재현"],
  ["multipleDiameters", "Varias configuraciones de diámetro", "Birden fazla çap konfigürasyonu", "Mehrere Durchmesserkonfigurationen", "Diverse configurazioni di diametro", "Wiele konfiguracji średnicy", "다양한 직경 구성"],
  ["ergonomicHandle", "Mango de control ligero y ergonómico", "Hafif ve ergonomik kontrol kolu", "Leichter ergonomischer Bediengriff", "Impugnatura di controllo leggera ed ergonomica", "Lekki, ergonomiczny uchwyt sterujący", "가볍고 인체공학적인 조작 핸들"],
  ["ergonomicHandheld", "Manejo manual ergonómico", "Ergonomik el tipi kullanım", "Ergonomische Handbedienung", "Utilizzo manuale ergonomico", "Ergonomiczna obsługa ręczna", "인체공학적 휴대형 조작"],
  ["largeDeflection", "Amplio ángulo de deflexión distal bidireccional", "Geniş çift yönlü uç açılanması", "Großer bidirektionaler Abwinkelungsbereich", "Ampia deflessione bidirezionale della punta", "Duży zakres dwukierunkowego zgięcia końcówki", "넓은 양방향 선단 굴절"],
  ["highDeflection", "Deflexión distal bidireccional de 275°–300°", "275°–300° çift yönlü uç açılanması", "Bidirektionale Spitzenabwinkelung von 275°–300°", "Deflessione bidirezionale della punta di 275°–300°", "Dwukierunkowe zgięcie końcówki 275°–300°", "275°–300° 양방향 선단 굴절"],
  ["ledIllumination", "Iluminación LED integrada", "Entegre LED aydınlatma", "Integrierte LED-Beleuchtung", "Illuminazione LED integrata", "Zintegrowane oświetlenie LED", "통합 LED 조명"],
  ["processorCompatible", "Compatible con procesadores de video para endoscopia", "Endoskopi video işlemcileriyle uyumlu", "Kompatibel mit Endoskopie-Videoprozessoren", "Compatibile con processori video per endoscopia", "Zgodność z procesorami wideo do endoskopii", "내시경 비디오 프로세서와 호환"],
  ["hdProcessorCompatible", "Compatible con procesadores de endoscopia HD", "HD endoskopi işlemcileriyle uyumlu", "Kompatibel mit HD-Endoskopieprozessoren", "Compatibile con processori endoscopici HD", "Zgodność z procesorami endoskopowymi HD", "HD 내시경 프로세서와 호환"],
  ["hdSystemCompatible", "Compatible con sistemas de endoscopia HD", "HD endoskopi sistemleriyle uyumlu", "Kompatibel mit HD-Endoskopiesystemen", "Compatibile con sistemi endoscopici HD", "Zgodność z systemami endoskopowymi HD", "HD 내시경 시스템과 호환"],
  ["smoothInsertion", "Inserción suave para mayor comodidad del paciente", "Hasta konforu için yumuşak ilerletme", "Sanftes Einführen für höheren Patientenkomfort", "Inserimento agevole per un maggiore comfort del paziente", "Płynne wprowadzanie zwiększające komfort pacjenta", "환자 편의를 위한 부드러운 삽입"],
  ["smoothOperation", "Inserción suave y manejo sencillo", "Yumuşak ilerletme ve kolay kullanım", "Sanftes Einführen und einfache Bedienung", "Inserimento agevole e uso semplice", "Płynne wprowadzanie i łatwa obsługa", "부드러운 삽입과 간편한 조작"],
  ["patientComfort", "Inserción suave para mejorar la comodidad del paciente", "Hasta konforunu artıran yumuşak ilerletme", "Sanftes Einführen für verbesserten Patientenkomfort", "Inserimento agevole per migliorare il comfort del paziente", "Płynne wprowadzanie poprawiające komfort pacjenta", "환자 편의를 높이는 부드러운 삽입"],
  ["sterilizableReusable", "Diseño reutilizable y esterilizable", "Sterilize edilebilir yeniden kullanılabilir tasarım", "Sterilisierbare wiederverwendbare Ausführung", "Design riutilizzabile e sterilizzabile", "Sterylizowana konstrukcja wielorazowa", "멸균 가능한 재사용형 설계"],
  ["diagnosticInterventional", "Apto para diagnóstico y procedimientos intervencionistas", "Tanı ve girişimsel işlemler için uygun", "Für Diagnostik und interventionelle Verfahren geeignet", "Adatto a diagnosi e procedure interventistiche", "Do diagnostyki i procedur interwencyjnych", "진단 및 중재 시술에 적합"],
  ["sterileSingleUse", "Diseño estéril de un solo uso", "Steril tek kullanımlık tasarım", "Sterile Einwegausführung", "Design sterile monouso", "Sterylna konstrukcja jednorazowa", "멸균 일회용 설계"],
  ["airwayVisualization", "Visualización flexible de la vía aérea", "Esnek hava yolu görüntüleme", "Flexible Darstellung der Atemwege", "Visualizzazione flessibile delle vie aeree", "Obrazowanie dróg oddechowych za pomocą giętkiego endoskopu", "연성 기도 관찰"],
  ["noReprocessing", "No requiere reprocesamiento del endoscopio", "Endoskop yeniden işleme gerektirmez", "Keine Wiederaufbereitung des Endoskops erforderlich", "Non richiede ricondizionamento dell'endoscopio", "Nie wymaga przygotowania endoskopu do ponownego użycia", "내시경 재처리 불필요"],
  ["noMaintenance", "Sin mantenimiento ni reprocesamiento", "Bakım veya yeniden işleme gerektirmez", "Keine Wartung oder Wiederaufbereitung erforderlich", "Non richiede manutenzione o ricondizionamento", "Nie wymaga konserwacji ani przygotowania do ponownego użycia", "유지보수 및 재처리 불필요"],
  ["reducedCrossContamination", "Menor riesgo de contaminación cruzada", "Azaltılmış çapraz kontaminasyon riski", "Reduziertes Risiko einer Kreuzkontamination", "Rischio ridotto di contaminazione crociata", "Ograniczone ryzyko zakażenia krzyżowego", "교차 오염 위험 감소"],
  ["respiratoryExam", "Apto para exploración respiratoria", "Solunum muayenesi için uygun", "Für respiratorische Untersuchungen geeignet", "Adatto agli esami respiratori", "Do badań układu oddechowego", "호흡기 검사에 적합"],
  ["reusableTube", "Tubo de inserción reutilizable de grado médico", "Yeniden kullanılabilir tıbbi sınıf giriş tüpü", "Wiederverwendbarer Einführschlauch in Medizinqualität", "Tubo di inserimento riutilizzabile di grado medicale", "Wielorazowy przewód wprowadzający klasy medycznej", "의료용 재사용 삽입관"],
  ["flexibility", "Excelente flexibilidad y maniobrabilidad", "Mükemmel esneklik ve manevra kabiliyeti", "Hervorragende Flexibilität und Manövrierbarkeit", "Eccellente flessibilità e manovrabilità", "Doskonała giętkość i sterowność", "우수한 유연성과 조작성"],
  ["irrigation", "Excelente rendimiento de irrigación", "Mükemmel irrigasyon performansı", "Hervorragende Spülleistung", "Eccellente capacità di irrigazione", "Doskonała wydajność płukania", "우수한 관류 성능"],
  ["preciseManeuverability", "Inserción suave y maniobrabilidad precisa", "Yumuşak ilerletme ve hassas manevra", "Sanftes Einführen und präzise Manövrierbarkeit", "Inserimento agevole e manovrabilità precisa", "Płynne wprowadzanie i precyzyjne sterowanie", "부드러운 삽입과 정밀한 조작"],
  ["preciseNavigation", "Inserción suave y navegación precisa", "Yumuşak ilerletme ve hassas yönlendirme", "Sanftes Einführen und präzise Navigation", "Inserimento agevole e navigazione precisa", "Płynne wprowadzanie i precyzyjna nawigacja", "부드러운 삽입과 정밀한 탐색"],
  ["repeatedSterilization", "Diseñado para esterilización repetida", "Tekrarlı sterilizasyon için tasarlanmıştır", "Für wiederholte Sterilisation ausgelegt", "Progettato per sterilizzazioni ripetute", "Przeznaczony do powtarzanej sterylizacji", "반복 멸균용 설계"],
  ["sterilizationDurability", "Alta durabilidad para esterilización repetida", "Tekrarlı sterilizasyona uygun yüksek dayanıklılık", "Hohe Beständigkeit bei wiederholter Sterilisation", "Elevata resistenza alle sterilizzazioni ripetute", "Wysoka trwałość przy powtarzanej sterylizacji", "반복 멸균을 위한 우수한 내구성"],
  ["longTermPerformance", "Rendimiento clínico fiable a largo plazo", "Uzun vadeli güvenilir klinik performans", "Zuverlässige klinische Langzeitleistung", "Prestazioni cliniche affidabili nel tempo", "Niezawodne długotrwałe działanie kliniczne", "장기간 안정적인 임상 성능"],
  ["imageClarity", "Excelente nitidez de imagen", "Mükemmel görüntü netliği", "Hervorragende Bildklarheit", "Eccellente nitidezza dell'immagine", "Doskonała wyrazistość obrazu", "우수한 영상 선명도"],
  ["routineClinical", "Diseñado para uso clínico habitual", "Rutin klinik kullanım için tasarlanmıştır", "Für den klinischen Routineeinsatz ausgelegt", "Progettato per l'uso clinico ordinario", "Do rutynowego zastosowania klinicznego", "일상적인 임상 사용용 설계"],
  ["reducedReprocessingCost", "Menores costes de mantenimiento y reprocesamiento", "Daha düşük bakım ve yeniden işleme maliyetleri", "Reduzierte Wartungs- und Wiederaufbereitungskosten", "Costi ridotti di manutenzione e ricondizionamento", "Niższe koszty konserwacji i przygotowania do ponownego użycia", "유지보수 및 재처리 비용 절감"],
  ["hdOptical", "Imagen óptica de alta definición", "Yüksek çözünürlüklü optik görüntüleme", "Hochauflösende optische Bildgebung", "Imaging ottico ad alta definizione", "Optyczne obrazowanie wysokiej rozdzielczości", "고해상도 광학 영상"],
  ["sapphireWindow", "Ventana distal de zafiro", "Safir distal pencere", "Distales Saphirfenster", "Finestra distale in zaffiro", "Dystalne okno szafirowe", "사파이어 선단 창"],
  ["medicalSteel", "Construcción en acero inoxidable de grado médico", "Tıbbi sınıf paslanmaz çelik yapı", "Konstruktion aus medizinischem Edelstahl", "Struttura in acciaio inossidabile di grado medicale", "Konstrukcja ze stali nierdzewnej klasy medycznej", "의료용 스테인리스강 구조"],
  ["fullyAutoclavable", "Totalmente autoclavable", "Tamamen otoklavlanabilir", "Vollständig autoklavierbar", "Completamente autoclavabile", "W pełni autoklawowalny", "완전 오토클레이브 가능"],
  ["colorReproduction", "Excelente reproducción del color", "Mükemmel renk üretimi", "Hervorragende Farbwiedergabe", "Eccellente resa cromatica", "Doskonałe odwzorowanie kolorów", "우수한 색 재현"],
  ["lightTransmission", "Alta transmisión de luz", "Yüksek ışık geçirgenliği", "Hohe Lichttransmission", "Elevata trasmissione luminosa", "Wysoka transmisja światła", "높은 광 투과율"],
  ["cameraCompatible", "Compatible con sistemas de cámara estándar", "Standart kamera sistemleriyle uyumlu", "Kompatibel mit Standard-Kamerasystemen", "Compatibile con sistemi di telecamere standard", "Zgodność ze standardowymi systemami kamer", "표준 카메라 시스템과 호환"],
  ["viewingAngles", "Disponibles varios ángulos de visión", "Birden fazla görüş açısı seçeneği", "Mehrere Blickwinkel verfügbar", "Disponibile con diversi angoli di visione", "Dostępne różne kąty widzenia", "다양한 관찰 각도 제공"],
  ["minimallyInvasiveSurgery", "Diseñado para cirugía mínimamente invasiva", "Minimal invaziv cerrahi için tasarlanmıştır", "Für minimalinvasive Chirurgie ausgelegt", "Progettato per la chirurgia mini-invasiva", "Do chirurgii małoinwazyjnej", "최소 침습 수술용 설계"],
]);

const applicationLabels = localizedRows([
  ["bronchialExam", "Examen bronquial", "Bronş muayenesi", "Bronchialuntersuchung", "Esame bronchiale", "Badanie oskrzeli", "기관지 검사"],
  ["airwayDiagnosis", "Diagnóstico de la vía aérea", "Hava yolu tanısı", "Atemwegsdiagnostik", "Diagnosi delle vie aeree", "Diagnostyka dróg oddechowych", "기도 진단"],
  ["foreignBodyRemoval", "Extracción de cuerpos extraños", "Yabancı cisim çıkarma", "Fremdkörperentfernung", "Rimozione di corpi estranei", "Usuwanie ciał obcych", "이물 제거"],
  ["bronchialBiopsy", "Biopsia bronquial", "Bronş biyopsisi", "Bronchialbiopsie", "Biopsia bronchiale", "Biopsja oskrzeli", "기관지 생검"],
  ["respiratoryIntervention", "Intervención respiratoria", "Solunum müdahalesi", "Respiratorische Intervention", "Intervento respiratorio", "Zabiegi w układzie oddechowym", "호흡기 중재"],
  ["icuBronchoscopy", "Broncoscopia en UCI", "Yoğun bakım bronkoskopisi", "Bronchoskopie auf der Intensivstation", "Broncoscopia in terapia intensiva", "Bronchoskopia na OIT", "중환자실 기관지경 검사"],
  ["thoracicSurgery", "Cirugía torácica", "Göğüs cerrahisi", "Thoraxchirurgie", "Chirurgia toracica", "Chirurgia klatki piersiowej", "흉부외과"],
  ["pulmonaryMedicine", "Neumología", "Göğüs hastalıkları", "Pneumologie", "Pneumologia", "Pulmonologia", "호흡기내과"],
  ["airwayExam", "Examen de la vía aérea", "Hava yolu muayenesi", "Atemwegsuntersuchung", "Esame delle vie aeree", "Badanie dróg oddechowych", "기도 검사"],
  ["respiratoryDiagnosis", "Diagnóstico respiratorio", "Solunum tanısı", "Respiratorische Diagnostik", "Diagnosi respiratoria", "Diagnostyka układu oddechowego", "호흡기 진단"],
  ["emergencyAirway", "Procedimientos de urgencia de la vía aérea", "Acil hava yolu işlemleri", "Notfallverfahren an den Atemwegen", "Procedure di emergenza sulle vie aeree", "Pilne procedury w obrębie dróg oddechowych", "응급 기도 시술"],
  ["foreignBodyInspection", "Inspección de cuerpos extraños", "Yabancı cisim incelemesi", "Fremdkörperinspektion", "Ispezione di corpi estranei", "Ocena ciał obcych", "이물 확인"],
  ["diagnosticCystoscopy", "Cistoscopia diagnóstica", "Tanısal sistoskopi", "Diagnostische Zystoskopie", "Cistoscopia diagnostica", "Cystoskopia diagnostyczna", "진단적 방광경 검사"],
  ["bladderDisease", "Examen de enfermedades vesicales", "Mesane hastalıklarının incelenmesi", "Untersuchung von Blasenerkrankungen", "Esame delle patologie vescicali", "Badanie chorób pęcherza", "방광 질환 검사"],
  ["urethralExam", "Examen uretral", "Üretra muayenesi", "Harnröhrenuntersuchung", "Esame uretrale", "Badanie cewki moczowej", "요도 검사"],
  ["bladderBiopsy", "Biopsia vesical", "Mesane biyopsisi", "Blasenbiopsie", "Biopsia vescicale", "Biopsja pęcherza", "방광 생검"],
  ["urologyFollowUp", "Seguimiento después de cirugía urológica", "Ürolojik cerrahi sonrası takip", "Nachkontrolle nach urologischen Eingriffen", "Controllo dopo chirurgia urologica", "Kontrola po zabiegu urologicznym", "비뇨기 수술 후 추적 검사"],
  ["routineUrology", "Procedimientos urológicos habituales", "Rutin ürolojik işlemler", "Urologische Routineverfahren", "Procedure urologiche di routine", "Rutynowe procedury urologiczne", "일상적 비뇨기 시술"],
  ["bladderExam", "Examen de la vejiga", "Mesane muayenesi", "Blasenuntersuchung", "Esame della vescica", "Badanie pęcherza", "방광 검사"],
  ["hematuriaDiagnosis", "Diagnóstico de hematuria", "Hematüri tanısı", "Hämaturiediagnostik", "Diagnosi dell'ematuria", "Diagnostyka krwiomoczu", "혈뇨 진단"],
  ["urologicalDiagnosis", "Diagnóstico urológico", "Ürolojik tanı", "Urologische Diagnostik", "Diagnosi urologica", "Diagnostyka urologiczna", "비뇨기 진단"],
  ["minimallyInvasiveCystoscopy", "Procedimientos cistoscópicos mínimamente invasivos", "Minimal invaziv sistoskopi işlemleri", "Minimalinvasive zystoskopische Verfahren", "Procedure cistoscopiche mini-invasive", "Małoinwazyjne procedury cystoskopowe", "최소 침습 방광경 시술"],
  ["nasalExam", "Examen de la cavidad nasal", "Burun boşluğu muayenesi", "Untersuchung der Nasenhöhle", "Esame della cavità nasale", "Badanie jamy nosowej", "비강 검사"],
  ["nasopharyngealDiagnosis", "Diagnóstico nasofaríngeo", "Nazofarenks tanısı", "Nasopharyngeale Diagnostik", "Diagnosi nasofaringea", "Diagnostyka nosogardła", "비인두 진단"],
  ["nasopharyngealExam", "Examen nasofaríngeo", "Nazofarenks muayenesi", "Nasopharyngeale Untersuchung", "Esame nasofaringeo", "Badanie nosogardła", "비인두 검사"],
  ["laryngealExam", "Examen laríngeo", "Larinks muayenesi", "Kehlkopfuntersuchung", "Esame laringeo", "Badanie krtani", "후두 검사"],
  ["vocalCord", "Evaluación de las cuerdas vocales", "Ses teli değerlendirmesi", "Beurteilung der Stimmbänder", "Valutazione delle corde vocali", "Ocena strun głosowych", "성대 평가"],
  ["entOutpatient", "Procedimientos ORL ambulatorios", "KBB poliklinik işlemleri", "Ambulante HNO-Verfahren", "Procedure ORL ambulatoriali", "Ambulatoryjne procedury laryngologiczne", "이비인후과 외래 시술"],
  ["entOutpatientDiagnosis", "Diagnóstico ORL ambulatorio", "KBB poliklinik tanısı", "Ambulante HNO-Diagnostik", "Diagnosi ORL ambulatoriale", "Ambulatoryjna diagnostyka laryngologiczna", "이비인후과 외래 진단"],
  ["biopsyAssistance", "Asistencia para biopsia", "Biyopsi desteği", "Biopsieunterstützung", "Assistenza alla biopsia", "Wspomaganie biopsji", "생검 보조"],
  ["routineEnt", "Examen ORL habitual", "Rutin KBB muayenesi", "HNO-Routineuntersuchung", "Esame ORL di routine", "Rutynowe badanie laryngologiczne", "일상적 이비인후과 검사"],
  ["flexibleUreteroscopy", "Ureteroscopia flexible", "Esnek üreteroskopi", "Flexible Ureteroskopie", "Ureteroscopia flessibile", "Ureteroskopia giętka", "연성 요관경 검사"],
  ["kidneyStoneDiagnosis", "Diagnóstico de cálculos renales", "Böbrek taşı tanısı", "Nierensteindiagnostik", "Diagnosi dei calcoli renali", "Diagnostyka kamieni nerkowych", "신장 결석 진단"],
  ["laserLithotripsy", "Litotricia láser", "Lazer litotripsi", "Laserlithotripsie", "Litotrissia laser", "Litotrypsja laserowa", "레이저 쇄석술"],
  ["ureteralBiopsy", "Biopsia ureteral", "Üreter biyopsisi", "Ureterbiopsie", "Biopsia ureterale", "Biopsja moczowodu", "요관 생검"],
  ["upperUrinaryExam", "Examen de las vías urinarias superiores", "Üst üriner sistem muayenesi", "Untersuchung der oberen Harnwege", "Esame delle alte vie urinarie", "Badanie górnych dróg moczowych", "상부 요로 검사"],
  ["urinaryEndoscopicTreatment", "Tratamiento endoscópico de enfermedades urinarias", "Üriner hastalıkların endoskopik tedavisi", "Endoskopische Behandlung von Harnwegserkrankungen", "Trattamento endoscopico delle patologie urinarie", "Endoskopowe leczenie chorób dróg moczowych", "요로 질환 내시경 치료"],
  ["minimallyInvasiveUrology", "Cirugía urológica mínimamente invasiva", "Minimal invaziv ürolojik cerrahi", "Minimalinvasive urologische Chirurgie", "Chirurgia urologica mini-invasiva", "Małoinwazyjna chirurgia urologiczna", "최소 침습 비뇨기 수술"],
  ["ureteralStoneDiagnosis", "Diagnóstico de cálculos ureterales", "Üreter taşı tanısı", "Harnleitersteindiagnostik", "Diagnosi dei calcoli ureterali", "Diagnostyka kamieni moczowodowych", "요관 결석 진단"],
  ["kidneyStoneExam", "Examen de cálculos renales", "Böbrek taşı incelemesi", "Nierensteinuntersuchung", "Esame dei calcoli renali", "Badanie kamieni nerkowych", "신장 결석 검사"],
  ["urinaryInspection", "Inspección de las vías urinarias", "Üriner sistem incelemesi", "Inspektion der Harnwege", "Ispezione delle vie urinarie", "Ocena dróg moczowych", "요로 관찰"],
  ["upperUrinaryIntervention", "Intervención en las vías urinarias superiores", "Üst üriner sistem müdahalesi", "Intervention an den oberen Harnwegen", "Intervento sulle alte vie urinarie", "Zabiegi w obrębie górnych dróg moczowych", "상부 요로 중재"],
  ["generalSurgery", "Cirugía general", "Genel cerrahi", "Allgemeinchirurgie", "Chirurgia generale", "Chirurgia ogólna", "일반외과"],
  ["laparoscopicSurgery", "Cirugía laparoscópica", "Laparoskopik cerrahi", "Laparoskopische Chirurgie", "Chirurgia laparoscopica", "Chirurgia laparoskopowa", "복강경 수술"],
  ["arthroscopy", "Artroscopia", "Artroskopi", "Arthroskopie", "Artroscopia", "Artroskopia", "관절경"],
  ["entSurgery", "Cirugía ORL", "KBB cerrahisi", "HNO-Chirurgie", "Chirurgia ORL", "Chirurgia laryngologiczna", "이비인후과 수술"],
  ["sinusSurgery", "Cirugía de senos paranasales", "Sinüs cerrahisi", "Nasennebenhöhlenchirurgie", "Chirurgia dei seni paranasali", "Chirurgia zatok", "부비동 수술"],
  ["urology", "Urología", "Üroloji", "Urologie", "Urologia", "Urologia", "비뇨기과"],
  ["gynecology", "Ginecología", "Jinekoloji", "Gynäkologie", "Ginecologia", "Ginekologia", "산부인과"],
  ["minimallyInvasiveSurgery", "Cirugía mínimamente invasiva", "Minimal invaziv cerrahi", "Minimalinvasive Chirurgie", "Chirurgia mini-invasiva", "Chirurgia małoinwazyjna", "최소 침습 수술"],
]);

const accessoryLabels = localizedRows([
  ["flexibleBronchoscope", "Broncoscopio flexible", "Esnek bronkoskop", "Flexibles Bronchoskop", "Broncoscopio flessibile", "Bronchoskop giętki", "연성 기관지경"],
  ["disposableBronchoscope", "Broncoscopio flexible desechable", "Tek kullanımlık esnek bronkoskop", "Flexibles Einweg-Bronchoskop", "Broncoscopio flessibile monouso", "Jednorazowy bronchoskop giętki", "일회용 연성 기관지경"],
  ["reusableCystoscope", "Cistoscopio flexible reutilizable", "Yeniden kullanılabilir esnek sistoskop", "Wiederverwendbares flexibles Zystoskop", "Cistoscopio flessibile riutilizzabile", "Wielorazowy cystoskop giętki", "재사용형 연성 방광경"],
  ["disposableCystoscope", "Cistoscopio flexible desechable", "Tek kullanımlık esnek sistoskop", "Flexibles Einweg-Zystoskop", "Cistoscopio flessibile monouso", "Jednorazowy cystoskop giętki", "일회용 연성 방광경"],
  ["reusableNasopharyngoscope", "Nasofaringoscopio flexible reutilizable", "Yeniden kullanılabilir esnek nazofaringoskop", "Wiederverwendbares flexibles Nasopharyngoskop", "Nasofaringoscopio flessibile riutilizzabile", "Wielorazowy nasofaryngoskop giętki", "재사용형 연성 비인두경"],
  ["disposableNasopharyngoscope", "Nasofaringoscopio flexible desechable", "Tek kullanımlık esnek nazofaringoskop", "Flexibles Einweg-Nasopharyngoskop", "Nasofaringoscopio flessibile monouso", "Jednorazowy nasofaryngoskop giętki", "일회용 연성 비인두경"],
  ["reusableUreteroscope", "Ureteroscopio flexible reutilizable", "Yeniden kullanılabilir esnek üreteroskop", "Wiederverwendbares flexibles Ureteroskop", "Ureteroscopio flessibile riutilizzabile", "Wielorazowy ureteroskop giętki", "재사용형 연성 요관경"],
  ["disposableUreteroscope", "Ureteroscopio flexible desechable", "Tek kullanımlık esnek üreteroskop", "Flexibles Einweg-Ureteroskop", "Ureteroscopio flessibile monouso", "Jednorazowy ureteroskop giętki", "일회용 연성 요관경"],
  ["rigidEndoscope", "Endoscopio rígido", "Rijit endoskop", "Starres Endoskop", "Endoscopio rigido", "Endoskop sztywny", "경성 내시경"],
  ["waterproofCap", "Tapón impermeable", "Su geçirmez kapak", "Wasserdichte Kappe", "Tappo impermeabile", "Korek wodoszczelny", "방수 캡"],
  ["leakTester", "Comprobador de fugas", "Sızıntı test cihazı", "Dichtigkeitsprüfer", "Tester di tenuta", "Tester szczelności", "누수 테스터"],
  ["cleaningBrush", "Cepillo de limpieza", "Temizleme fırçası", "Reinigungsbürste", "Spazzola di pulizia", "Szczoteczka do czyszczenia", "세척 브러시"],
  ["biopsyValve", "Válvula de biopsia", "Biyopsi valfi", "Biopsieventil", "Valvola per biopsia", "Zawór biopsyjny", "생검 밸브"],
  ["carryingCase", "Maletín de transporte", "Taşıma çantası", "Transportkoffer", "Valigetta per il trasporto", "Walizka transportowa", "운반 케이스"],
  ["userManual", "Manual del usuario", "Kullanım kılavuzu", "Benutzerhandbuch", "Manuale utente", "Instrukcja obsługi", "사용자 설명서"],
  ["sterilePackaging", "Envase estéril", "Steril ambalaj", "Sterilverpackung", "Confezione sterile", "Opakowanie sterylne", "멸균 포장"],
  ["sterilizationCap", "Tapón de esterilización", "Sterilizasyon kapağı", "Sterilisationskappe", "Tappo di sterilizzazione", "Korek sterylizacyjny", "멸균 캡"],
  ["protectiveCap", "Tapón protector", "Koruyucu kapak", "Schutzkappe", "Tappo protettivo", "Nasadka ochronna", "보호 캡"],
  ["biopsyForceps", "Pinzas de biopsia", "Biyopsi forsepsi", "Biopsiezange", "Pinza da biopsia", "Kleszczyki biopsyjne", "생검 겸자"],
  ["foreignBodyForceps", "Pinzas para cuerpos extraños", "Yabancı cisim forsepsi", "Fremdkörperzange", "Pinza per corpi estranei", "Kleszczyki do ciał obcych", "이물 겸자"],
  ["cytologyBrush", "Cepillo de citología", "Sitoloji fırçası", "Zytologiebürste", "Spazzolino citologico", "Szczoteczka cytologiczna", "세포진 브러시"],
  ["cleaningKit", "Kit de limpieza", "Temizleme kiti", "Reinigungsset", "Kit di pulizia", "Zestaw do czyszczenia", "세척 키트"],
  ["endoscopyWorkstation", "Estación de trabajo de endoscopia", "Endoskopi iş istasyonu", "Endoskopie-Arbeitsstation", "Workstation per endoscopia", "Stacja robocza do endoskopii", "내시경 워크스테이션"],
  ["videoProcessor", "Procesador de video", "Video işlemcisi", "Videoprozessor", "Processore video", "Procesor wideo", "비디오 프로세서"],
  ["endoscopyVideoProcessor", "Procesador de video para endoscopia", "Endoskopi video işlemcisi", "Endoskopie-Videoprozessor", "Processore video per endoscopia", "Procesor wideo do endoskopii", "내시경 비디오 프로세서"],
  ["hdProcessor", "Procesador de endoscopia HD", "HD endoskopi işlemcisi", "HD-Endoskopieprozessor", "Processore endoscopico HD", "Procesor endoskopowy HD", "HD 내시경 프로세서"],
  ["medicalMonitor", "Monitor médico", "Medikal monitör", "Medizinischer Monitor", "Monitor medicale", "Monitor medyczny", "의료용 모니터"],
  ["trolley", "Carro", "Araba", "Wagen", "Carrello", "Wózek", "카트"],
  ["medicalTrolley", "Carro médico", "Medikal araba", "Medizinischer Wagen", "Carrello medicale", "Wózek medyczny", "의료용 카트"],
  ["irrigationPump", "Bomba de irrigación", "İrrigasyon pompası", "Spülpumpe", "Pompa di irrigazione", "Pompa płucząca", "관류 펌프"],
  ["imageRecording", "Sistema de grabación de imágenes", "Görüntü kayıt sistemi", "Bildaufzeichnungssystem", "Sistema di registrazione immagini", "System rejestracji obrazu", "영상 기록 시스템"],
  ["recordingSystem", "Sistema de grabación", "Kayıt sistemi", "Aufzeichnungssystem", "Sistema di registrazione", "System rejestracji", "기록 시스템"],
  ["sterilizationTray", "Bandeja de esterilización", "Sterilizasyon tepsisi", "Sterilisationsschale", "Vassoio di sterilizzazione", "Taca sterylizacyjna", "멸균 트레이"],
  ["irrigationAccessories", "Accesorios de irrigación", "İrrigasyon aksesuarları", "Spülzubehör", "Accessori per irrigazione", "Akcesoria do płukania", "관류 액세서리"],
  ["stoneBasket", "Cesta para extracción de cálculos", "Taş çıkarma sepeti", "Steinfangkörbchen", "Cestello per recupero calcoli", "Koszyk do usuwania złogów", "결석 회수 바스켓"],
  ["lightSource", "Fuente de luz, si la requiere el sistema", "Sistem gerektiriyorsa ışık kaynağı", "Lichtquelle, falls vom System benötigt", "Sorgente luminosa, se richiesta dal sistema", "Źródło światła, jeśli wymagane przez system", "시스템에 필요한 경우 광원"],
  ["hdCameraHead", "Cabezal de cámara HD", "HD kamera başlığı", "HD-Kamerakopf", "Testa telecamera HD", "Głowica kamery HD", "HD 카메라 헤드"],
  ["ledLightSource", "Fuente de luz fría LED", "LED soğuk ışık kaynağı", "LED-Kaltlichtquelle", "Sorgente di luce fredda LED", "Źródło zimnego światła LED", "LED 냉광원"],
  ["fiberLightCable", "Cable de luz de fibra óptica", "Fiber optik ışık kablosu", "Faseroptisches Lichtkabel", "Cavo luce in fibra ottica", "Światłowodowy przewód oświetleniowy", "광섬유 라이트 케이블"],
  ["endoscopicInstruments", "Instrumentos endoscópicos", "Endoskopik aletler", "Endoskopische Instrumente", "Strumenti endoscopici", "Narzędzia endoskopowe", "내시경 기구"],
]);

const menuProductLabels = localizedRows([
  ["cge-100", "CGE-100 solución de endoscopia Full HD", "CGE-100 Full HD endoskopi çözümü", "CGE-100 Full-HD-Endoskopielösung", "CGE-100 soluzione endoscopica Full HD", "CGE-100 rozwiązanie endoskopowe Full HD", "CGE-100 Full HD 내시경 솔루션"],
  ["cgb-600r", "Broncoscopio reutilizable", "Yeniden kullanılabilir bronkoskop", "Wiederverwendbares Bronchoskop", "Broncoscopio riutilizzabile", "Bronchoskop wielorazowy", "재사용형 기관지경"],
  ["disposable-flexible-bronchoscope", "Broncoscopio desechable", "Tek kullanımlık bronkoskop", "Einweg-Bronchoskop", "Broncoscopio monouso", "Bronchoskop jednorazowy", "일회용 기관지경"],
  ["cgc-350r", "Cistoscopio reutilizable", "Yeniden kullanılabilir sistoskop", "Wiederverwendbares Zystoskop", "Cistoscopio riutilizzabile", "Cystoskop wielorazowy", "재사용형 방광경"],
  ["cgc-350d", "Cistoscopio desechable", "Tek kullanımlık sistoskop", "Einweg-Zystoskop", "Cistoscopio monouso", "Cystoskop jednorazowy", "일회용 방광경"],
  ["cgn-350r", "Nasofaringoscopio reutilizable", "Yeniden kullanılabilir nazofaringoskop", "Wiederverwendbares Nasopharyngoskop", "Nasofaringoscopio riutilizzabile", "Nasofaryngoskop wielorazowy", "재사용형 비인두경"],
  ["cgn-350d", "Nasofaringoscopio desechable", "Tek kullanımlık nazofaringoskop", "Einweg-Nasopharyngoskop", "Nasofaringoscopio monouso", "Nasofaryngoskop jednorazowy", "일회용 비인두경"],
  ["cgu-750r", "Ureteroscopio reutilizable", "Yeniden kullanılabilir üreteroskop", "Wiederverwendbares Ureteroskop", "Ureteroscopio riutilizzabile", "Ureteroskop wielorazowy", "재사용형 요관경"],
  ["cgu-650d", "Ureteroscopio desechable", "Tek kullanımlık üreteroskop", "Einweg-Ureteroskop", "Ureteroscopio monouso", "Ureteroskop jednorazowy", "일회용 요관경"],
  ["cgr-100", "Serie de endoscopios rígidos", "Rijit endoskop serisi", "Serie starrer Endoskope", "Serie di endoscopi rigidi", "Seria endoskopów sztywnych", "경성 내시경 시리즈"],
]);

const cge100Labels = localizedRows([
  ["Specifications", "Especificaciones", "Teknik özellikler", "Spezifikationen", "Specifiche", "Specyfikacje", "사양"],
  ["Compatible Endoscopes", "Endoscopios compatibles", "Uyumlu endoskoplar", "Kompatible Endoskope", "Endoscopi compatibili", "Kompatybilne endoskopy", "호환 내시경"],
  ["Pediatric / Adult / Adult HD", "Pediátrico / adulto / adulto HD", "Pediatrik / yetişkin / yetişkin HD", "Pädiatrisch / Erwachsene / Erwachsene HD", "Pediatrico / adulto / adulto HD", "Pediatryczny / dorośli / dorośli HD", "소아용 / 성인용 / 성인용 HD"],
  ["Pediatric / Adult", "Pediátrico / adulto", "Pediatrik / yetişkin", "Pädiatrisch / Erwachsene", "Pediatrico / adulto", "Pediatryczny / dorośli", "소아용 / 성인용"],
  ["Nasopharyngoscope", "Nasofaringoscopio", "Nazofaringoskop", "Nasopharyngoskop", "Nasofaringoscopio", "Nasofaryngoskop", "비인두경"],
  ["Flexible Cystoscope", "Cistoscopio flexible", "Esnek sistoskop", "Flexibles Zystoskop", "Cistoscopio flessibile", "Cystoskop giętki", "연성 방광경"],
  ["Urology", "Urología", "Üroloji", "Urologie", "Urologia", "Urologia", "비뇨기과"],
  ["ENT / Cystoscope / Laparoscope / Arthroscope", "ORL / Cistoscopio / Laparoscopio / Artroscopio", "KBB / Sistoskop / Laparoskop / Artroskop", "HNO / Zystoskop / Laparoskop / Arthroskop", "ORL / Cistoscopio / Laparoscopio / Artroscopio", "Laryngologia / Cystoskop / Laparoskop / Artroskop", "이비인후과 / 방광경 / 복강경 / 관절경"],
  ["HD Camera Head", "Cabezal de cámara HD", "HD kamera başlığı", "HD-Kamerakopf", "Testa telecamera HD", "Głowica kamery HD", "HD 카메라 헤드"],
  ["Compatible with rigid endoscopes", "Compatible con endoscopios rígidos", "Rijit endoskoplarla uyumlu", "Mit starren Endoskopen kompatibel", "Compatibile con endoscopi rigidi", "Kompatybilny z endoskopami sztywnymi", "경성 내시경과 호환"],
  ["CGE-100 Video Processor", "Procesador de vídeo CGE-100", "CGE-100 video işlemci", "CGE-100 Videoprozessor", "Processore video CGE-100", "Procesor wideo CGE-100", "CGE-100 비디오 프로세서"],
  ["LED Cold Light Source", "Fuente de luz fría LED", "LED soğuk ışık kaynağı", "LED-Kaltlichtquelle", "Sorgente di luce fredda LED", "Źródło zimnego światła LED", "LED 냉광원"],
  ["Water Bottle", "Botella de agua", "Su şişesi", "Wasserflasche", "Bottiglia dell'acqua", "Butelka na wodę", "물통"],
  ["Keyboard", "Teclado", "Klavye", "Tastatur", "Tastiera", "Klawiatura", "키보드"],
  ["Equipotential Cable", "Cable equipotencial", "Eşpotansiyel kablo", "Potentialausgleichskabel", "Cavo equipotenziale", "Przewód wyrównania potencjałów", "등전위 케이블"],
  ["24-inch Medical Monitor", "Monitor médico de 24 pulgadas", "24 inç medikal monitör", "Medizinischer 24-Zoll-Monitor", "Monitor medicale da 24 pollici", "24-calowy monitor medyczny", "24인치 의료용 모니터"],
  ["Medical Trolley", "Carro médico", "Medikal cihaz arabası", "Medizinischer Gerätewagen", "Carrello medicale", "Wózek medyczny", "의료용 카트"],
  ["Workstation Software", "Software de estación de trabajo", "İş istasyonu yazılımı", "Workstation-Software", "Software workstation", "Oprogramowanie stacji roboczej", "워크스테이션 소프트웨어"],
  ["HD-300 Camera Head", "Cabezal de cámara HD-300", "HD-300 kamera başlığı", "HD-300 Kamerakopf", "Testa telecamera HD-300", "Głowica kamery HD-300", "HD-300 카메라 헤드"],
  ["Patient information management", "Gestión de información del paciente", "Hasta bilgisi yönetimi", "Patientendatenverwaltung", "Gestione dei dati del paziente", "Zarządzanie danymi pacjenta", "환자 정보 관리"],
  ["Image and video capture", "Captura de imágenes y vídeo", "Görüntü ve video kaydı", "Bild- und Videoaufnahme", "Acquisizione di immagini e video", "Rejestracja obrazów i wideo", "이미지 및 영상 캡처"],
  ["Procedure recording", "Registro de procedimientos", "Prosedür kaydı", "Dokumentation von Eingriffen", "Registrazione delle procedure", "Rejestracja procedur", "시술 기록"],
  ["Case database management", "Gestión de base de datos de casos", "Vaka veritabanı yönetimi", "Falldatenbankverwaltung", "Gestione del database dei casi", "Zarządzanie bazą przypadków", "증례 데이터베이스 관리"],
  ["Report generation", "Generación de informes", "Rapor oluşturma", "Berichterstellung", "Generazione di referti", "Generowanie raportów", "보고서 생성"],
  ["Image annotation", "Anotación de imágenes", "Görüntü açıklama", "Bildannotation", "Annotazione delle immagini", "Adnotacje obrazów", "이미지 주석"],
  ["USB data export", "Exportación de datos USB", "USB veri aktarımı", "USB-Datenexport", "Esportazione dati USB", "Eksport danych przez USB", "USB 데이터 내보내기"],
  ["Gastroscopy", "Gastroscopia", "Gastroskopi", "Gastroskopie", "Gastroscopia", "Gastroskopia", "위내시경 검사"],
  ["Colonoscopy", "Colonoscopia", "Kolonoskopi", "Koloskopie", "Colonscopia", "Kolonoskopia", "대장내시경 검사"],
  ["Biopsy", "Biopsia", "Biyopsi", "Biopsie", "Biopsia", "Biopsja", "생검"],
  ["Foreign Body Retrieval", "Extracción de cuerpos extraños", "Yabancı cisim çıkarma", "Fremdkörperentfernung", "Rimozione di corpi estranei", "Usuwanie ciał obcych", "이물 제거"],
  ["Bronchoscopy", "Broncoscopia", "Bronkoskopi", "Bronchoskopie", "Broncoscopia", "Bronchoskopia", "기관지경 검사"],
  ["Airway Examination", "Examen de la vía aérea", "Hava yolu muayenesi", "Atemwegsuntersuchung", "Esame delle vie aeree", "Badanie dróg oddechowych", "기도 검사"],
  ["Nasopharyngoscopy", "Nasofaringoscopia", "Nazofaringoskopi", "Nasopharyngoskopie", "Nasofaringoscopia", "Nasofaryngoskopia", "비인두경 검사"],
  ["Throat Examination", "Examen de garganta", "Boğaz muayenesi", "Rachenuntersuchung", "Esame della gola", "Badanie gardła", "인후 검사"],
  ["Flexible Cystoscopy", "Cistoscopia flexible", "Esnek sistoskopi", "Flexible Zystoskopie", "Cistoscopia flessibile", "Cystoskopia giętka", "연성 방광경 검사"],
  ["Rigid Endoscopy", "Endoscopia rígida", "Rijit endoskopi", "Starre Endoskopie", "Endoscopia rigida", "Endoskopia sztywna", "경성 내시경 검사"],
]);

const cge100Copy = {
  es: {
    overview: "El sistema incluye un procesador de vídeo, una fuente de luz fría LED, un monitor y software opcional de estación de trabajo. Un solo procesador admite varios tipos de endoscopios flexibles y rígidos, ofreciendo una solución escalable para hospitales, clínicas y centros de endoscopia.",
    workstation: "El sistema CGE-100 admite una estación de trabajo médica opcional para una gestión de datos y documentación clínica eficientes.",
    browse: "Explore los productos CHIGOX de esta categoría.",
  },
  tr: {
    overview: "Sistem; video işlemci, LED soğuk ışık kaynağı, monitör ve opsiyonel iş istasyonu yazılımından oluşur. Tek işlemci farklı esnek ve rijit endoskop türlerini destekleyerek hastaneler, klinikler ve endoskopi merkezleri için ölçeklenebilir bir çözüm sunar.",
    workstation: "CGE-100 sistemi, verimli veri yönetimi ve klinik dokümantasyon için opsiyonel bir medikal iş istasyonunu destekler.",
    browse: "Bu ürün hiyerarşisindeki CHIGOX ürünlerini inceleyin.",
  },
  de: {
    overview: "Das System besteht aus Videoprozessor, LED-Kaltlichtquelle, Monitor und optionaler Workstation-Software. Ein Prozessor unterstützt mehrere flexible und starre Endoskoptypen und bietet damit eine skalierbare Lösung für Krankenhäuser, Kliniken und Endoskopiezentren.",
    workstation: "Das CGE-100 System unterstützt eine optionale medizinische Workstation für effizientes Datenmanagement und klinische Dokumentation.",
    browse: "Entdecken Sie die CHIGOX Produkte in dieser Produktkategorie.",
  },
  it: {
    overview: "Il sistema comprende un processore video, una sorgente di luce fredda LED, un monitor e un software workstation opzionale. Un unico processore supporta diversi endoscopi flessibili e rigidi, offrendo una soluzione scalabile per ospedali, cliniche e centri di endoscopia.",
    workstation: "Il sistema CGE-100 supporta una workstation medicale opzionale per una gestione efficiente dei dati e della documentazione clinica.",
    browse: "Esplora i prodotti CHIGOX in questa categoria.",
  },
  pl: {
    overview: "System składa się z procesora wideo, źródła zimnego światła LED, monitora oraz opcjonalnego oprogramowania stacji roboczej. Jeden procesor obsługuje różne endoskopy giętkie i sztywne, zapewniając skalowalne rozwiązanie dla szpitali, klinik i pracowni endoskopowych.",
    workstation: "System CGE-100 obsługuje opcjonalną medyczną stację roboczą do sprawnego zarządzania danymi i dokumentacją kliniczną.",
    browse: "Zobacz produkty CHIGOX w tej kategorii.",
  },
  ko: {
    overview: "이 시스템은 비디오 프로세서, LED 냉광원, 모니터 및 옵션 워크스테이션 소프트웨어로 구성됩니다. 하나의 프로세서로 여러 종류의 연성 및 경성 내시경을 지원하여 병원, 의원 및 내시경 센터에 확장 가능한 구성을 제공합니다.",
    workstation: "CGE-100 시스템은 효율적인 데이터 관리와 임상 문서화를 위한 옵션 의료용 워크스테이션을 지원합니다.",
    browse: "이 제품 분류에서 CHIGOX 제품을 확인하세요.",
  },
};

const specReplacements = {
  es: {
    "CHIGOX Model": "Modelo CHIGOX", "Outer Diameter": "Diámetro exterior", "Working Channel": "Canal de trabajo", "Working Length": "Longitud de trabajo",
    "Field of View": "Campo de visión", "Depth of Field": "Profundidad de campo", "Tip Deflection": "Deflexión distal", "Image Resolution": "Resolución de imagen",
    Application: "Aplicación", "View Direction": "Dirección de visión", Autoclavable: "Autoclavable", Yes: "Sí", Item: "Elemento", Specification: "Especificación",
    "Product Type": "Tipo de producto", "Available Models": "Modelos disponibles", "Detailed Specifications": "Especificaciones detalladas",
    "Available on request": "Disponibles previa solicitud", "Contact CHIGOX": "Contacte con CHIGOX", "HD Digital Imaging": "Imagen digital HD",
    "Refer to product specifications": "Consulte las especificaciones del producto", Arthroscope: "Artroscopio", Cystoscope: "Cistoscopio", Hysteroscope: "Histeroscopio",
    Sinuscope: "Sinuscopio", Laparoscope: "Laparoscopio", "ENT Endoscope": "Endoscopio ORL",
    "A separate technical specification document was not supplied with the source materials. No reusable-model parameters have been copied to this disposable product.": "No se suministró un documento técnico independiente con los materiales de origen. No se han copiado parámetros de modelos reutilizables en este producto desechable.",
    "Additional reusable configurations can be added to the CGU-750R Series as new models become available.": "Podrán añadirse configuraciones reutilizables adicionales a la serie CGU-750R cuando haya nuevos modelos disponibles.",
    "Additional rigid endoscope models can be continuously added to this table as the product portfolio expands.": "Podrán añadirse nuevos modelos de endoscopio rígido a esta tabla a medida que se amplíe la gama de productos.",
  },
  tr: {
    "CHIGOX Model": "CHIGOX Modeli", "Outer Diameter": "Dış çap", "Working Channel": "Çalışma kanalı", "Working Length": "Çalışma uzunluğu",
    "Field of View": "Görüş alanı", "Depth of Field": "Alan derinliği", "Tip Deflection": "Uç açılanması", "Image Resolution": "Görüntü çözünürlüğü",
    Application: "Uygulama", "View Direction": "Görüş yönü", Autoclavable: "Otoklavlanabilir", Yes: "Evet", Item: "Öğe", Specification: "Teknik özellik",
    "Product Type": "Ürün türü", "Available Models": "Mevcut modeller", "Detailed Specifications": "Ayrıntılı teknik özellikler",
    "Available on request": "Talep üzerine sunulur", "Contact CHIGOX": "CHIGOX ile iletişime geçin", "HD Digital Imaging": "HD dijital görüntüleme",
    "Refer to product specifications": "Ürün teknik özelliklerine bakın", Arthroscope: "Artroskop", Cystoscope: "Sistoskop", Hysteroscope: "Histeroskop",
    Sinuscope: "Sinüskop", Laparoscope: "Laparoskop", "ENT Endoscope": "KBB endoskopu",
    "A separate technical specification document was not supplied with the source materials. No reusable-model parameters have been copied to this disposable product.": "Kaynak materyallerle birlikte ayrı bir teknik özellik belgesi sağlanmamıştır. Yeniden kullanılabilir model parametreleri bu tek kullanımlık ürüne kopyalanmamıştır.",
    "Additional reusable configurations can be added to the CGU-750R Series as new models become available.": "Yeni modeller sunuldukça CGU-750R Serisine ek yeniden kullanılabilir konfigürasyonlar eklenebilir.",
    "Additional rigid endoscope models can be continuously added to this table as the product portföyü expands.": "Ürün portföyü genişledikçe bu tabloya ek rijit endoskop modelleri eklenebilir.",
    "Additional rigid endoscope models can be continuously added to this table as the product portfolio expands.": "Ürün portföyü genişledikçe bu tabloya ek rijit endoskop modelleri eklenebilir.",
  },
  de: {
    "CHIGOX Model": "CHIGOX-Modell", "Outer Diameter": "Außendurchmesser", "Working Channel": "Arbeitskanal", "Working Length": "Arbeitslänge",
    "Field of View": "Sichtfeld", "Depth of Field": "Schärfentiefe", "Tip Deflection": "Spitzenabwinkelung", "Image Resolution": "Bildauflösung",
    Application: "Anwendung", "View Direction": "Blickrichtung", Autoclavable: "Autoklavierbar", Yes: "Ja", Item: "Position", Specification: "Spezifikation",
    "Product Type": "Produkttyp", "Available Models": "Verfügbare Modelle", "Detailed Specifications": "Detaillierte Spezifikationen",
    "Available on request": "Auf Anfrage erhältlich", "Contact CHIGOX": "CHIGOX kontaktieren", "HD Digital Imaging": "Digitale HD-Bildgebung",
    "Refer to product specifications": "Siehe Produktspezifikationen", Arthroscope: "Arthroskop", Cystoscope: "Zystoskop", Hysteroscope: "Hysteroskop",
    Sinuscope: "Sinuskop", Laparoscope: "Laparoskop", "ENT Endoscope": "HNO-Endoskop",
    "A separate technical specification document was not supplied with the source materials. No reusable-model parameters have been copied to this disposable product.": "Mit den Ausgangsmaterialien wurde kein separates technisches Datenblatt geliefert. Es wurden keine Parameter wiederverwendbarer Modelle auf dieses Einwegprodukt übertragen.",
    "Additional reusable configurations can be added to the CGU-750R Series as new models become available.": "Weitere wiederverwendbare Konfigurationen können der CGU-750R Serie hinzugefügt werden, sobald neue Modelle verfügbar sind.",
    "Additional rigid endoscope models can be continuously added to this table as the product portfolio expands.": "Mit der Erweiterung des Produktportfolios können dieser Tabelle weitere Modelle starrer Endoskope hinzugefügt werden.",
  },
  it: {
    "CHIGOX Model": "Modello CHIGOX", "Outer Diameter": "Diametro esterno", "Working Channel": "Canale operativo", "Working Length": "Lunghezza operativa",
    "Field of View": "Campo visivo", "Depth of Field": "Profondità di campo", "Tip Deflection": "Deflessione della punta", "Image Resolution": "Risoluzione dell'immagine",
    Application: "Applicazione", "View Direction": "Direzione di visione", Autoclavable: "Autoclavabile", Yes: "Sì", Item: "Voce", Specification: "Specifica",
    "Product Type": "Tipo di prodotto", "Available Models": "Modelli disponibili", "Detailed Specifications": "Specifiche dettagliate",
    "Available on request": "Disponibili su richiesta", "Contact CHIGOX": "Contattare CHIGOX", "HD Digital Imaging": "Imaging digitale HD",
    "Refer to product specifications": "Consultare le specifiche del prodotto", Arthroscope: "Artroscopio", Cystoscope: "Cistoscopio", Hysteroscope: "Isteroscopio",
    Sinuscope: "Sinuscopio", Laparoscope: "Laparoscopio", "ENT Endoscope": "Endoscopio ORL",
    "A separate technical specification document was not supplied with the source materials. No reusable-model parameters have been copied to this disposable product.": "I materiali di origine non comprendevano un documento tecnico separato. Nessun parametro dei modelli riutilizzabili è stato copiato in questo prodotto monouso.",
    "Additional reusable configurations can be added to the CGU-750R Series as new models become available.": "Ulteriori configurazioni riutilizzabili potranno essere aggiunte alla serie CGU-750R quando saranno disponibili nuovi modelli.",
    "Additional rigid endoscope models can be continuously added to this table as the product portfolio expands.": "Con l'ampliamento della gamma potranno essere aggiunti a questa tabella altri modelli di endoscopi rigidi.",
  },
  pl: {
    "CHIGOX Model": "Model CHIGOX", "Outer Diameter": "Średnica zewnętrzna", "Working Channel": "Kanał roboczy", "Working Length": "Długość robocza",
    "Field of View": "Pole widzenia", "Depth of Field": "Głębia ostrości", "Tip Deflection": "Zgięcie końcówki", "Image Resolution": "Rozdzielczość obrazu",
    Application: "Zastosowanie", "View Direction": "Kierunek patrzenia", Autoclavable: "Autoklawowalny", Yes: "Tak", Item: "Pozycja", Specification: "Specyfikacja",
    "Product Type": "Typ produktu", "Available Models": "Dostępne modele", "Detailed Specifications": "Szczegółowa specyfikacja",
    "Available on request": "Dostępne na zapytanie", "Contact CHIGOX": "Skontaktuj się z CHIGOX", "HD Digital Imaging": "Cyfrowe obrazowanie HD",
    "Refer to product specifications": "Patrz specyfikacja produktu", Arthroscope: "Artroskop", Cystoscope: "Cystoskop", Hysteroscope: "Histeroskop",
    Sinuscope: "Sinusoskop", Laparoscope: "Laparoskop", "ENT Endoscope": "Endoskop laryngologiczny",
    "A separate technical specification document was not supplied with the source materials. No reusable-model parameters have been copied to this disposable product.": "Materiały źródłowe nie zawierały oddzielnej specyfikacji technicznej. Do tego produktu jednorazowego nie przeniesiono parametrów modeli wielorazowych.",
    "Additional reusable configurations can be added to the CGU-750R Series as new models become available.": "Wraz z pojawianiem się nowych modeli do serii CGU-750R mogą być dodawane kolejne konfiguracje wielorazowe.",
    "Additional rigid endoscope models can be continuously added to this table as the product portfolio expands.": "Wraz z rozwojem oferty do tabeli mogą być dodawane kolejne modele endoskopów sztywnych.",
  },
  ko: {
    "CHIGOX Model": "CHIGOX 모델", "Outer Diameter": "외경", "Working Channel": "작업 채널", "Working Length": "작업 길이",
    "Field of View": "시야각", "Depth of Field": "초점 심도", "Tip Deflection": "선단 굴절", "Image Resolution": "영상 해상도",
    Application: "적용 분야", "View Direction": "관찰 방향", Autoclavable: "오토클레이브 가능", Yes: "예", Item: "항목", Specification: "사양",
    "Product Type": "제품 유형", "Available Models": "제공 모델", "Detailed Specifications": "상세 사양",
    "Available on request": "요청 시 제공", "Contact CHIGOX": "CHIGOX에 문의", "HD Digital Imaging": "HD 디지털 영상",
    "Refer to product specifications": "제품 사양 참조", Arthroscope: "관절경", Cystoscope: "방광경", Hysteroscope: "자궁경",
    Sinuscope: "부비동경", Laparoscope: "복강경", "ENT Endoscope": "이비인후과 내시경",
    "A separate technical specification document was not supplied with the source materials. No reusable-model parameters have been copied to this disposable product.": "원본 자료에는 별도의 기술 사양서가 제공되지 않았습니다. 재사용형 모델의 사양을 이 일회용 제품에 복사하지 않았습니다.",
    "Additional reusable configurations can be added to the CGU-750R Series as new models become available.": "새 모델이 출시되면 CGU-750R 시리즈에 추가 재사용형 구성을 반영할 수 있습니다.",
    "Additional rigid endoscope models can be continuously added to this table as the product portfolio expands.": "제품군이 확장되면 이 표에 경성 내시경 모델을 계속 추가할 수 있습니다.",
  },
};

const translateSpec = (html, lang, slug) => {
  const replacements = {
    ...specReplacements[lang],
    ...Object.fromEntries(Object.entries(applicationLabels).map(([key, values]) => [key, values[lang]])),
    "Disposable Flexible Bronchoscope": packs[lang].productCopy[slug]?.[0],
  };
  return html.replace(/>([^<>]+)</g, (match, value) => {
    const trimmed = value.trim();
    const translated = replacements[trimmed];
    return translated ? `>${value.replace(trimmed, translated)}<` : match;
  });
};

const getEnglishSpec = (slug, product) => {
  const html = read(`${productRoute(product)}/${slug}/index.html`);
  const match = html.match(/<div class="endoscopy-spec-wrap">[\s\S]*?<\/div>(?:<p class="endoscopy-category-note">[\s\S]*?<\/p>)?/);
  if (!match) throw new Error(`Missing specification table for ${slug}`);
  return match[0];
};

const hreflangLinks = (route) => [
  ...hreflangCodes.map((lang) => `<link rel="alternate" hreflang="${lang}" href="${localizedUrl(lang === "en" ? "" : lang, route)}">`),
  `<link rel="alternate" hreflang="x-default" href="${localizedUrl("", route)}">`,
].join("\n  ");

const setHead = (html, { lang, route, title, description, image }) => {
  const canonical = localizedUrl(lang, route);
  html = html
    .replace(/<html lang="[^"]+">/, `<html lang="${lang || "en"}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)} | CHIGOX</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`)
    .replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g, "")
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(title)} | CHIGOX">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${canonical}">`);
  html = html.replace(`<link rel="canonical" href="${canonical}">`, `<link rel="canonical" href="${canonical}">\n  ${hreflangLinks(route)}`);
  if (image) html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${image}">`);
  if (!html.includes("/assets/css/endoscopy-products.css")) {
    html = html.replace(/(<link rel="stylesheet" href="\/assets\/css\/footer\.css">)/, `$1\n  <link rel="stylesheet" href="/assets/css/endoscopy-products.css">`);
  }
  return html;
};

const renderProductMain = (lang, slug, product) => {
  const pack = packs[lang];
  const ui = pack.ui;
  const [title, summary] = pack.productCopy[slug];
  const [, categoryDescription] = pack.categories[product.category];
  const variantOverview = product.variant === "reusable" ? ui.reusableOverview : product.variant === "disposable" ? ui.disposableOverview : ui.rigidOverview;
  const productType = product.type === "rigid" ? ui.rigidType : ui.flexibleType;
  const variantLabel = product.variant ? ui[product.variant] : null;
  const imageBase = "/assets/products/endoscopy/";
  const heroImage = `<div class="hero-product-image"><img src="${imageBase}${product.images[0]}" alt="${escapeHtml(title)}" loading="eager" decoding="async"></div>`;
  const gallery = `<section class="product-images"><div class="section-heading"><span>${ui.images}</span><h2>${ui.productImages}</h2></div><div class="product-image-gallery">${product.images.map((image, index) => `<figure><img src="${imageBase}${image}" alt="${escapeHtml(title)} ${ui.images.toLowerCase()} ${index + 1}" loading="lazy" decoding="async"></figure>`).join("")}</div></section>`;
  const model = product.model === "Contact CHIGOX" ? specReplacements[lang]["Contact CHIGOX"] : product.model;
  const spec = translateSpec(getEnglishSpec(slug, product), lang, slug);
  return `<main>
  <section class="product-hero">
    <div><p class="eyebrow">${productType}</p><h1>${title}</h1><p>${summary}</p><div class="badges"><span>${ui.humanUse}</span>${variantLabel ? `<span>${variantLabel}</span>` : ""}</div><a class="btn primary" href="#inquiry">${ui.requestQuote}</a></div>
    ${heroImage}
  </section>
  ${gallery}
  <section class="product-detail-grid">
    <div><div class="section-heading"><span>${ui.overview}</span><h2>${ui.productOverview}</h2><p>${summary}</p><p>${categoryDescription}</p><p>${variantOverview}</p></div><h2>${ui.keyFeatures}</h2>${list(product.features.map((key) => featureLabels[key][lang]))}<h2>${ui.applications}</h2>${list(product.applications.map((key) => applicationLabels[key][lang]))}</div>
    <aside><h2>${ui.basicInfo}</h2><table class="spec-table"><tbody><tr><th>${ui.productName}</th><td>${title}</td></tr><tr><th>${ui.model}</th><td>${model}</td></tr><tr><th>${ui.productType}</th><td>${productType}</td></tr></tbody></table></aside>
  </section>
  <section class="band"><div class="section-heading"><span>${ui.specifications}</span><h2>${ui.technicalSpecifications}</h2></div>${spec}</section>
  <section class="two-columns"><div><h2>${ui.standardConfiguration}</h2>${list(product.standard.map((key) => accessoryLabels[key][lang]))}</div><div><h2>${ui.optionalAccessories}</h2>${list(product.optional.map((key) => accessoryLabels[key][lang]))}</div></section>
  <section id="inquiry" class="inquiry-section"><div><div class="section-heading"><span>${ui.requestQuote}</span><h2>${ui.inquiryForm}</h2><p>${ui.inquiryIntro}</p></div></div><form class="inquiry-form" action="mailto:info@chigox.com" method="post" enctype="text/plain">
    <label>${ui.name}<input name="Name" required></label><label>${ui.email}<input name="Email" type="email" required></label><label>${ui.company}<input name="Company"></label><label>${ui.product}<input name="Product" value="${escapeHtml(title)}"></label><label class="full">${ui.message}<textarea name="Message" rows="5" placeholder="${escapeHtml(ui.placeholder)}"></textarea></label><button class="btn primary" type="submit">${ui.sendInquiry}</button>
  </form></section>
</main>`;
};

const renderCategoryMain = (lang, category) => {
  const pack = packs[lang];
  const ui = pack.ui;
  const [name, description] = pack.categories[category.slug];
  const cards = category.productSlugs.map((slug) => {
    const product = products[slug];
    const [title, summary] = pack.productCopy[slug];
    const variantLabel = product.variant ? ui[product.variant] : null;
    return `<article class="product-card"><a class="product-image" href="/${lang}/products/endoscopy-system/${category.slug}/${slug}/"><img src="/assets/products/endoscopy/${product.images[0]}" alt="${escapeHtml(title)}" loading="lazy" decoding="async"></a><div class="product-card-body"><div class="badges"><span>${ui.humanUse}</span>${variantLabel ? `<span>${variantLabel}</span>` : ""}</div><p class="eyebrow">${name}</p><h3><a href="/${lang}/products/endoscopy-system/${category.slug}/${slug}/">${title}</a></h3><p>${summary}</p><a class="text-link" href="/${lang}/products/endoscopy-system/${category.slug}/${slug}/">${ui.viewProduct}</a></div></article>`;
  }).join("");
  return `<main><section class="page-hero"><p class="eyebrow">${ui.productCategory}</p><h1>${name}</h1><p>${description}</p></section><section class="band"><div class="section-heading"><span>${ui.products}</span><h2>${name}</h2></div><div class="product-grid">${cards}</div></section><section class="cta"><h2>${ui.needConfiguration}</h2><p>${ui.configurationPrompt}</p><div><a class="btn primary" href="/${lang}/contact-us/">${ui.contact}</a><a class="btn secondary" href="mailto:info@chigox.com">${ui.emailSales}</a></div></section></main>`;
};

const renderTopCategoryMain = (lang) => {
  const pack = packs[lang];
  const ui = pack.ui;
  const cards = categoryOrder.map((category) => {
    const [name] = pack.categories[category.slug];
    const count = category.productSlugs.length;
    const countLabel = count === 1 ? ui.productSingular : ui.productPlural;
    return `<a class="category-tile" href="/${lang}/products/endoscopy-system/${category.slug}/"><span>${name}</span><p>${count} ${countLabel}</p></a>`;
  }).join("");
  return `<main><section class="page-hero"><p class="eyebrow">${ui.productCategory}</p><h1>${ui.endoscopy}</h1><p>${pack.categories["endoscope-system"][1]}</p></section><section><div class="section-heading"><span>${ui.subcategories}</span><h2>${ui.subcategoryHeading}</h2></div><div class="category-grid">${cards}</div></section><section class="cta"><h2>${ui.needConfiguration}</h2><p>${ui.configurationPrompt}</p><div><a class="btn primary" href="/${lang}/contact-us/">${ui.contact}</a><a class="btn secondary" href="mailto:info@chigox.com">${ui.emailSales}</a></div></section></main>`;
};

const renderMenuDetails = (lang) => categoryOrder.map((category) => {
  const label = packs[lang].categories[category.slug][0];
  const links = category.productSlugs.map((slug) => `<li><a href="/${lang}/products/endoscopy-system/${category.slug}/${slug}/">${menuProductLabels[slug][lang]}</a></li>`).join("");
  return `<details class="product-menu-subgroup">\n          <summary>${label}</summary>\n          <ul>${links}</ul>\n        </details>`;
}).join("\n        ");

const updateMenu = (html, lang) => {
  const details = renderMenuDetails(lang);
  const pattern = /(<section class="product-menu-group">\s*<img class="product-menu-image" src="\/assets\/内窥镜\.png"[\s\S]*?<a class="product-menu-heading"[^>]*>[^<]+<\/a>)[\s\S]*?(\s*<\/section>)/;
  if (!pattern.test(html)) throw new Error(`Could not locate Endoscopy menu for ${lang}`);
  return html.replace(pattern, `$1\n        ${details}$2`);
};

const walkHtml = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
  const relative = path.join(dir, entry.name);
  if (entry.isDirectory()) return walkHtml(relative);
  return entry.name.endsWith(".html") ? [relative] : [];
});

const setHreflangOnly = (html, route) => {
  const canonicalMatch = html.match(/<link rel="canonical" href="[^"]*">/);
  if (!canonicalMatch) throw new Error(`Missing canonical for ${route}`);
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g, "");
  return html.replace(canonicalMatch[0], `${canonicalMatch[0]}\n  ${hreflangLinks(route)}`);
};

const replaceExactText = (html, replacements) => html.replace(/>([^<>]+)</g, (match, value) => {
  const trimmed = value.trim();
  const translated = replacements[trimmed];
  return translated ? `>${value.replace(trimmed, translated)}<` : match;
});

const cgeRelatedCopy = {
  es: {
    mesher: "CG-7C malla para injertos de piel", dermatome: "CG-Q1 dermatomo eléctrico", ultrasound: "CGU-03 ecógrafo inalámbrico portátil convexo y transvaginal",
    professional: "para aplicaciones médicas y veterinarias profesionales.", ultrasoundDescription: "CGU-03 es un ecógrafo inalámbrico portátil de doble cabezal que integra una sonda convexa y una transvaginal en un dispositivo compacto.",
  },
  tr: {
    mesher: "CG-7C deri grefti meşleyici", dermatome: "CG-Q1 elektrikli dermatom", ultrasound: "CGU-03 kablosuz el tipi konveks ve transvajinal ultrason tarayıcı",
    professional: "profesyonel medikal ve veteriner uygulamaları için tasarlanmıştır.", ultrasoundDescription: "CGU-03, konveks ve transvajinal probu tek kompakt cihazda birleştiren kablosuz çift başlıklı el tipi ultrason tarayıcıdır.",
  },
  de: {
    mesher: "CG-7C Hauttransplantat-Mesher", dermatome: "CG-Q1 elektrisches Dermatom", ultrasound: "CGU-03 kabelloser Handheld-Konvex- und Transvaginal-Ultraschallscanner",
    professional: "für professionelle medizinische und veterinärmedizinische Anwendungen.", ultrasoundDescription: "CGU-03 ist ein kabelloser Handheld-Ultraschallscanner mit zwei Schallköpfen, der eine Konvex- und eine Transvaginalsonde in einem kompakten Gerät vereint.",
  },
  it: {
    mesher: "CG-7C espansore per innesti cutanei", dermatome: "CG-Q1 dermatomo elettrico", ultrasound: "CGU-03 ecografo wireless portatile convesso e transvaginale",
    professional: "per applicazioni mediche e veterinarie professionali.", ultrasoundDescription: "CGU-03 è un ecografo wireless portatile a doppia sonda che integra una sonda convessa e una transvaginale in un unico dispositivo compatto.",
  },
  pl: {
    mesher: "CG-7C siatkownica do przeszczepów skóry", dermatome: "CG-Q1 dermatom elektryczny", ultrasound: "CGU-03 bezprzewodowy ręczny ultrasonograf konweksowy i transwaginalny",
    professional: "do profesjonalnych zastosowań medycznych i weterynaryjnych.", ultrasoundDescription: "CGU-03 to bezprzewodowy ręczny ultrasonograf z dwiema głowicami, łączący głowicę konweksową i transwaginalną w jednym kompaktowym urządzeniu.",
  },
  ko: {
    mesher: "CG-7C 피부이식 메셔", dermatome: "CG-Q1 전동 더마톰", ultrasound: "CGU-03 무선 휴대용 컨벡스 및 질식 초음파 스캐너",
    professional: "전문 의료 및 동물용 적용을 위한 제품입니다.", ultrasoundDescription: "CGU-03은 컨벡스 프로브와 질식 프로브를 하나의 소형 장치에 통합한 무선 듀얼 헤드 휴대용 초음파 스캐너입니다.",
  },
};

const localizeExistingEndoscopyUi = (html, lang) => {
  const pack = packs[lang];
  const ui = pack.ui;
  const [title, summary] = pack.productCopy["cge-100"];
  const cgeCopy = cge100Copy[lang];
  const related = cgeRelatedCopy[lang];
  const labels = Object.fromEntries(Object.entries(cge100Labels).map(([key, values]) => [key, values[lang]]));
  const description = `${title}. ${summary}`;

  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)} | CHIGOX</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(title)} | CHIGOX">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(description)}">`)
    .replaceAll("CGE-100 Full HD Medical Endoscopy Solution", title)
    .replaceAll("CGE-100 is a Full HD 1080P medical endoscopy platform designed for gastrointestinal, respiratory, ENT, urology and rigid endoscopy procedures.", summary)
    .replaceAll("The system consists of a video processor, LED cold light source, monitor, and optional workstation software. One processor can support multiple types of flexible and rigid endoscopes, providing a scalable solution for hospitals, clinics and endoscopy centers.", cgeCopy.overview)
    .replaceAll("The CGE-100 system supports an optional medical workstation for efficient data management and clinical documentation.", cgeCopy.workstation)
    .replaceAll("Browse CHIGOX products in this product hierarchy.", cgeCopy.browse)
    .replaceAll("Compatible Endoscopes", labels["Compatible Endoscopes"])
    .replaceAll("CG-7C Skin Graft Mesher", related.mesher)
    .replaceAll("CG-Q1 Electric Dermatome", related.dermatome)
    .replace(/CGU-03 Wireless Handheld Convex &amp; Transvaginal [^<"]* Scanner/g, related.ultrasound)
    .replace(/CGU-03 Wireless Handheld Convex & Transvaginal [^<"]* Scanner/g, related.ultrasound)
    .replaceAll("CGU-03 is a wireless dual-head handheld ultrasound scanner integrating a convex probe and a transvaginal probe into a single compact device.", related.ultrasoundDescription)
    .replaceAll("for professional medical and veterinary applications.", related.professional)
    .replaceAll("LED Cold Fuente de luz", labels["LED Cold Light Source"])
    .replaceAll("LED Cold Işık kaynağı", labels["LED Cold Light Source"])
    .replaceAll("LED Cold Lichtquelle", labels["LED Cold Light Source"])
    .replaceAll("LED Cold Sorgente luminosa", labels["LED Cold Light Source"])
    .replaceAll("LED Cold Źródło światła", labels["LED Cold Light Source"])
    .replace(/<h2>Inquiry Form<\/h2>/g, `<h2>${ui.inquiryForm}</h2>`)
    .replace(/placeholder="Tell us your application, quantity, and target market\."/g, `placeholder="${escapeHtml(ui.placeholder)}"`)
    .replace(/<h2>Need a configuration for this category\?<\/h2>/g, `<h2>${ui.needConfiguration}</h2>`);

  return replaceExactText(html, labels);
};

for (const lang of languageCodes) {
  const pack = packs[lang];
  const productTemplate = read(`${lang}/products/endoscopy-system/endoscope-system/cge-100/index.html`);
  const categoryTemplate = read(`${lang}/products/endoscopy-system/endoscope-system/index.html`);
  const topTemplate = read(`${lang}/products/endoscopy-system/index.html`);

  for (const category of categoryOrder.filter(({ slug }) => slug !== "endoscope-system")) {
    const route = `products/endoscopy-system/${category.slug}`;
    const [name, description] = pack.categories[category.slug];
    let html = setHead(categoryTemplate, { lang, route, title: `${name} | ${pack.ui.products}`, description });
    html = html.replace(/<main>[\s\S]*?<\/main>/, renderCategoryMain(lang, category));
    write(`${lang}/${route}/index.html`, html);
  }

  for (const [slug, product] of Object.entries(products)) {
    const route = `${productRoute(product)}/${slug}`;
    const [title, description] = pack.productCopy[slug];
    const image = `https://www.chigox.com/assets/products/endoscopy/${product.images[0]}`;
    let html = setHead(productTemplate, { lang, route, title, description, image });
    html = html.replace(/<main>[\s\S]*?<\/main>/, renderProductMain(lang, slug, product));
    write(`${lang}/${route}/index.html`, html);
  }

  const topRoute = "products/endoscopy-system";
  let topHtml = setHead(topTemplate, { lang, route: topRoute, title: pack.ui.endoscopy, description: pack.categories["endoscope-system"][1] });
  topHtml = topHtml.replace(/<main>[\s\S]*?<\/main>/, renderTopCategoryMain(lang));
  write(`${lang}/${topRoute}/index.html`, topHtml);

  for (const route of [
    "products/endoscopy-system/cge-100",
    "products/endoscopy-system/endoscope-system",
    "products/endoscopy-system/endoscope-system/cge-100",
  ]) {
    const file = `${lang}/${route}/index.html`;
    write(file, localizeExistingEndoscopyUi(read(file), lang));
  }

  for (const file of walkHtml(lang)) write(file, updateMenu(read(file), lang));
}

const canonicalRoutes = [
  "products/endoscopy-system",
  ...categoryOrder.map(({ slug }) => `products/endoscopy-system/${slug}`),
  "products/endoscopy-system/endoscope-system/cge-100",
  ...Object.entries(products).map(([slug, product]) => `${productRoute(product)}/${slug}`),
];

for (const route of canonicalRoutes) {
  const englishFile = `${route}/index.html`;
  write(englishFile, setHreflangOnly(read(englishFile), route));
  for (const lang of languageCodes) {
    const localizedFile = `${lang}/${route}/index.html`;
    write(localizedFile, setHreflangOnly(read(localizedFile), route));
  }
}

let sitemap = read("sitemap.xml");
const newUrls = ["", ...languageCodes].flatMap((lang) => canonicalRoutes.map((route) => localizedUrl(lang, route))).filter((url) => !sitemap.includes(`<loc>${url}</loc>`));
if (newUrls.length) sitemap = sitemap.replace("</urlset>", `${newUrls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>`);
write("sitemap.xml", sitemap);

console.log(`Generated ${languageCodes.length * 5} localized category pages and ${languageCodes.length * 9} localized product pages.`);
console.log(`Updated Products menus in ${languageCodes.reduce((count, lang) => count + walkHtml(lang).length, 0)} localized pages.`);
console.log(`Added ${newUrls.length} URLs to sitemap.xml.`);

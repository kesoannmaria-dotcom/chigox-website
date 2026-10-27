import fs from "node:fs";
import path from "node:path";
import { collectCoreSourceStrings } from "./core-localization.mjs";
import { extractProtectedTechnicalTokens, terminology } from "./translation-rules.mjs";

const ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const TARGETS = Object.freeze({ fr: "fr", pt: "pt" });
const MAX_BATCH_CHARACTERS = 3200;

const manualOverrides = Object.freeze({
  fr: {
    "Request Quote": terminology.fr.requestQuote,
    "Send Inquiry": terminology.fr.sendInquiry,
    "Endoscopy System": terminology.fr.endoscopySystem,
    "Rigid Endoscope": terminology.fr.rigidEndoscope,
    "Contact Us": "Nous contacter",
    "All Products": "Tous les produits",
    "Technical Specifications": "Caractéristiques techniques",
    "Inquiry Form": "Formulaire de demande",
    "Application": "Application",
    "Blog": "Blog",
    "Cart Ultrasound": "Échographe sur chariot",
    "Endoscope System": "Système d'endoscopie",
    "Handheld Ultrasound": "Échographe portable",
    "Key Features": "Caractéristiques principales",
    "Portable Color Ultrasound": "Échographe Doppler couleur portable",
    "Video Laryngoscope": "Vidéolaryngoscope",
    "X Ray System": "Système de radiographie",
    "Applied Departments": "Services concernés",
    "ICU": "Soins intensifs",
    "ENT": "ORL",
    "Patient Monitor": "Moniteur patient",
    "CHIGOX We provide reliable products, clinical application support, and integrated solutions for global partners.": "CHIGOX fournit des produits fiables, un accompagnement clinique et des solutions intégrées à ses partenaires internationaux.",
    "Address: Building 321X666, 3rd Floor, No. 9, Kemulang South Road, Tianhe District, Guangzhou": "Adresse : bâtiment 321X666, 3e étage, n° 9, Kemulang South Road, district de Tianhe, Guangzhou",
    "4 moveable with locks": "4 roues mobiles avec freins",
    "Adjustable display angle from 0 degrees to 30 degrees": "Angle d'affichage réglable de 0 à 30 degrés",
    "CGE-100 Full HD Medical Endoscopy Solution image 1": "Image 1 de la solution d'endoscopie médicale Full HD CGE-100",
    "CGU-LCP Wireless 3-in-1 Handheld Ultrasound Scanner image 1": "Image 1 de l'échographe portable sans fil 3-en-1 CGU-LCP",
    "CGV-300H Veterinary HD Portable Endoscopy System image 1": "Image 1 du système d'endoscopie vétérinaire portable HD CGV-300H",
    "Skin Graft Mesher": "Expanseur de greffe cutanée",
    "Skin Graft Mesher Main Unit": "Unité principale de l'expanseur de greffe cutanée",
    "CG-7C Skin Graft Mesher": "Expanseur de greffe cutanée CG-7C",
    "CG-7C Skin Graft Mesher | CHIGOX": "Expanseur de greffe cutanée CG-7C | CHIGOX",
    "CG-7C Skin Graft Mesher for professional medical and veterinary applications.": "Expanseur de greffe cutanée CG-7C destiné aux applications médicales et vétérinaires professionnelles.",
    "CG-7C Skin Graft Mesher from CHIGOX Medical Technology. CG-7C Skin Graft Mesher for professional medical and veterinary applications.": "Expanseur de greffe cutanée CG-7C de CHIGOX Medical Technology. Conçu pour les applications médicales et vétérinaires professionnelles.",
    "CG-7C Skin Graft Mesher image 1": "Image 1 de l'expanseur de greffe cutanée CG-7C",
    "CG-7C Skin Graft Mesher image 2": "Image 2 de l'expanseur de greffe cutanée CG-7C",
  },
  pt: {
    "Request Quote": terminology.pt.requestQuote,
    "Send Inquiry": terminology.pt.sendInquiry,
    "Endoscopy System": terminology.pt.endoscopySystem,
    "Rigid Endoscope": terminology.pt.rigidEndoscope,
    "Contact Us": "Fale conosco",
    "All Products": "Todos os produtos",
    "Technical Specifications": "Especificações técnicas",
    "Inquiry Form": "Formulário de consulta",
    "Applications": "Aplicações",
    "Basic Information": "Informações básicas",
    "Blog": "Blog",
    "Cart Ultrasound": "Ultrassom em carrinho",
    "Endoscope System": "Sistema de endoscopia",
    "Key Features": "Principais características",
    "Neurology Equipment": "Equipamentos de neurologia",
    "Portable Color Ultrasound": "Ultrassom Doppler colorido portátil",
    "X Ray System": "Sistema de raios X",
    "Applied Departments": "Especialidades atendidas",
    "ICU": "UTI",
    "ENT": "Otorrinolaringologia",
    "Medical Monitor": "Monitor médico",
    "Patient Monitor": "Monitor de pacientes",
    "CHIGOX We provide reliable products, clinical application support, and integrated solutions for global partners.": "A CHIGOX fornece produtos confiáveis, suporte para aplicações clínicas e soluções integradas a parceiros em todo o mundo.",
    "Address: Building 321X666, 3rd Floor, No. 9, Kemulang South Road, Tianhe District, Guangzhou": "Endereço: Edifício 321X666, 3º andar, nº 9, Kemulang South Road, distrito de Tianhe, Guangzhou",
    "4 moveable with locks": "4 rodas móveis com travas",
    "Adjustable display angle from 0 degrees to 30 degrees": "Ângulo de exibição ajustável de 0 a 30 graus",
    "CGE-100 Full HD Medical Endoscopy Solution image 1": "Imagem 1 da solução de endoscopia médica Full HD CGE-100",
    "CGU-LCP Wireless 3-in-1 Handheld Ultrasound Scanner image 1": "Imagem 1 do aparelho de ultrassom portátil sem fio 3 em 1 CGU-LCP",
    "CGV-300H Veterinary HD Portable Endoscopy System image 1": "Imagem 1 do sistema de endoscopia veterinária portátil HD CGV-300H",
    "Skin Graft Mesher": "Expansor de enxerto de pele",
    "Skin Graft Mesher Main Unit": "Unidade principal do expansor de enxerto de pele",
    "CG-7C Skin Graft Mesher": "Expansor de enxerto de pele CG-7C",
    "CG-7C Skin Graft Mesher | CHIGOX": "Expansor de enxerto de pele CG-7C | CHIGOX",
    "CG-7C Skin Graft Mesher for professional medical and veterinary applications.": "Expansor de enxerto de pele CG-7C para aplicações médicas e veterinárias profissionais.",
    "CG-7C Skin Graft Mesher from CHIGOX Medical Technology. CG-7C Skin Graft Mesher for professional medical and veterinary applications.": "Expansor de enxerto de pele CG-7C da CHIGOX Medical Technology. Desenvolvido para aplicações médicas e veterinárias profissionais.",
    "CG-7C Skin Graft Mesher image 1": "Imagem 1 do expansor de enxerto de pele CG-7C",
    "CG-7C Skin Graft Mesher image 2": "Imagem 2 do expansor de enxerto de pele CG-7C",
  },
});

function protectTechnicalContent(source) {
  const tokens = [
    ...extractProtectedTechnicalTokens(source),
    ...(source.match(/\b\S*\d\S*\b/g) ?? []),
    ...(source.match(/https?:\/\/[^\s]+|[^\s@]+@[^\s@]+/g) ?? []),
    ...(source.match(/\bCHIGOX\b/g) ?? []),
  ].filter(Boolean).sort((a, b) => b.length - a.length);
  const unique = [...new Set(tokens)];
  let protectedText = source;
  const placeholders = [];
  for (const token of unique) {
    if (!protectedText.includes(token)) continue;
    const placeholder = `ZXQTECH${String(placeholders.length).padStart(4, "0")}QXZ`;
    protectedText = protectedText.replaceAll(token, placeholder);
    placeholders.push({ placeholder, token });
  }
  return { protectedText, placeholders };
}

function restoreTechnicalContent(translated, placeholders) {
  let output = translated;
  for (const { placeholder, token } of placeholders) {
    const pattern = new RegExp(placeholder, "gi");
    output = output.replace(pattern, token);
  }
  return output.trim();
}

function createBatches(entries) {
  const batches = [];
  let current = [];
  let length = 0;
  for (const entry of entries) {
    const addition = entry.protectedText.length + 32;
    if (current.length && length + addition > MAX_BATCH_CHARACTERS) {
      batches.push(current);
      current = [];
      length = 0;
    }
    current.push(entry);
    length += addition;
  }
  if (current.length) batches.push(current);
  return batches;
}

async function translateBatch(batch, target) {
  const payload = batch.map((entry, index) => `⟦CHIGOX-${String(index).padStart(4, "0")}⟧\n${entry.protectedText}`).join("\n");
  const body = new URLSearchParams({ client: "gtx", sl: "en", tl: target, dt: "t", q: payload });
  const response = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" }, body });
  if (!response.ok) throw new Error(`Translation request failed (${response.status})`);
  const data = await response.json();
  const translated = data[0].map((part) => part[0]).join("");
  const matches = [...translated.matchAll(/⟦CHIGOX-(\d{4})⟧\s*\n?/g)];
  if (matches.length !== batch.length) throw new Error(`Translation batch marker mismatch: expected ${batch.length}, received ${matches.length}`);
  return matches.map((match, index) => translated.slice(match.index + match[0].length, matches[index + 1]?.index ?? translated.length).trim());
}

async function buildCatalog(root, languageKey) {
  const sources = collectCoreSourceStrings(root);
  const entries = sources.map((source) => ({ source, ...protectTechnicalContent(source) }));
  const batches = createBatches(entries);
  const catalog = {};
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    const translated = await translateBatch(batch, TARGETS[languageKey]);
    translated.forEach((value, index) => {
      const entry = batch[index];
      catalog[entry.source] = restoreTechnicalContent(value, entry.placeholders);
    });
    console.log(`${languageKey}: translated batch ${batchIndex + 1}/${batches.length}`);
  }
  const approvedTerminology = Object.fromEntries(Object.keys(terminology.en).map((key) => [terminology.en[key], terminology[languageKey][key]]));
  Object.assign(catalog, approvedTerminology, manualOverrides[languageKey]);
  for (const source of Object.keys(catalog)) {
    catalog[source] = languageKey === "fr"
      ? catalog[source].replace(/(\d+(?:\.\d+)?)-inch\b/g, "$1 pouces").replace(/\b3-in-1\b/g, "3-en-1")
      : catalog[source].replace(/(\d+(?:\.\d+)?)-inch\b/g, "$1 polegadas").replace(/\b3-in-1\b/g, "3 em 1");
  }
  return Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b, "en")));
}

const root = process.cwd();
const outputDirectory = path.join(root, "scripts", "i18n", "translations");
fs.mkdirSync(outputDirectory, { recursive: true });
for (const languageKey of Object.keys(TARGETS)) {
  const catalog = await buildCatalog(root, languageKey);
  fs.writeFileSync(path.join(outputDirectory, `core-${languageKey}.json`), `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`${languageKey}: wrote ${Object.keys(catalog).length} translations`);
}

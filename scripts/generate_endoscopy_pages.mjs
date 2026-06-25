import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const detailTemplate = read("products/endoscopy-system/endoscope-system/cge-100/index.html");
const categoryTemplate = read("products/endoscopy-system/endoscope-system/index.html");

const categories = [
  {
    slug: "bronchoscope",
    name: "Bronchoscope",
    description: "Flexible bronchoscopes for airway diagnosis, biopsy, foreign body removal and respiratory intervention.",
    products: ["cgb-600r", "disposable-flexible-bronchoscope"],
  },
  {
    slug: "cystoscope",
    name: "Cystoscope",
    description: "Disposable and reusable flexible cystoscopes for bladder and lower urinary tract procedures.",
    products: ["cgc-350r", "cgc-350d"],
  },
  {
    slug: "nasopharyngoscope",
    name: "Nasopharyngoscope",
    description: "Flexible nasopharyngoscopes for high-definition examination of the nasal cavity, pharynx and larynx.",
    products: ["cgn-350r", "cgn-350d"],
  },
  {
    slug: "rigid-endoscope",
    name: "Rigid endoscope",
    description: "Autoclavable rigid endoscopes for ENT, arthroscopy, urology, gynecology and laparoscopic surgery.",
    products: ["cgr-100"],
  },
  {
    slug: "ureteroscope",
    name: "Ureteroscope",
    description: "Disposable and reusable flexible ureteroscopes for urinary tract diagnosis and minimally invasive treatment.",
    products: ["cgu-750r", "cgu-650d"],
  },
];

const products = {
  "cgb-600r": {
    category: "bronchoscope",
    title: "CGB-600R Series Reusable Flexible Bronchoscope",
    productName: "Reusable Flexible Bronchoscope",
    model: "CGB-600R Series",
    type: "Medical Flexible Endoscope",
    variant: "Reusable",
    summary: "A high-definition reusable flexible bronchoscope for adult, pediatric and interventional airway procedures.",
    overview: [
      "The CGB-600 Series Flexible Bronchoscope is designed for diagnostic and therapeutic procedures of the trachea and bronchial system.",
      "Featuring high-definition digital imaging, excellent maneuverability and multiple diameter configurations, the system provides reliable visualization for adult, pediatric and interventional bronchoscopy.",
      "Available in various outer diameters and working channel sizes, the CGB-600 Series meets diverse clinical requirements in respiratory examination and minimally invasive procedures.",
    ],
    features: ["High-definition CMOS imaging", "Excellent image quality and color reproduction", "Multiple diameter configurations", "Lightweight ergonomic control handle", "Large tip deflection angle", "Integrated LED illumination", "Compatible with image processor systems", "Smooth insertion for patient comfort", "Sterilizable reusable design", "Suitable for diagnosis and interventional procedures"],
    headers: ["CHIGOX Model", "Outer Diameter", "Working Channel", "Working Length", "Field of View", "Depth of Field", "Tip Deflection"],
    rows: [
      ["CGB-600R28", "2.8 mm", "1.2 mm", "600 mm", "120°", "2–50 mm", "Up180° / Down180°"],
      ["CGB-600R38", "3.8 mm", "1.8 mm", "600 mm", "120°", "2–50 mm", "Up180° / Down180°"],
      ["CGB-600R48", "4.8 mm", "2.6 mm", "600 mm", "120°", "2–50 mm", "Up180° / Down180°"],
      ["CGB-600R52", "5.2 mm", "3.0 mm", "600 mm", "120°", "2–50 mm", "Up180° / Down180°"],
      ["CGB-600R58", "5.8 mm", "3.2 mm", "600 mm", "120°", "2–50 mm", "Up180° / Down180°"],
    ],
    applications: ["Bronchial examination", "Airway diagnosis", "Foreign body removal", "Bronchial biopsy", "Respiratory intervention", "ICU bronchoscopy", "Thoracic surgery", "Pulmonary medicine"],
    standard: ["Flexible Bronchoscope", "Waterproof Cap", "Leak Tester", "Cleaning Brush", "Biopsy Valve", "Carrying Case", "User Manual"],
    optional: ["Biopsy Forceps", "Foreign Body Forceps", "Cytology Brush", "Cleaning Kit", "Endoscopy Workstation", "Video Processor", "Medical Monitor", "Trolley"],
    images: ["cgb-600-reusable.png"],
  },
  "disposable-flexible-bronchoscope": {
    category: "bronchoscope",
    title: "Disposable Flexible Bronchoscope",
    productName: "Disposable Flexible Bronchoscope",
    model: "Contact CHIGOX for available models",
    type: "Medical Flexible Endoscope",
    variant: "Disposable",
    summary: "A sterile single-use flexible bronchoscope for airway examination and respiratory procedures.",
    overview: [
      "The Disposable Flexible Bronchoscope is designed for single-use airway examination and respiratory procedures.",
      "Its sterile disposable format helps reduce cross-contamination risk and eliminates routine endoscope reprocessing.",
      "Contact CHIGOX for current model availability and detailed technical configurations.",
    ],
    features: ["Sterile single-use design", "Flexible airway visualization", "Ergonomic handheld operation", "No endoscope reprocessing required", "Reduced cross-contamination risk", "Suitable for respiratory examination"],
    headers: ["Item", "Specification"],
    rows: [["Product Type", "Disposable Flexible Bronchoscope"], ["Available Models", "Contact CHIGOX"], ["Detailed Specifications", "Available on request"]],
    note: "A separate technical specification document was not supplied with the source materials. No reusable-model parameters have been copied to this disposable product.",
    applications: ["Airway examination", "Respiratory diagnosis", "ICU bronchoscopy", "Emergency airway procedures", "Foreign body inspection"],
    standard: ["Disposable Flexible Bronchoscope", "Sterile Packaging", "User Manual"],
    optional: ["Endoscopy Video Processor", "Medical Monitor", "Endoscopy Workstation", "Medical Trolley"],
    images: ["cgb-600-disposable.png"],
  },
  "cgu-650d": {
    category: "ureteroscope",
    title: "CGU-650D Series Disposable Flexible Ureteroscope",
    productName: "Disposable Flexible Ureteroscope",
    model: "CGU-650D Series",
    type: "Medical Flexible Endoscope",
    variant: "Disposable",
    summary: "A sterile single-use flexible ureteroscope for minimally invasive urinary tract diagnosis and treatment.",
    overview: [
      "The CGU-650D Series Disposable Flexible Ureteroscope is designed for minimally invasive diagnosis and treatment of urinary tract diseases.",
      "With high-definition digital imaging, excellent flexibility and a lightweight disposable design, the system helps reduce the risk of cross infection while improving clinical efficiency.",
      "Multiple outer diameter configurations are available to meet different procedural requirements, making the CGU-650D Series suitable for hospitals, urology departments and ambulatory surgery centers.",
    ],
    features: ["Single-use sterile design", "High-definition CMOS imaging", "Excellent flexibility and maneuverability", "275°–300° bidirectional tip deflection", "Multiple diameter configurations", "Lightweight ergonomic handle", "Excellent irrigation performance", "Compatible with standard endoscopy video processors", "Smooth insertion and easy operation", "Reduced maintenance and reprocessing costs"],
    headers: ["CHIGOX Model", "Outer Diameter", "Working Channel", "Working Length", "Field of View", "Depth of Field", "Tip Deflection", "Image Resolution"],
    rows: [
      ["CGU-650D20", "2.0 mm", "0.8 mm", "650 mm", "90°", "2–50 mm", "Up300° / Down300°", "400 × 400"],
      ["CGU-650D22", "2.2 mm", "1.2 mm", "650 mm", "90°", "2–50 mm", "Up300° / Down300°", "400 × 400"],
      ["CGU-650D25", "2.5 mm", "1.2 mm", "650 mm", "90°", "2–50 mm", "Up275° / Down275°", "400 × 400"],
      ["CGU-650D28", "2.8 mm", "1.2 mm", "650 mm", "90°", "2–50 mm", "Up275° / Down275°", "400 × 400"],
    ],
    applications: ["Ureteral stone diagnosis", "Kidney stone examination", "Laser lithotripsy", "Ureteral biopsy", "Urinary tract inspection", "Upper urinary tract intervention", "Minimally invasive urological surgery"],
    standard: ["Disposable Flexible Ureteroscope", "Sterile Packaging", "User Manual"],
    optional: ["Endoscopy Video Processor", "Medical Monitor", "Endoscopy Workstation", "Medical Trolley", "Stone Retrieval Basket", "Biopsy Forceps", "Irrigation Pump", "Light Source (if required by system)"],
    images: ["cgu-650d.png"],
  },
  "cgu-750r": {
    category: "ureteroscope",
    title: "CGU-750R Series Reusable Flexible Ureteroscope",
    productName: "Reusable Flexible Ureteroscope",
    model: "CGU-750R Series",
    type: "Medical Flexible Endoscope",
    variant: "Reusable",
    summary: "A durable reusable flexible ureteroscope for routine and advanced upper urinary tract procedures.",
    overview: [
      "The CGU-750R Series Reusable Flexible Ureteroscope is designed for routine and advanced urological procedures, providing high-definition imaging, excellent maneuverability and long-term durability.",
      "Featuring a reusable construction, superior bidirectional deflection and ergonomic operation, the system offers reliable performance for diagnosis and treatment of upper urinary tract diseases while reducing long-term operating costs.",
      "Compatible with HD endoscopy systems, the CGU-750R Series is suitable for hospitals, urology departments and minimally invasive surgery centers.",
    ],
    features: ["High-definition CMOS imaging", "Reusable medical-grade insertion tube", "Excellent durability for repeated sterilization", "Large bidirectional tip deflection", "Superior irrigation performance", "Lightweight ergonomic control handle", "Smooth insertion and precise navigation", "Compatible with HD endoscopy processors", "Excellent image clarity", "Designed for routine clinical use"],
    headers: ["CHIGOX Model", "Outer Diameter", "Working Channel", "Working Length", "Field of View", "Depth of Field", "Tip Deflection", "Image Resolution"],
    rows: [["CGU-750R", "Refer to product specifications", "Refer to product specifications", "750 mm", "90°", "2–50 mm", "Up275° / Down275°", "HD Digital Imaging"]],
    note: "Additional reusable configurations can be added to the CGU-750R Series as new models become available.",
    applications: ["Flexible ureteroscopy", "Kidney stone diagnosis", "Laser lithotripsy", "Ureteral biopsy", "Upper urinary tract examination", "Endoscopic treatment of urinary diseases", "Minimally invasive urological surgery"],
    standard: ["Reusable Flexible Ureteroscope", "Waterproof Cap", "Leak Tester", "Cleaning Brush", "Sterilization Cap", "User Manual"],
    optional: ["HD Endoscopy Processor", "Medical Monitor", "Endoscopy Workstation", "Medical Trolley", "Stone Retrieval Basket", "Biopsy Forceps", "Irrigation Pump", "Sterilization Tray"],
    images: ["cgu-750r.png"],
  },
  "cgc-350d": {
    category: "cystoscope",
    title: "CGC-350D Series Disposable Flexible Cystoscope",
    productName: "Disposable Flexible Cystoscope",
    model: "CGC-350D Series",
    type: "Medical Flexible Endoscope",
    variant: "Disposable",
    summary: "A sterile single-use flexible cystoscope for lower urinary tract diagnosis and treatment.",
    overview: [
      "The CGC-350D Series Disposable Flexible Cystoscope is designed for minimally invasive diagnosis and treatment of the lower urinary tract.",
      "Featuring high-definition digital imaging, excellent flexibility and a sterile single-use design, the system minimizes the risk of cross infection while providing outstanding visualization and clinical efficiency.",
      "Available in multiple outer diameter configurations, the CGC-350D Series is suitable for hospitals, urology departments, outpatient clinics and ambulatory surgery centers.",
    ],
    features: ["Sterile single-use design", "High-definition CMOS digital imaging", "Excellent flexibility and maneuverability", "Multiple diameter configurations", "Large bidirectional tip deflection", "Ergonomic lightweight handle", "Smooth insertion for improved patient comfort", "Compatible with HD endoscopy systems", "No maintenance or reprocessing required", "Reduced risk of cross contamination"],
    headers: ["CHIGOX Model", "Outer Diameter", "Working Channel", "Working Length", "Field of View", "Depth of Field", "Tip Deflection", "Image Resolution"],
    rows: [
      ["CGC-350D48", "4.8 mm", "2.2 mm", "380 mm", "120°", "3–100 mm", "Up210° / Down120°", "HD Digital Imaging"],
      ["CGC-350D52", "5.2 mm", "2.6 mm", "380 mm", "120°", "3–100 mm", "Up210° / Down120°", "HD Digital Imaging"],
      ["CGC-350D58", "5.8 mm", "3.0 mm", "380 mm", "120°", "3–100 mm", "Up210° / Down120°", "HD Digital Imaging"],
    ],
    applications: ["Bladder examination", "Urethral examination", "Hematuria diagnosis", "Bladder biopsy", "Foreign body inspection", "Urological diagnosis", "Minimally invasive cystoscopy procedures"],
    standard: ["Disposable Flexible Cystoscope", "Sterile Packaging", "User Manual"],
    optional: ["HD Endoscopy Processor", "Medical Monitor", "Endoscopy Workstation", "Medical Trolley", "Biopsy Forceps", "Irrigation Pump", "Recording System"],
    images: ["cgc-350d.png"],
  },
  "cgc-350r": {
    category: "cystoscope",
    title: "CGC-350R Series Reusable Flexible Cystoscope",
    productName: "Reusable Flexible Cystoscope",
    model: "CGC-350R Series",
    type: "Medical Flexible Endoscope",
    variant: "Reusable",
    summary: "A reusable HD flexible cystoscope for diagnostic and therapeutic procedures of the bladder and lower urinary tract.",
    overview: [
      "The CGC-350R Series Reusable Flexible Cystoscope is designed for high-performance diagnostic and therapeutic procedures of the bladder and lower urinary tract.",
      "With HD digital imaging, excellent flexibility and a durable reusable construction, the system provides outstanding image quality, precise navigation and long service life for routine clinical practice.",
      "Compatible with HD endoscopy processors, the CGC-350R Series is an ideal solution for hospitals, urology departments and minimally invasive surgery centers.",
    ],
    features: ["High-definition CMOS digital imaging", "Reusable medical-grade insertion tube", "Superior image quality and color reproduction", "Large bidirectional tip deflection", "Excellent irrigation performance", "Ergonomic lightweight control handle", "Smooth insertion and precise maneuverability", "Compatible with HD endoscopy systems", "Designed for repeated sterilization", "Reliable long-term clinical performance"],
    headers: ["CHIGOX Model", "Outer Diameter", "Working Channel", "Working Length", "Field of View", "Depth of Field", "Tip Deflection", "Image Resolution"],
    rows: [
      ["CGC-350R48", "4.8 mm", "2.2 mm", "380 mm", "120°", "3–100 mm", "Up210° / Down120°", "HD Digital Imaging"],
      ["CGC-350R52", "5.2 mm", "2.6 mm", "380 mm", "120°", "3–100 mm", "Up210° / Down120°", "HD Digital Imaging"],
      ["CGC-350R58", "5.8 mm", "3.0 mm", "380 mm", "120°", "3–100 mm", "Up210° / Down120°", "HD Digital Imaging"],
    ],
    applications: ["Diagnostic cystoscopy", "Bladder disease examination", "Urethral examination", "Bladder biopsy", "Foreign body inspection", "Follow-up evaluation after urological surgery", "Routine urological procedures"],
    standard: ["Reusable Flexible Cystoscope", "Waterproof Cap", "Leak Tester", "Cleaning Brush", "Sterilization Cap", "User Manual"],
    optional: ["HD Endoscopy Processor", "Medical Monitor", "Endoscopy Workstation", "Medical Trolley", "Biopsy Forceps", "Irrigation Pump", "Image Recording System", "Sterilization Tray"],
    images: ["cgc-350r.png"],
  },
  "cgn-350d": {
    category: "nasopharyngoscope",
    title: "CGN-350D Series Disposable Flexible Nasopharyngoscope",
    productName: "Disposable Flexible Nasopharyngoscope",
    model: "CGN-350D Series",
    type: "Medical Flexible Endoscope",
    variant: "Disposable",
    summary: "A sterile single-use HD nasopharyngoscope for examination of the nasal cavity, pharynx and larynx.",
    overview: [
      "The CGN-350D Series Disposable Flexible Nasopharyngoscope is designed for high-definition examination of the nasal cavity, pharynx and larynx.",
      "Featuring a sterile single-use design, lightweight ergonomic construction and excellent image quality, the system minimizes the risk of cross infection while providing outstanding visualization for ENT diagnosis and outpatient procedures.",
      "Available in multiple diameter configurations, the CGN-350D Series is ideal for hospitals, ENT clinics, emergency departments and outpatient examination centers.",
    ],
    features: ["Sterile single-use design", "High-definition CMOS digital imaging", "Lightweight ergonomic handle", "Excellent flexibility and maneuverability", "Large bidirectional tip deflection", "Multiple diameter configurations", "Smooth insertion for improved patient comfort", "Compatible with HD endoscopy systems", "No maintenance or reprocessing required", "Reduced risk of cross contamination"],
    headers: ["CHIGOX Model", "Outer Diameter", "Working Channel", "Working Length", "Field of View", "Depth of Field", "Tip Deflection", "Image Resolution"],
    rows: [
      ["CGN-350D20", "2.0 mm", "1.2 mm", "350 mm", "120°", "2–50 mm", "Up180° / Down180°", "HD Digital Imaging"],
      ["CGN-350D28", "2.8 mm", "1.2 mm", "350 mm", "120°", "2–50 mm", "Up180° / Down180°", "HD Digital Imaging"],
      ["CGN-350D38", "3.8 mm", "1.5 mm", "350 mm", "120°", "2–50 mm", "Up180° / Down180°", "HD Digital Imaging"],
      ["CGN-350D42", "4.2 mm", "2.0 mm", "350 mm", "120°", "2–50 mm", "Up180° / Down180°", "HD Digital Imaging"],
      ["CGN-350D48", "4.8 mm", "2.2 mm", "350 mm", "120°", "2–50 mm", "Up180° / Down180°", "HD Digital Imaging"],
    ],
    applications: ["Nasal cavity examination", "Nasopharyngeal examination", "Laryngeal examination", "Vocal cord assessment", "ENT outpatient diagnosis", "Foreign body inspection", "Biopsy assistance", "Routine ENT examination"],
    standard: ["Disposable Flexible Nasopharyngoscope", "Sterile Packaging", "User Manual"],
    optional: ["HD Endoscopy Processor", "Medical Monitor", "Endoscopy Workstation", "Medical Trolley", "Biopsy Forceps", "Image Recording System", "Irrigation Accessories"],
    images: ["cgn-350d.png"],
  },
  "cgn-350r": {
    category: "nasopharyngoscope",
    title: "CGN-350R Series Reusable Flexible Nasopharyngoscope",
    productName: "Reusable Flexible Nasopharyngoscope",
    model: "CGN-350R Series",
    type: "Medical Flexible Endoscope",
    variant: "Reusable",
    summary: "A reusable HD flexible nasopharyngoscope for routine ENT examination and minimally invasive procedures.",
    overview: [
      "The CGN-350R Series Reusable Flexible Nasopharyngoscope is designed for high-definition examination and diagnosis of the nasal cavity, pharynx and larynx.",
      "With HD digital imaging, excellent flexibility and a durable reusable design, the system delivers outstanding visualization and precise maneuverability for routine ENT examinations and minimally invasive procedures.",
      "Compatible with HD endoscopy processors, the CGN-350R Series is an ideal solution for hospitals, ENT departments and outpatient clinics requiring reliable long-term performance.",
    ],
    features: ["High-definition CMOS digital imaging", "Reusable medical-grade insertion tube", "Excellent flexibility and maneuverability", "Large bidirectional tip deflection", "Lightweight ergonomic control handle", "Superior image clarity and color reproduction", "Designed for repeated sterilization", "Smooth insertion for improved patient comfort", "Compatible with HD endoscopy systems", "Reliable long-term clinical performance"],
    headers: ["CHIGOX Model", "Outer Diameter", "Working Channel", "Working Length", "Field of View", "Depth of Field", "Tip Deflection", "Image Resolution"],
    rows: [
      ["CGN-350R28", "2.8 mm", "1.2 mm", "350 mm", "120°", "2–50 mm", "Up180° / Down180°", "HD Digital Imaging"],
      ["CGN-350R38", "3.8 mm", "1.5 mm", "350 mm", "120°", "2–50 mm", "Up180° / Down180°", "HD Digital Imaging"],
      ["CGN-350R48", "4.8 mm", "2.2 mm", "350 mm", "120°", "2–50 mm", "Up180° / Down180°", "HD Digital Imaging"],
    ],
    applications: ["Nasal cavity examination", "Nasopharyngeal diagnosis", "Laryngeal examination", "Vocal cord assessment", "ENT outpatient procedures", "Foreign body inspection", "Biopsy assistance", "Routine ENT examination"],
    standard: ["Reusable Flexible Nasopharyngoscope", "Waterproof Cap", "Leak Tester", "Cleaning Brush", "Sterilization Cap", "User Manual"],
    optional: ["HD Endoscopy Processor", "Medical Monitor", "Endoscopy Workstation", "Medical Trolley", "Biopsy Forceps", "Image Recording System", "Irrigation Accessories", "Sterilization Tray"],
    images: ["cgn-350r.png"],
  },
  "cgr-100": {
    category: "rigid-endoscope",
    title: "CGR-100 Series Rigid Endoscope",
    productName: "Rigid Endoscope",
    model: "CGR-100 Series",
    type: "Medical Rigid Endoscope",
    summary: "Autoclavable HD rigid endoscopes for minimally invasive diagnosis and surgery across multiple specialties.",
    overview: [
      "The CGR-100 Series Rigid Endoscope is designed for minimally invasive diagnosis and surgical procedures across multiple clinical specialties.",
      "The series includes laparoscopes, arthroscopes, cystoscopes, hysteroscopes, sinuscopes, ENT endoscopes and other rigid endoscopes, providing high-definition optical performance, excellent illumination and outstanding durability.",
      "Manufactured with premium optical glass and stainless steel construction, the CGR-100 Series delivers sharp image quality and reliable performance for hospitals, surgical centers and specialist clinics.",
    ],
    features: ["High-definition optical imaging", "Sapphire distal window", "Medical-grade stainless steel construction", "Fully autoclavable", "Excellent color reproduction", "High light transmission", "Compatible with standard camera systems", "Multiple viewing angles available", "Multiple diameter configurations", "Designed for minimally invasive surgery"],
    headers: ["CHIGOX Model", "Application", "Outer Diameter", "Working Length", "View Direction", "Field of View", "Autoclavable"],
    rows: [
      ["CGR-1800", "ENT Endoscope", "1.8 mm", "100 / 175 mm", "0°", "70°", "Yes"],
      ["CGR-2700", "Arthroscope", "2.7 mm", "175 mm", "0° / 30°", "70°", "Yes"],
      ["CGR-4000", "Arthroscope", "4.0 mm", "175 mm", "30° / 70°", "70°", "Yes"],
      ["CGR-2703", "Cystoscope", "2.7 mm", "300 mm", "30°", "70°", "Yes"],
      ["CGR-4003", "Hysteroscope", "4.0 mm", "300 mm", "30°", "70°", "Yes"],
      ["CGR-4007", "Sinuscope", "4.0 mm", "175 mm", "70°", "70°", "Yes"],
      ["CGR-1000", "Laparoscope", "10 mm", "320 mm", "0°", "80°", "Yes"],
      ["CGR-1030", "Laparoscope", "10 mm", "320 mm", "30°", "80°", "Yes"],
    ],
    note: "Additional rigid endoscope models can be continuously added to this table as the product portfolio expands.",
    applications: ["General Surgery", "Laparoscopic Surgery", "Arthroscopy", "ENT Surgery", "Sinus Surgery", "Urology", "Gynecology", "Minimally Invasive Surgery"],
    standard: ["Rigid Endoscope", "Protective Cap", "User Manual"],
    optional: ["HD Camera Head", "LED Cold Light Source", "Fiber Optic Light Cable", "Medical Monitor", "Video Processor", "Endoscopy Workstation", "Medical Trolley", "Sterilization Tray", "Endoscopic Instruments"],
    images: ["cgr-100-1.jpg", "cgr-100-2.jpg", "cgr-100-3.jpg"],
  },
};

const list = (items) => `<ul class="check-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
const table = (p) => `<div class="endoscopy-spec-wrap"><table class="spec-table"><thead><tr>${p.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${p.rows.map((row) => `<tr>${row.map((cell, i) => i === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${p.note ? `<p class="endoscopy-category-note">${p.note}</p>` : ""}`;

const addStylesheet = (html) => html.replace(
  '<link rel="stylesheet" href="../../../../assets/css/footer.css">',
  '<link rel="stylesheet" href="../../../../assets/css/footer.css">\n  <link rel="stylesheet" href="../../../../assets/css/endoscopy-products.css">',
);

function productMain(slug, p) {
  const imageBase = "../../../../assets/products/endoscopy/";
  const heroClass = p.images.length ? "product-hero" : "product-hero no-product-image";
  const heroImage = p.images.length ? `<div class="hero-product-image"><img src="${imageBase}${p.images[0]}" alt="${p.title}" loading="eager" decoding="async"></div>` : "";
  const gallery = p.images.length
    ? `<section class="product-images"><div class="section-heading"><span>Images</span><h2>Product Images</h2></div><div class="product-image-gallery">${p.images.map((img, i) => `<figure><img src="${imageBase}${img}" alt="${p.title} image ${i + 1}" loading="lazy" decoding="async"></figure>`).join("")}</div></section>`
    : `<section><div class="pending-image-note">Product imagery has not yet been supplied for this model. The verified technical information is shown below.</div></section>`;
  return `<main>
  <section class="${heroClass}">
    <div><p class="eyebrow">${p.type}</p><h1>${p.title}</h1><p>${p.summary}</p><div class="badges"><span>Human Use</span></div><a class="btn primary" href="#inquiry">Request Quote</a></div>
    ${heroImage}
  </section>
  ${gallery}
  <section class="product-detail-grid">
    <div><div class="section-heading"><span>Overview</span><h2>Product Overview</h2>${p.overview.map((x) => `<p>${x}</p>`).join("")}</div><h2>Key Features</h2>${list(p.features)}<h2>Applications</h2>${list(p.applications)}</div>
    <aside><h2>Basic Information</h2><table class="spec-table"><tbody><tr><th>Product Name</th><td>${p.productName}</td></tr><tr><th>Model</th><td>${p.model}</td></tr><tr><th>Product Category</th><td>${p.type}</td></tr></tbody></table></aside>
  </section>
  <section class="band"><div class="section-heading"><span>Specifications</span><h2>Technical Specifications</h2></div>${table(p)}</section>
  <section class="two-columns"><div><h2>Standard Configuration</h2>${list(p.standard)}</div><div><h2>Optional Accessories</h2>${list(p.optional)}</div></section>
  <section id="inquiry" class="inquiry-section"><div><div class="section-heading"><span>Request Quote</span><h2>Inquiry Form</h2><p>Share your market, application, and target configuration. The CHIGOX team will follow up by email.</p></div></div><form class="inquiry-form" action="mailto:info@chigox.com" method="post" enctype="text/plain">
    <label>Name<input name="Name" required></label><label>Email<input name="Email" type="email" required></label><label>Company<input name="Company"></label><label>Product<input name="Product" value="${p.title}"></label><label class="full">Message<textarea name="Message" rows="5" placeholder="Tell us your application, quantity, and target market."></textarea></label><button class="btn primary" type="submit">Send Inquiry</button>
  </form></section>
</main>`;
}

function makeProductPage(slug, p) {
  const url = `https://www.chigox.com/products/endoscopy-system/${p.category}/${slug}/`;
  let html = addStylesheet(detailTemplate)
    .replace(/<title>.*?<\/title>/, `<title>${p.title} | CHIGOX</title>`)
    .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${p.summary}">`)
    .replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${p.title} | CHIGOX">`)
    .replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${p.summary}">`)
    .replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${url}">`)
    .replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${p.images.length ? `https://www.chigox.com/assets/products/endoscopy/${p.images[0]}` : "https://www.chigox.com/assets/og/chigox-og.svg"}">`)
    .replace(/<main>[\s\S]*?<\/main>/, productMain(slug, p));
  write(`products/endoscopy-system/${p.category}/${slug}/index.html`, html);
}

function categoryMain(category) {
  const cards = category.products.map((slug) => {
    const p = products[slug];
    const image = p.images.length
      ? `<a class="product-image" href="${slug}/"><img src="../../../assets/products/endoscopy/${p.images[0]}" alt="${p.title}" loading="lazy" decoding="async"></a>`
      : "";
    return `<article class="product-card">${image}<div class="product-card-body"><div class="badges"><span>Human Use</span>${p.variant ? `<span>${p.variant}</span>` : ""}</div><p class="eyebrow">${p.type}</p><h3><a href="${slug}/">${p.title}</a></h3><p>${p.summary}</p><a class="text-link" href="${slug}/">View product</a></div></article>`;
  }).join("");
  return `<main><section class="page-hero"><p class="eyebrow">Endoscopy System</p><h1>${category.name}</h1><p>${category.description}</p></section><section class="band"><div class="section-heading"><span>Products</span><h2>${category.name}</h2></div><div class="product-grid">${cards}</div></section></main>`;
}

function makeCategoryPage(category) {
  const url = `https://www.chigox.com/products/endoscopy-system/${category.slug}/`;
  let html = categoryTemplate
    .replace(/<title>.*?<\/title>/, `<title>${category.name} | CHIGOX Products</title>`)
    .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${category.description}">`)
    .replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${category.name} | CHIGOX Products">`)
    .replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${category.description}">`)
    .replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${url}">`)
    .replace(/<main>[\s\S]*?<\/main>/, categoryMain(category));
  write(`products/endoscopy-system/${category.slug}/index.html`, html);
}

for (const category of categories) makeCategoryPage(category);
for (const [slug, product] of Object.entries(products)) makeProductPage(slug, product);

const topCategoryFile = "products/endoscopy-system/index.html";
let topCategory = read(topCategoryFile);
const categoryOrder = [
  { slug: "endoscope-system", name: "Endoscope System", count: 1 },
  { slug: "bronchoscope", name: "Bronchoscope" },
  { slug: "cystoscope", name: "Cystoscope" },
  { slug: "nasopharyngoscope", name: "Nasopharyngoscope" },
  { slug: "ureteroscope", name: "Ureteroscope" },
  { slug: "rigid-endoscope", name: "Rigid endoscope" },
];
const categoryCards = categoryOrder.map((item) => {
  const category = categories.find((entry) => entry.slug === item.slug);
  const count = item.count ?? category.products.length;
  return `<a class="category-tile" href="../../products/endoscopy-system/${item.slug}/"><span>${item.name}</span><p>${count} ${count === 1 ? "product" : "products"}</p></a>`;
}).join("");
topCategory = topCategory.replace(
  /<section><div class="section-heading"><span>Subcategories<\/span><h2>Endoscopy System Subcategories<\/h2><\/div><div class="category-grid">[\s\S]*?<\/div><\/section>/,
  `<section><div class="section-heading"><span>Subcategories</span><h2>Endoscopy System Subcategories</h2></div><div class="category-grid">${categoryCards}</div></section>`,
);
write(topCategoryFile, topCategory);

const localizedRoots = new Set(["es", "tr", "de", "it", "pl", "ko"]);
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (entry.name === ".git" || entry.name === "product-records") return [];
  const rel = path.relative(root, path.join(dir, entry.name));
  if (localizedRoots.has(rel.split(path.sep)[0])) return [];
  return entry.isDirectory() ? walk(path.join(dir, entry.name)) : entry.name.endsWith(".html") ? [path.join(dir, entry.name)] : [];
});

const pages = walk(root);
for (const file of pages) {
  let html = fs.readFileSync(file, "utf8");
  const addedLabels = ["Bronchoscope", "Ureteroscope", "Cystoscope", "Nasopharyngoscope", "Rigid Endoscope", "Rigid endoscope"];
  for (const label of addedLabels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`<div class="product-menu-subgroup"><span>${escaped}<\\/span><ul>[\\s\\S]*?<\\/ul><\\/div>`, "g"), "");
  }
  html = html.replace(
    /(<div class="product-menu-subgroup">\s*<span>Endoscope System<\/span>\s*<ul><li><a href="([^"]*?)products\/endoscopy-system\/endoscope-system\/cge-100\/">CGE-100 Full HD Medical Endoscopy Solution<\/a><\/li><\/ul>\s*<\/div>)/,
    (_, original, prefix) => `${original}<div class="product-menu-subgroup"><span>Bronchoscope</span><ul><li><a href="${prefix}products/endoscopy-system/bronchoscope/cgb-600r/">Reusable Bronchoscope</a></li><li><a href="${prefix}products/endoscopy-system/bronchoscope/disposable-flexible-bronchoscope/">Disposable Bronchoscope</a></li></ul></div><div class="product-menu-subgroup"><span>Cystoscope</span><ul><li><a href="${prefix}products/endoscopy-system/cystoscope/cgc-350r/">Reusable Cystoscope</a></li><li><a href="${prefix}products/endoscopy-system/cystoscope/cgc-350d/">Disposable Cystoscope</a></li></ul></div><div class="product-menu-subgroup"><span>Nasopharyngoscope</span><ul><li><a href="${prefix}products/endoscopy-system/nasopharyngoscope/cgn-350r/">Reusable Nasopharyngoscope</a></li><li><a href="${prefix}products/endoscopy-system/nasopharyngoscope/cgn-350d/">Disposable Nasopharyngoscope</a></li></ul></div><div class="product-menu-subgroup"><span>Ureteroscope</span><ul><li><a href="${prefix}products/endoscopy-system/ureteroscope/cgu-750r/">Reusable Ureteroscope</a></li><li><a href="${prefix}products/endoscopy-system/ureteroscope/cgu-650d/">Disposable Ureteroscope</a></li></ul></div><div class="product-menu-subgroup"><span>Rigid endoscope</span><ul><li><a href="${prefix}products/endoscopy-system/rigid-endoscope/cgr-100/">Rigid Endoscope Series</a></li></ul></div>`,
  );
  fs.writeFileSync(file, html);
}

console.log(`Generated ${categories.length} category pages and ${Object.keys(products).length} product pages.`);

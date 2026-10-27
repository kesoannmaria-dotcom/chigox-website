# CHIGOX multilingual infrastructure

This directory is the single source of truth for the nine-language rollout. Phase 1B-1 publishes the 67 non-article core pages in French and Brazilian Portuguese while keeping both language-selector entries hidden.

## Scope

- `page-map.mjs`: the 76 canonical English page families confirmed after the Phase 1A route audit, language lifecycle state and safe fallback rules.
- `generate-language-metadata.mjs`: static language-selector, exact-only hreflang and sitemap generation.
- `core-localization.mjs`: deterministic extraction and generation for the 67 FR/PT core pages.
- `fetch-core-translations.mjs`: development-only translation-catalog builder; it is never shipped to the browser or used at runtime.
- `generate-core-locales.mjs`: generates `/fr/` and `/pt/` from reviewed catalogs while preserving the English canonical structure.
- `translations/core-fr.json` and `translations/core-pt.json`: auditable exact-string translation catalogs.
- `translation-rules.mjs`: approved terminology and protection for models, specifications, units and certifications.
- `validate-i18n.mjs`: repository, mapping, canonical, reciprocal hreflang, sitemap and rollout-boundary checks.
- `i18n.test.mjs`: unit tests for mappings, fallbacks, metadata generation and technical-content protection.

## Safety rules

1. The generator is dry-run by default. Write mode is blocked before any file changes while unmapped sitemap routes or language-selector template gaps remain.
2. A language switch may use a category/home fallback, but hreflang is emitted only for an exact translated page.
3. `fr` and `pt-BR` remain hidden in the language selector until the later 76/76 acceptance gate. Their 67 reviewed core pages are valid canonical documents and are included in hreflang and sitemap.
4. Existing sitemap URLs outside the page map are preserved. They must be resolved explicitly instead of being silently removed.
5. Translation must pass the protected technical-token check before a page can be marked published.
6. Product models, specifications, certifications and claims must come from the English source. Translation may not invent or normalize them.

## Commands

```sh
node --test scripts/i18n/i18n.test.mjs
node scripts/i18n/validate-i18n.mjs
node scripts/i18n/generate-core-locales.mjs
node scripts/i18n/generate-language-metadata.mjs
```

The generation commands are dry-run by default. Write mode is intentionally explicit:

```sh
node scripts/i18n/generate-core-locales.mjs --write
node scripts/i18n/generate-language-metadata.mjs --write
```

Always inspect `git diff` immediately after write mode. FR/PT language-selector entries must remain hidden until their 76/76 acceptance gate is complete.

## Phase 1 publication workflow

1. Translate from an English canonical page and verify all protected technical tokens.
2. Update the reviewed translation catalogs and generate the target files.
3. Run unit tests and repository validation.
4. Run the metadata generator in dry-run mode and review fallback, hreflang and sitemap output.
5. Use write mode only on an isolated branch, then run HTTP, mobile, desktop and inquiry regression checks.

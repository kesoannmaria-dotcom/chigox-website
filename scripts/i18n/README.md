# CHIGOX multilingual infrastructure

This directory is the single source of truth for the nine-language rollout. It does not create French or Portuguese pages by itself.

## Scope

- `page-map.mjs`: the 76 canonical English page families confirmed after the Phase 1A route audit, language lifecycle state and safe fallback rules.
- `generate-language-metadata.mjs`: static language-selector, exact-only hreflang and sitemap generation.
- `translation-rules.mjs`: approved terminology and protection for models, specifications, units and certifications.
- `validate-i18n.mjs`: repository, mapping, canonical, reciprocal hreflang, sitemap and rollout-boundary checks.
- `i18n.test.mjs`: unit tests for mappings, fallbacks, metadata generation and technical-content protection.

## Safety rules

1. The generator is dry-run by default. Write mode is blocked before any file changes while unmapped sitemap routes or language-selector template gaps remain.
2. A language switch may use a category/home fallback, but hreflang is emitted only for an exact translated page.
3. `fr` and `pt-BR` remain disabled until all 76 pages for that language pass review. Disabled languages are excluded from hreflang and sitemap.
4. Existing sitemap URLs outside the page map are preserved. They must be resolved explicitly instead of being silently removed.
5. Translation must pass the protected technical-token check before a page can be marked published.
6. Product models, specifications, certifications and claims must come from the English source. Translation may not invent or normalize them.

## Commands

```sh
node --test scripts/i18n/i18n.test.mjs
node scripts/i18n/validate-i18n.mjs
node scripts/i18n/generate-language-metadata.mjs
```

The final command reports the pending changes without writing files. Write mode is intentionally explicit and remains unavailable until all reported blockers are resolved:

```sh
node scripts/i18n/generate-language-metadata.mjs --write
```

Always inspect `git diff` immediately after write mode. Do not publish FR/PT or add them to sitemap/hreflang until their 74/74 acceptance gate is complete.

## Phase 1 publication workflow

1. Translate from an English canonical page and verify all protected technical tokens.
2. Create the target file, then update its publication state in `page-map.mjs`.
3. Run unit tests and repository validation.
4. Run the metadata generator in dry-run mode and review fallback, hreflang and sitemap output.
5. Use write mode only on an isolated branch, then run HTTP, mobile, desktop and inquiry regression checks.

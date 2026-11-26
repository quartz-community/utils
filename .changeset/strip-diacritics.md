---
"@quartz-community/utils": minor
---

Add `setSlugOptions({ stripDiacritics })` (with `getSlugOptions` and `stripDiacritics`): when set, `slugifyPath`, `slugifyFilePath`, `slugTag` and link resolution strip accents and other diacritics from slugs (`české/čeština` → `ceske/cestina`). The setting lives on `globalThis`, so every copy of the package in a thread agrees; Quartz sets it from `configuration.slugs.stripDiacritics`. Off by default, so slugs are unchanged.

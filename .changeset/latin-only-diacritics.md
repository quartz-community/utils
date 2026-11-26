---
"@quartz-community/utils": patch
---

`stripDiacritics` (the `stripDiacritics` slug option) aims at slugs that need no percent-encoding, so it now works on Latin letters only, and fully: marks are removed only from Latin letters (marks outside U+0300–U+036F included), and Latin letters without a decomposition are written in ASCII (`Łódź` → `lodz`, `Straße` → `strasse`, `Æble` → `aeble`, `İstanbul ılık` → `istanbul-ilik`). Other scripts are left as written: their slugs are percent-encoded either way, and their marks can be part of the letter. Before, Russian `й`/`ё` became `и`/`е` and Greek lost its accents, while `ł`, `ø` and `ß` were kept.

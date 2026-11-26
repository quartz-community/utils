---
"@quartz-community/utils": patch
---

fix(path): `normalizeHastElement` kept links of embedded folder notes one directory too high. The embedded page's directory is now taken from its raw slug, so a slug ending in `index` no longer loses a real path segment (visible under a base path, e.g. canvas file nodes embedding `folder/index.md`).

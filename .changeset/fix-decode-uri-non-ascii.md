---
"@quartz-community/utils": patch
---

Fix `getFullSlugFromUrl()` to decode URI-encoded pathnames. Non-ASCII characters (Cyrillic, Chinese, etc.) in page titles were URL-encoded in the browser pathname but not decoded before slug comparison, causing mismatches in graph, search, and other client-side features.

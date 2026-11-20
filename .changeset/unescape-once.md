---
"@quartz-community/utils": patch
---

`unescapeHTML` decodes each entity once, so `unescapeHTML(escapeHTML(s))` returns `s` again. Before, `&amp;lt;` was decoded twice to `<`.

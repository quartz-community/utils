---
"@quartz-community/utils": patch
---

`slugifyFilePath` no longer drops a trailing "undefined" from a path without an extension, so `[[JavaScript undefined]]` links to `javascript-undefined` instead of `javascript-`.

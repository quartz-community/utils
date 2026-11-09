---
"@quartz-community/utils": patch
---

Resolve short wikilinks to Obsidian folder notes.

`slugifyFilePath` rewrites `Foo/Foo.md` to the slug `Foo/index`. The last path segment is then `index`, so the `shortest` strategy in `transformLink` never matched a short `[[Foo]]` link. The link resolved to a root-relative "guess" that does not exist, and no error occurred.

`transformLink` now retries against the folder name. The retry runs only when no real file claims that name. Links that already resolve do not change.

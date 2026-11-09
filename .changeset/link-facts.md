---
"@quartz-community/utils": minor
---

Links resolve as in Obsidian 1.15.0:

- Paths are NFC-normalized (`slugifyPath`, so `slugifyFilePath` and `transformInternalLink`). A link spelled `café.md` (decomposed, as macOS writes it) and the file `café.md` get the same slug.
- `transformInternalLink` no longer throws `URIError: URI malformed` on a path that is not valid percent-encoding (`%zz`, `a%E2.md`). One such link failed the whole build.
- New `linkPathDecodes(link)`: whether a link's path percent-decodes. Obsidian treats a Markdown link whose path doesn't as external.

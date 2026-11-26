---
"@quartz-community/utils": patch
---

Block anchors keep their `^`: `splitAnchor("note#^Para-1")` gives `#^para-1` (was `#para-1`), `transformInternalLink` and `transformLink` link to `note#^para-1`, and `resolveAnchorHref` points `#^name` at the block's id `^name` and never at a heading. New `blockAnchor(name)`. Blocks and headings are separate namespaces, as in Obsidian: with rehype-obsidian giving blocks the id `^name`, block `^para-1` and heading `## Para 1` no longer share the anchor `#para-1`. URLs of links to blocks change from `#id` to `#^id`.

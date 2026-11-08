---
"@quartz-community/utils": minor
---

Add `slugHeading`, `HeadingSlugger` and `obsidianHeadingAnchor`: one shared way to slug heading text, so heading ids, links to headings and table-of-contents entries always agree. `slugHeading` gives the same slug as GitHub and `rehype-slug`, so existing heading ids don't change. `splitAnchor` now slugs anchors with `slugHeading`.

Under the `relative` link strategy, a link to a folder note by its own file name, such as `./Topic.md` written inside `topic/`, now reaches the folder page instead of a page that doesn't exist.

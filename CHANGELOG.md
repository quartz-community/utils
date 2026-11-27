## 1.3.4

### Patch Changes

- b5bb38c: `transformLink` keeps a target that starts with `../` relative to the page under the `shortest` and `absolute` strategies. These targets lost only their first `.` and climbed one folder too many, so links that plugins build with `pathToRoot`, such as inline `#tag` links, left a site served under a base path (`/tags/foo` instead of `/sub/tags/foo`).

## 1.3.3

### Patch Changes

- 3ae51bc: `slugifyFilePath` no longer drops a trailing "undefined" from a path without an extension, so `[[JavaScript undefined]]` links to `javascript-undefined` instead of `javascript-`.

## 1.3.2

### Patch Changes

- 0d24f77: Block anchors keep their `^`: `splitAnchor("note#^Para-1")` gives `#^para-1` (was `#para-1`), `transformInternalLink` and `transformLink` link to `note#^para-1`, and `resolveAnchorHref` points `#^name` at the block's id `^name` and never at a heading. New `blockAnchor(name)`. Blocks and headings are separate namespaces, as in Obsidian: with rehype-obsidian giving blocks the id `^name`, block `^para-1` and heading `## Para 1` no longer share the anchor `#para-1`. URLs of links to blocks change from `#id` to `#^id`.

## 1.3.1

### Patch Changes

- 7c72830: `stripDiacritics` (the `stripDiacritics` slug option) aims at slugs that need no percent-encoding, so it now works on Latin letters only, and fully: marks are removed only from Latin letters (marks outside U+0300–U+036F included), and Latin letters without a decomposition are written in ASCII (`Łódź` → `lodz`, `Straße` → `strasse`, `Æble` → `aeble`, `İstanbul ılık` → `istanbul-ilik`). Other scripts are left as written: their slugs are percent-encoded either way, and their marks can be part of the letter. Before, Russian `й`/`ё` became `и`/`е` and Greek lost its accents, while `ł`, `ø` and `ß` were kept.

## 1.3.0

### Minor Changes

- 1a82d32: Add `setSlugOptions({ stripDiacritics })` (with `getSlugOptions` and `stripDiacritics`): when set, `slugifyPath`, `slugifyFilePath`, `slugTag` and link resolution strip accents and other diacritics from slugs (`české/čeština` → `ceske/cestina`). The setting lives on `globalThis`, so every copy of the package in a thread agrees; Quartz sets it from `configuration.slugs.stripDiacritics`. Off by default, so slugs are unchanged.

### Patch Changes

- 3953c9a: fix(path): `normalizeHastElement` kept links of embedded folder notes one directory too high. The embedded page's directory is now taken from its raw slug, so a slug ending in `index` no longer loses a real path segment (visible under a base path, e.g. canvas file nodes embedding `folder/index.md`).

## 1.2.1

### Patch Changes

- 5f675fe: `unescapeHTML` decodes each entity once, so `unescapeHTML(escapeHTML(s))` returns `s` again. Before, `&amp;lt;` was decoded twice to `<`.

## 1.2.0

### Minor Changes

- b9c9078: Links resolve as in Obsidian 1.15.0:

  - Paths are NFC-normalized (`slugifyPath`, so `slugifyFilePath` and `transformInternalLink`). A link spelled `café.md` (decomposed, as macOS writes it) and the file `café.md` get the same slug.
  - `transformInternalLink` no longer throws `URIError: URI malformed` on a path that is not valid percent-encoding (`%zz`, `a%E2.md`). One such link failed the whole build.
  - New `linkPathDecodes(link)`: whether a link's path percent-decodes. Obsidian treats a Markdown link whose path doesn't as external.

## 1.1.1

### Patch Changes

- dbd8d99: `hast-util-to-jsx-runtime` is bundled into `dist/` instead of being imported from an optional peer dependency, which npm doesn't install. The main entry imports it (for `htmlToJsx`), so a package that imported anything from `@quartz-community/utils` without also declaring `hast-util-to-jsx-runtime` failed with "Cannot find package 'hast-util-to-jsx-runtime'". Packages that use utils no longer need to declare it.

## 1.1.0

### Minor Changes

- 4c5a4d0: Add `slugHeading`, `HeadingSlugger` and `obsidianHeadingAnchor`: one shared way to slug heading text, so heading ids, links to headings and table-of-contents entries always agree. `slugHeading` gives the same slug as GitHub and `rehype-slug`, so existing heading ids don't change. `splitAnchor` now slugs anchors with `slugHeading`, and the new `resolveAnchorHref` points a same-page `#anchor` link at the heading (or block) it names.

  Under the `relative` link strategy, a link to a folder note by its own file name, such as `./Topic.md` written inside `topic/`, now reaches the folder page instead of a page that doesn't exist.

### Patch Changes

- 2c9c4ca: Resolve short wikilinks to Obsidian folder notes.

  `slugifyFilePath` rewrites `Foo/Foo.md` to the slug `Foo/index`. The last path segment is then `index`, so the `shortest` strategy in `transformLink` never matched a short `[[Foo]]` link. The link resolved to a root-relative "guess" that does not exist, and no error occurred.

  `transformLink` now retries against the folder name. The retry runs only when no real file claims that name. Links that already resolve do not change.

- 68d4de9: `github-slugger` is bundled into `dist/` instead of being imported from an optional peer dependency, which npm doesn't install. The package uses it for `slugHeading` and `HeadingSlugger`, so a package that uses `@quartz-community/utils` no longer needs to declare `github-slugger` itself.

## 1.0.2

### Patch Changes

- 2415d7c: Releases are published from GitHub Actions with npm trusted publishing, so each version on npm now carries provenance linking it to the commit and workflow that built it. No changes to the package itself.

## 1.0.1

### Patch Changes

- Add `preact` to devDependencies so the package can be built from source.

  `src/jsx.tsx` imports `preact` and `preact/jsx-runtime`, and the build emits declarations
  (`dts: true`), so TypeScript needs preact types at build time. It was declared only as a
  required peer dependency, and Quartz sets `legacy-peer-deps=true`, so npm did not install
  it when building from a `github:` source. Builds failed with TS2307 and TS2875.

# Changelog

## 1.0.0

### Major Changes

- Stable 1.0 release. All `@quartz-community/*` dependencies now use `^1.0.0` ranges.

  Pre-1.0 caret ranges pinned the minor version (`^0.2.1` means `>=0.2.1 <0.3.0`), so
  published fixes to shared packages could never be resolved by dependents. Moving the
  ecosystem to 1.0 makes caret ranges behave conventionally.

## 0.1.1

### Patch Changes

- 1eb2dd8: Fix `getFullSlugFromUrl()` to decode URI-encoded pathnames. Non-ASCII characters (Cyrillic, Chinese, etc.) in page titles were URL-encoded in the browser pathname but not decoded before slug comparison, causing mismatches in graph, search, and other client-side features.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial Quartz community plugin template.

### Changed

- **BREAKING**: `slugifyPath`, `slugifyFilePath`, and `slugTag` now lowercase their output to match Obsidian's case-insensitive link- and tag-matching semantics. Previously all three preserved case. This means `[[My Note]]` and `[[my note]]` both resolve to the slug `my-note`, and the tags `#MyTag` and `#mytag` collapse into a single tag page. Downstream effects: all generated URLs are now lowercase; users upgrading from earlier Quartz v5 betas with mixed-case source filenames will see their URLs change (e.g. `/MyNote` → `/my-note`). Also eliminates silent data loss on case-insensitive filesystems (macOS APFS, Windows NTFS), where `Apple.md` and `apple.md` previously produced conflicting HTML outputs that overwrote each other without warning.

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

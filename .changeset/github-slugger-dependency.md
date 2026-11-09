---
"@quartz-community/utils": patch
---

`github-slugger` is bundled into `dist/` instead of being imported from an optional peer dependency, which npm doesn't install. The package uses it for `slugHeading` and `HeadingSlugger`, so a package that uses `@quartz-community/utils` no longer needs to declare `github-slugger` itself.

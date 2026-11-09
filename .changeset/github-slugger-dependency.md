---
"@quartz-community/utils": patch
---

`github-slugger` is now a regular dependency instead of an optional peer dependency. The package imports it for `slugHeading` and `HeadingSlugger`, so a package that uses `@quartz-community/utils` no longer needs to declare `github-slugger` itself.

---
"@quartz-community/utils": patch
---

`hast-util-to-jsx-runtime` is bundled into `dist/` instead of being imported from an optional peer dependency, which npm doesn't install. The main entry imports it (for `htmlToJsx`), so a package that imported anything from `@quartz-community/utils` without also declaring `hast-util-to-jsx-runtime` failed with "Cannot find package 'hast-util-to-jsx-runtime'". Packages that use utils no longer need to declare it.

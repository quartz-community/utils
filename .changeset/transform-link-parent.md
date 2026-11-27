---
"@quartz-community/utils": patch
---

`transformLink` keeps a target that starts with `../` relative to the page under the `shortest` and `absolute` strategies. These targets lost only their first `.` and climbed one folder too many, so links that plugins build with `pathToRoot`, such as inline `#tag` links, left a site served under a base path (`/tags/foo` instead of `/sub/tags/foo`).

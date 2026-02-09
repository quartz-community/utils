export {
  simplifySlug,
  getFullSlug,
  getFullSlugFromUrl,
  joinSegments,
  resolvePath,
  endsWith,
  trimSuffix,
  stripSlashes,
  getFileExtension,
  isFolderPath,
  getAllSegmentPrefixes,
} from "./path.js";

export type { FullSlug, SimpleSlug, RelativeURL } from "./path.js";

export { removeAllChildren, registerEscapeHandler, normalizeRelativeURLs } from "./dom.js";

export { classNames } from "./lang.js";

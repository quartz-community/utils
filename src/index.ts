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
  isFilePath,
  isFullSlug,
  isSimpleSlug,
  isRelativeURL,
  isAbsoluteURL,
  slugifyFilePath,
  pathToRoot,
  resolveRelative,
  splitAnchor,
  slugTag,
  transformInternalLink,
  transformLink,
} from "./path.js";

export type { FilePath, FullSlug, SimpleSlug, RelativeURL, TransformOptions } from "./path.js";

export { removeAllChildren, registerEscapeHandler, normalizeRelativeURLs } from "./dom.js";

export { classNames, capitalize } from "./lang.js";

export { escapeHTML, unescapeHTML } from "./escape.js";

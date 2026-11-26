export {
  simplifySlug,
  getFullSlug,
  getFullSlugFromUrl,
  joinSegments,
  resolvePath,
  getBasePath,
  resolveBasePath,
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
  blockAnchor,
  slugHeading,
  HeadingSlugger,
  obsidianHeadingAnchor,
  resolveAnchorHref,
  slugifyPath,
  slugTag,
  setSlugOptions,
  getSlugOptions,
  stripDiacritics,
  transformInternalLink,
  linkPathDecodes,
  transformLink,
  normalizeHastElement,
} from "./path.js";

export type {
  FilePath,
  FullSlug,
  SimpleSlug,
  RelativeURL,
  TransformOptions,
  SlugOptions,
} from "./path.js";

export { removeAllChildren, registerEscapeHandler, normalizeRelativeURLs } from "./dom.js";

export { classNames, capitalize } from "./lang.js";

export { escapeHTML, unescapeHTML } from "./escape.js";

export { htmlToJsx } from "./jsx.js";

export { formatDate } from "./date.js";
export { getIconCode } from "./emoji.js";
export { getDate, byDateAndAlphabetical } from "./sort.js";

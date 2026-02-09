/**
 * Path utilities for Quartz plugins.
 * These functions are isomorphic and work in both Node.js and browser environments.
 */

/**
 * Branded string types for type-safe slug handling.
 */
type SlugLike<T> = string & { __brand: T };

/** Full slug - cannot be relative, may not have leading/trailing slashes, can have 'index' as last segment */
export type FullSlug = SlugLike<"full">;

/** Simple slug - no '/index' ending, no file extension, can have trailing slash for folders */
export type SimpleSlug = SlugLike<"simple">;

/** Relative URL - starts with './' or '../', used for navigation */
export type RelativeURL = SlugLike<"relative">;

/**
 * Simplifies a full slug by removing the '/index' suffix.
 * @param fp - The full slug to simplify
 * @returns The simplified slug, or "/" if the result would be empty
 *
 * @example
 * simplifySlug("folder/index") // "folder/"
 * simplifySlug("page") // "page"
 * simplifySlug("index") // "/"
 */
export function simplifySlug(fp: FullSlug | string): SimpleSlug {
  const res = stripSlashes(trimSuffix(fp, "index"), true);
  return (res.length === 0 ? "/" : res) as SimpleSlug;
}

/**
 * Gets the current page's full slug from the window location.
 * @param window - The window object (for browser environments)
 * @returns The full slug of the current page
 *
 * @example
 * // On page /blog/my-post
 * getFullSlug(window) // "blog/my-post"
 */
export function getFullSlug(window: Window): FullSlug {
  const res = window.document.body.dataset.slug! as FullSlug;
  return res;
}

/**
 * Gets the current page's full slug from window.location.pathname.
 * Use this when document.body.dataset.slug is not available (e.g., in inline scripts).
 * @returns The full slug derived from the URL pathname
 *
 * @example
 * // On URL /blog/my-post/
 * getFullSlugFromUrl() // "blog/my-post"
 */
export function getFullSlugFromUrl(): FullSlug {
  let rawSlug = window.location.pathname;
  if (rawSlug.endsWith("/")) rawSlug = rawSlug.slice(0, -1);
  if (rawSlug.startsWith("/")) rawSlug = rawSlug.slice(1);
  return rawSlug as FullSlug;
}

/**
 * Joins path segments together, handling slashes properly.
 * @param args - Path segments to join
 * @returns The joined path
 *
 * @example
 * joinSegments("a", "b", "c") // "a/b/c"
 * joinSegments("/a/", "/b/", "c") // "/a/b/c"
 * joinSegments("a", "", "c") // "a/c"
 */
export function joinSegments(...args: string[]): string {
  if (args.length === 0) {
    return "";
  }

  let joined = args
    .filter((segment) => segment !== "" && segment !== "/")
    .map((segment) => stripSlashes(segment))
    .join("/");

  const first = args[0];
  const last = args[args.length - 1];

  if (first?.startsWith("/")) {
    joined = "/" + joined;
  }

  if (last?.endsWith("/")) {
    joined = joined + "/";
  }

  return joined;
}

/**
 * Resolves a path, ensuring it starts with a slash for absolute navigation.
 * @param to - The target path
 * @returns The resolved absolute path
 *
 * @example
 * resolvePath("blog/post") // "/blog/post"
 * resolvePath("/already-absolute") // "/already-absolute"
 */
export function resolvePath(to: string): string {
  if (to.startsWith("/")) return to;
  return "/" + to;
}

/**
 * Checks if a string ends with a given suffix, accounting for path separators.
 * @param s - The string to check
 * @param suffix - The suffix to look for
 * @returns True if the string ends with the suffix
 *
 * @example
 * endsWith("folder/index", "index") // true
 * endsWith("index", "index") // true
 * endsWith("myindex", "index") // false
 */
export function endsWith(s: string, suffix: string): boolean {
  return s === suffix || s.endsWith("/" + suffix);
}

/**
 * Removes a suffix from a string if it ends with that suffix (respecting path separators).
 * @param s - The string to trim
 * @param suffix - The suffix to remove
 * @returns The trimmed string
 *
 * @example
 * trimSuffix("folder/index", "index") // "folder/"
 * trimSuffix("page", "index") // "page"
 */
export function trimSuffix(s: string, suffix: string): string {
  if (endsWith(s, suffix)) {
    s = s.slice(0, -suffix.length);
  }
  return s;
}

/**
 * Strips leading and/or trailing slashes from a string.
 * @param s - The string to strip
 * @param onlyStripPrefix - If true, only strip leading slash
 * @returns The stripped string
 *
 * @example
 * stripSlashes("/path/to/file/") // "path/to/file"
 * stripSlashes("/path/", true) // "path/"
 */
export function stripSlashes(s: string, onlyStripPrefix?: boolean): string {
  if (s.startsWith("/")) {
    s = s.substring(1);
  }

  if (!onlyStripPrefix && s.endsWith("/")) {
    s = s.slice(0, -1);
  }

  return s;
}

/**
 * Gets the file extension from a path.
 * @param s - The path string
 * @returns The file extension including the dot, or undefined if none
 *
 * @example
 * getFileExtension("file.md") // ".md"
 * getFileExtension("file") // undefined
 */
export function getFileExtension(s: string): string | undefined {
  return s.match(/\.[A-Za-z0-9]+$/)?.[0];
}

/**
 * Checks if a path represents a folder (ends with /, index, index.md, or index.html).
 * @param fplike - The path-like string to check
 * @returns True if the path represents a folder
 *
 * @example
 * isFolderPath("folder/") // true
 * isFolderPath("folder/index") // true
 * isFolderPath("file.md") // false
 */
export function isFolderPath(fplike: string): boolean {
  return (
    fplike.endsWith("/") ||
    endsWith(fplike, "index") ||
    endsWith(fplike, "index.md") ||
    endsWith(fplike, "index.html")
  );
}

/**
 * Gets all segment prefixes for a path (useful for tags/breadcrumbs).
 * @param path - The path string (e.g., "a/b/c")
 * @returns Array of all prefixes (e.g., ["a", "a/b", "a/b/c"])
 *
 * @example
 * getAllSegmentPrefixes("programming/web/react") // ["programming", "programming/web", "programming/web/react"]
 */
export function getAllSegmentPrefixes(path: string): string[] {
  const segments = path.split("/");
  const results: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    results.push(segments.slice(0, i + 1).join("/"));
  }
  return results;
}

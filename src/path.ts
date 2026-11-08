import GithubSlugger, { slug as githubSlug } from "github-slugger";
import type { Element as HastElement } from "hast";
import type { FilePath, FullSlug } from "@quartz-community/types";

export type { FilePath, FullSlug };

/** No '/index' ending, no file extension, can have trailing slash for folders. */
export type SimpleSlug = string & { _brand: "SimpleSlug" };

/** Starts with './' or '../', used for navigation. */
export type RelativeURL = string & { _brand: "RelativeURL" };

export interface TransformOptions {
  strategy: "absolute" | "relative" | "shortest";
  allSlugs: FullSlug[];
}

export function isFilePath(s: string): s is FilePath {
  const validStart = !s.startsWith(".");
  return validStart && _hasFileExtension(s);
}

export function isFullSlug(s: string): s is FullSlug {
  const validStart = !(s.startsWith(".") || s.startsWith("/"));
  const validEnding = !s.endsWith("/");
  return validStart && validEnding && !_containsForbiddenCharacters(s);
}

export function isSimpleSlug(s: string): s is SimpleSlug {
  const validStart = !(s.startsWith(".") || (s.length > 1 && s.startsWith("/")));
  const validEnding = !endsWith(s, "index");
  return validStart && !_containsForbiddenCharacters(s) && validEnding && !_hasFileExtension(s);
}

export function isRelativeURL(s: string): s is RelativeURL {
  const validStart = /^\.{1,2}/.test(s);
  const validEnding = !endsWith(s, "index");
  return validStart && validEnding && ![".md", ".html"].includes(getFileExtension(s) ?? "");
}

export function isAbsoluteURL(s: string): boolean {
  try {
    new URL(s);
  } catch {
    return false;
  }
  return true;
}

export function simplifySlug(fp: FullSlug | string): SimpleSlug {
  const res = stripSlashes(trimSuffix(fp, "index"), true);
  return (res.length === 0 ? "/" : res) as SimpleSlug;
}

export function getFullSlug(window: Window): FullSlug {
  const res = window.document.body.dataset.slug! as FullSlug;
  return res;
}

export function getFullSlugFromUrl(): FullSlug {
  let rawSlug = decodeURI(window.location.pathname);
  if (rawSlug.endsWith("/")) rawSlug = rawSlug.slice(0, -1);
  if (rawSlug.startsWith("/")) rawSlug = rawSlug.slice(1);
  return rawSlug as FullSlug;
}

export function slugifyFilePath(fp: FilePath, excludeExt?: boolean): FullSlug {
  fp = stripSlashes(fp) as FilePath;
  const ext = getFileExtension(fp);
  const withoutFileExt = fp.replace(new RegExp(ext + "$"), "");
  const finalExt = excludeExt || [".md", ".html", undefined].includes(ext) ? "" : ext;

  let slug = _sluggify(withoutFileExt);

  if (endsWith(slug, "_index")) {
    slug = slug.replace(/_index$/, "index");
  }

  // Obsidian "Folder Notes" convention (insideFolder storage): a file named the
  // same as its parent folder is treated as the folder's landing page. Rewrite
  // `folder/folder` → `folder/index` so every downstream consumer (trie, link
  // resolver, simplifySlug, isFolderPath) sees the canonical Quartz slug shape
  // and Just Works. A top-level single-segment slug is NOT rewritten — that
  // represents Obsidian's `parentFolder` storage mode, which Quartz already
  // routes as a regular top-level page.
  const segments = slug.split("/");
  if (segments.length >= 2 && segments[segments.length - 1] === segments[segments.length - 2]) {
    segments[segments.length - 1] = "index";
    slug = segments.join("/");
  }

  return (slug + (finalExt ?? "")) as FullSlug;
}

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

export function resolvePath(to: string): string {
  if (to.startsWith("/")) return to;
  return "/" + to;
}

/** Read the base path injected at build time via `data-basepath` on `<body>`.
 *  Returns `""` for root deployments, e.g. `"/repository"` for subdirectory. */
export function getBasePath(): string {
  if (typeof document === "undefined") return "";
  return document.body?.dataset?.basepath ?? "";
}

/** Resolve a slug to an absolute URL path, prepending the site's base path.
 *  e.g. `resolveBasePath("features/Callouts")` → `"/repository/features/Callouts"` */
export function resolveBasePath(to: string, basePath?: string): string {
  const base = basePath ?? getBasePath();
  const slug = to.startsWith("/") ? to : "/" + to;
  return base + slug;
}

export function endsWith(s: string, suffix: string): boolean {
  return s === suffix || s.endsWith("/" + suffix);
}

export function trimSuffix(s: string, suffix: string): string {
  if (endsWith(s, suffix)) {
    s = s.slice(0, -suffix.length);
  }
  return s;
}

export function stripSlashes(s: string, onlyStripPrefix?: boolean): string {
  if (s.startsWith("/")) {
    s = s.substring(1);
  }

  if (!onlyStripPrefix && s.endsWith("/")) {
    s = s.slice(0, -1);
  }

  return s;
}

export function getFileExtension(s: string): string | undefined {
  return s.match(/\.[A-Za-z0-9]+$/)?.[0];
}

export function isFolderPath(fplike: string): boolean {
  return (
    fplike.endsWith("/") ||
    endsWith(fplike, "index") ||
    endsWith(fplike, "index.md") ||
    endsWith(fplike, "index.html")
  );
}

export function getAllSegmentPrefixes(path: string): string[] {
  const segments = path.split("/");
  const results: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    results.push(segments.slice(0, i + 1).join("/"));
  }
  return results;
}

export function pathToRoot(slug: FullSlug): RelativeURL {
  let rootPath = slug
    .split("/")
    .filter((x) => x !== "")
    .slice(0, -1)
    .map((_) => "..")
    .join("/");

  if (rootPath.length === 0) {
    rootPath = ".";
  }

  return rootPath as RelativeURL;
}

export function resolveRelative(current: FullSlug, target: FullSlug | SimpleSlug): RelativeURL {
  const res = joinSegments(pathToRoot(current), simplifySlug(target as FullSlug)) as RelativeURL;
  return res;
}

/**
 * The slug of a heading's text: the `id` Quartz gives a heading, and the
 * anchor every link or table-of-contents entry to that heading must use.
 *
 * Same rule as GitHub and `rehype-slug` (`github-slugger`): lowercase,
 * punctuation removed, each space replaced by `-`. Non-Latin letters and
 * digits are kept, e.g. `"监听 127.0.0.1（推荐）"` → `"监听-127001推荐"`.
 *
 * Use {@link HeadingSlugger} when slugging every heading on a page, so that
 * repeated headings get unique ids (`foo`, `foo-1`, …).
 */
export function slugHeading(text: string): string {
  return githubSlug(text);
}

/**
 * Slugs the headings of one page in document order with {@link slugHeading},
 * numbering repeats the way GitHub and `rehype-slug` do (`foo`, `foo-1`,
 * `foo-2`). Create one per page, or call `reset()` between pages.
 */
export class HeadingSlugger {
  private readonly slugger = new GithubSlugger();

  /** Slug `text`, unique among the slugs this instance has returned. */
  slug(text: string): string {
    return this.slugger.slug(text);
  }

  reset(): void {
    this.slugger.reset();
  }
}

/**
 * The anchor Obsidian writes when it links to a heading with this text.
 *
 * Obsidian anchors cannot hold `:`, `|`, `^`, `#` or `\`, so Obsidian replaces
 * each with a space and collapses the spaces: `"Colon:unspaced"` →
 * `"Colon unspaced"`. Slugging this with {@link slugHeading} gives the anchor
 * a link written in Obsidian resolves to; when it differs from the heading's
 * `id`, heading producers can add it as an alias id.
 */
export function obsidianHeadingAnchor(text: string): string {
  return text
    .replace(/[:|^#\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Point a same-page anchor link (`href` starting with `#`, as written) at an
 * `id` on the page. `ids` holds every `id` on the page.
 *
 * - An anchor that already names an id (as written or percent-decoded) is
 *   returned unchanged.
 * - `#^name` (an Obsidian block reference) points at the id `name`.
 * - Otherwise the anchor is a heading's text, slugged with
 *   {@link slugHeading}, the same as the heading's id, e.g.
 *   `#监听 127.0.0.1（推荐）` → `#监听-127001推荐`.
 */
export function resolveAnchorHref(href: string, ids: ReadonlySet<string>): string {
  if (!href.startsWith("#") || href.length === 1) return href;
  const raw = href.slice(1);
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep the anchor as written
  }
  if (ids.has(raw) || ids.has(decoded)) return href;
  if (decoded.startsWith("^") && ids.has(decoded.slice(1))) return "#" + decoded.slice(1);
  const bare = decoded.startsWith("^") ? decoded.slice(1) : decoded;
  const slugged = slugHeading(bare);
  return slugged === "" ? href : "#" + slugged;
}

export function splitAnchor(link: string): [string, string] {
  const [fp, anchor] = link.split("#", 2);
  if (fp!.endsWith(".pdf")) {
    return [fp!, anchor === undefined ? "" : `#${anchor}`];
  }
  if (anchor === undefined) {
    return [fp!, ""];
  }
  const bare = anchor.startsWith("^") ? anchor.slice(1) : anchor;
  const slugged = "#" + slugHeading(bare);
  return [fp!, slugged];
}

export function slugTag(tag: string): string {
  return tag
    .split("/")
    .map((tagSegment) => _sluggify(tagSegment))
    .join("/");
}

export function transformInternalLink(link: string): RelativeURL {
  const [fplike, anchor] = splitAnchor(decodeURI(link));

  const segments = fplike.split("/").filter((x) => x.length > 0);
  const prefix = segments.filter(_isRelativeSegment).join("/");
  const fp = segments.filter((seg) => !_isRelativeSegment(seg) && seg !== "").join("/");

  const slugged = slugifyFilePath(fp as FilePath);
  const simpleSlug = simplifySlug(slugged);
  const folderPath = isFolderPath(fplike) || isFolderPath(slugged);
  const joined = joinSegments(stripSlashes(prefix), stripSlashes(simpleSlug));
  const trail = folderPath ? "/" : "";
  const res = (_addRelativeToStart(joined) + trail + anchor) as RelativeURL;
  return res;
}

export function transformLink(src: FullSlug, target: string, opts: TransformOptions): RelativeURL {
  const targetSlug = transformInternalLink(target);

  if (opts.strategy === "relative") {
    return _resolveRelativeFolderNote(src, target) ?? (targetSlug as RelativeURL);
  } else {
    // When src is a folder page (e.g. "Compendium/Spells" backed by index.md),
    // the browser serves it at "/Compendium/Spells/" with a trailing slash.
    // pathToRoot needs the "/index" suffix to compute the correct depth.
    const effectiveSrc =
      !endsWith(src, "index") && opts.allSlugs.includes(`${src}/index` as FullSlug)
        ? (`${src}/index` as FullSlug)
        : src;

    const folderTail = isFolderPath(targetSlug) ? "/" : "";
    const canonicalSlug = stripSlashes(targetSlug.slice(".".length));
    const [targetCanonical, targetAnchor] = splitAnchor(canonicalSlug);

    if (opts.strategy === "shortest") {
      const isMultiSegment = targetCanonical.includes("/");
      const isFolderTarget = isFolderPath(targetSlug);
      let matchingFileNames = opts.allSlugs.filter((slug) => {
        if (isMultiSegment) {
          // Multi-segment partial path: match by suffix
          if (slug === targetCanonical || slug.endsWith("/" + targetCanonical)) {
            return true;
          }
          // Folder targets have "/index" stripped — also match the "/index" variant
          if (isFolderTarget) {
            const withIndex = targetCanonical + "/index";
            return slug === withIndex || slug.endsWith("/" + withIndex);
          }
          return false;
        }
        const parts = slug.split("/");
        const fileName = parts.at(-1);
        return targetCanonical === fileName;
      });

      // Folder note Foo/Foo.md slugs to Foo/index, so its last segment never matches [[Foo]]
      // Retry by folder name, only when no real file claims it
      if (matchingFileNames.length === 0 && !isMultiSegment) {
        matchingFileNames = opts.allSlugs.filter((slug) => {
          const parts = slug.split("/");
          return parts.at(-1) === "index" && parts.at(-2) === targetCanonical;
        });
      }

      if (matchingFileNames.length === 1) {
        const matchedSlug = matchingFileNames[0]!;
        return (resolveRelative(effectiveSrc, matchedSlug) + targetAnchor) as RelativeURL;
      }
    }

    return (joinSegments(pathToRoot(effectiveSrc), canonicalSlug) + folderTail) as RelativeURL;
  }
}

/**
 * A relative link can name a folder note (`topic/Topic.md`, slugged
 * `topic/index`) without spelling out its folder, e.g. `./Topic.md` written
 * inside `topic/`. `slugifyFilePath` only sees the segments the link spells
 * out, so apply the folder-note rule to the target as resolved against the
 * source's folder, and return the link with its file name replaced by
 * `index`. Returns `undefined` when the target is not such a folder note.
 * @internal
 */
function _resolveRelativeFolderNote(src: FullSlug, target: string): RelativeURL | undefined {
  let decoded: string;
  try {
    decoded = decodeURI(target);
  } catch {
    return undefined;
  }
  const hashIdx = decoded.indexOf("#");
  const fplike = hashIdx === -1 ? decoded : decoded.slice(0, hashIdx);
  const rest = hashIdx === -1 ? "" : decoded.slice(hashIdx);
  if (fplike === "" || fplike.endsWith("/") || fplike.startsWith("/")) return undefined;

  const ext = getFileExtension(fplike);
  if (![".md", ".html", undefined].includes(ext)) return undefined;

  const segments = fplike.split("/");
  const fileName = segments[segments.length - 1]!;
  const fileSlug = slugifyPath(ext ? fileName.slice(0, -ext.length) : fileName);
  if (fileSlug === "index") return undefined;

  // Resolve the link's folder against the source's folder (both as slugs)
  const resolved = src.split("/").slice(0, -1);
  for (const seg of segments.slice(0, -1)) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      if (resolved.length === 0) return undefined;
      resolved.pop();
    } else {
      resolved.push(slugifyPath(seg));
    }
  }

  if (resolved.length === 0 || resolved[resolved.length - 1] !== fileSlug) return undefined;

  segments[segments.length - 1] = "index" + (ext ?? "");
  return transformInternalLink(encodeURI(segments.join("/") + rest));
}

/**
 * Slugify a file path for use as an href.
 * Replaces whitespace→hyphens, &→-and-, %→-percent, removes ? and #, and
 * lowercases the result so that link matching is case-insensitive (matching
 * Obsidian's link-resolution semantics). Operates per segment so directory
 * separators are preserved.
 */
export function slugifyPath(s: string): string {
  return s
    .split("/")
    .map((segment) =>
      segment
        .replace(/\s/g, "-")
        .replace(/&/g, "-and-")
        .replace(/%/g, "-percent")
        .replace(/\?/g, "")
        .replace(/#/g, "")
        .replace(/[<>:"|*]/g, "")
        .toLowerCase(),
    )
    .join("/")
    .replace(/\/$/, "");
}

/**
 * Re-base the relative `href` and `src` attributes of a HAST element so that
 * links inside content originally resolved relative to `newBase` remain valid
 * when the element is embedded at a page with slug `curBase`.
 *
 * Used for transclusions and cross-slug HAST embedding (Quartz core's
 * `renderPage` transclude expansion, canvas-page's embedded file-nodes, and
 * any plugin that takes `vfile.data.htmlAst` from one page and renders it
 * inside another). Absolute URLs pass through unchanged.
 *
 * The element (and its children) are deep-cloned via `structuredClone`, so
 * the original HAST tree is never mutated.
 */
export function normalizeHastElement<T extends HastElement>(
  rawEl: T,
  curBase: FullSlug,
  newBase: FullSlug,
): T {
  const el = structuredClone(rawEl);
  _rebaseHastElement(el, "src", curBase, newBase);
  _rebaseHastElement(el, "href", curBase, newBase);
  if (el.children) {
    el.children = el.children.map((child) =>
      child.type === "element"
        ? (normalizeHastElement(child as HastElement, curBase, newBase) as typeof child)
        : child,
    );
  }
  return el;
}

/** @internal */
function _rebaseHastElement(
  el: HastElement,
  attr: "href" | "src",
  curBase: FullSlug,
  newBase: FullSlug,
): void {
  const value = el.properties?.[attr];
  if (value === undefined || value === null) return;
  const href = String(value);
  if (!isRelativeURL(href)) return;
  el.properties![attr] = joinSegments(resolveRelative(curBase, newBase), "..", href);
}

/** @internal */
function _sluggify(s: string): string {
  return slugifyPath(s);
}

function _containsForbiddenCharacters(s: string): boolean {
  return s.includes(" ") || s.includes("#") || s.includes("?") || s.includes("&");
}

function _hasFileExtension(s: string): boolean {
  return getFileExtension(s) !== undefined;
}

function _isRelativeSegment(s: string): boolean {
  return /^\.{0,2}$/.test(s);
}

function _addRelativeToStart(s: string): string {
  if (s === "") {
    s = ".";
  }

  if (!s.startsWith(".")) {
    s = joinSegments(".", s);
  }

  return s;
}

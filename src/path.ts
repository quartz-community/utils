import { slug as slugAnchor } from "github-slugger";
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
  let rawSlug = window.location.pathname;
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

export function splitAnchor(link: string): [string, string] {
  const [fp, anchor] = link.split("#", 2);
  if (fp!.endsWith(".pdf")) {
    return [fp!, anchor === undefined ? "" : `#${anchor}`];
  }
  const slugged = anchor === undefined ? "" : "#" + slugAnchor(anchor);
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

  const folderPath = isFolderPath(fplike);
  const segments = fplike.split("/").filter((x) => x.length > 0);
  const prefix = segments.filter(_isRelativeSegment).join("/");
  const fp = segments.filter((seg) => !_isRelativeSegment(seg) && seg !== "").join("/");

  const simpleSlug = simplifySlug(slugifyFilePath(fp as FilePath));
  const joined = joinSegments(stripSlashes(prefix), stripSlashes(simpleSlug));
  const trail = folderPath ? "/" : "";
  const res = (_addRelativeToStart(joined) + trail + anchor) as RelativeURL;
  return res;
}

export function transformLink(src: FullSlug, target: string, opts: TransformOptions): RelativeURL {
  const targetSlug = transformInternalLink(target);

  if (opts.strategy === "relative") {
    return targetSlug as RelativeURL;
  } else {
    const folderTail = isFolderPath(targetSlug) ? "/" : "";
    const canonicalSlug = stripSlashes(targetSlug.slice(".".length));
    const [targetCanonical, targetAnchor] = splitAnchor(canonicalSlug);

    if (opts.strategy === "shortest") {
      const matchingFileNames = opts.allSlugs.filter((slug) => {
        const parts = slug.split("/");
        const fileName = parts.at(-1);
        return targetCanonical === fileName;
      });

      if (matchingFileNames.length === 1) {
        const matchedSlug = matchingFileNames[0]!;
        return (resolveRelative(src, matchedSlug) + targetAnchor) as RelativeURL;
      }
    }

    return (joinSegments(pathToRoot(src), canonicalSlug) + folderTail) as RelativeURL;
  }
}

function _sluggify(s: string): string {
  return s
    .split("/")
    .map((segment) =>
      segment
        .replace(/\s/g, "-")
        .replace(/&/g, "-and-")
        .replace(/%/g, "-percent")
        .replace(/\?/g, "")
        .replace(/#/g, ""),
    )
    .join("/")
    .replace(/\/$/, "");
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

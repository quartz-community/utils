import { slug } from 'github-slugger';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { jsxs, jsx, Fragment } from 'preact/jsx-runtime';
import { h } from 'preact';

// src/path.ts
function isFilePath(s) {
  const validStart = !s.startsWith(".");
  return validStart && _hasFileExtension(s);
}
function isFullSlug(s) {
  const validStart = !(s.startsWith(".") || s.startsWith("/"));
  const validEnding = !s.endsWith("/");
  return validStart && validEnding && !_containsForbiddenCharacters(s);
}
function isSimpleSlug(s) {
  const validStart = !(s.startsWith(".") || s.length > 1 && s.startsWith("/"));
  const validEnding = !endsWith(s, "index");
  return validStart && !_containsForbiddenCharacters(s) && validEnding && !_hasFileExtension(s);
}
function isRelativeURL(s) {
  const validStart = /^\.{1,2}/.test(s);
  const validEnding = !endsWith(s, "index");
  return validStart && validEnding && ![".md", ".html"].includes(getFileExtension(s) ?? "");
}
function isAbsoluteURL(s) {
  try {
    new URL(s);
  } catch {
    return false;
  }
  return true;
}
function simplifySlug(fp) {
  const res = stripSlashes(trimSuffix(fp, "index"), true);
  return res.length === 0 ? "/" : res;
}
function getFullSlug(window2) {
  const res = window2.document.body.dataset.slug;
  return res;
}
function getFullSlugFromUrl() {
  let rawSlug = window.location.pathname;
  if (rawSlug.endsWith("/")) rawSlug = rawSlug.slice(0, -1);
  if (rawSlug.startsWith("/")) rawSlug = rawSlug.slice(1);
  return rawSlug;
}
function slugifyFilePath(fp, excludeExt) {
  fp = stripSlashes(fp);
  const ext = getFileExtension(fp);
  const withoutFileExt = fp.replace(new RegExp(ext + "$"), "");
  const finalExt = excludeExt || [".md", ".html", void 0].includes(ext) ? "" : ext;
  let slug = _sluggify(withoutFileExt);
  if (endsWith(slug, "_index")) {
    slug = slug.replace(/_index$/, "index");
  }
  return slug + (finalExt ?? "");
}
function joinSegments(...args) {
  if (args.length === 0) {
    return "";
  }
  let joined = args.filter((segment) => segment !== "" && segment !== "/").map((segment) => stripSlashes(segment)).join("/");
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
function resolvePath(to) {
  if (to.startsWith("/")) return to;
  return "/" + to;
}
function endsWith(s, suffix) {
  return s === suffix || s.endsWith("/" + suffix);
}
function trimSuffix(s, suffix) {
  if (endsWith(s, suffix)) {
    s = s.slice(0, -suffix.length);
  }
  return s;
}
function stripSlashes(s, onlyStripPrefix) {
  if (s.startsWith("/")) {
    s = s.substring(1);
  }
  if (!onlyStripPrefix && s.endsWith("/")) {
    s = s.slice(0, -1);
  }
  return s;
}
function getFileExtension(s) {
  return s.match(/\.[A-Za-z0-9]+$/)?.[0];
}
function isFolderPath(fplike) {
  return fplike.endsWith("/") || endsWith(fplike, "index") || endsWith(fplike, "index.md") || endsWith(fplike, "index.html");
}
function getAllSegmentPrefixes(path) {
  const segments = path.split("/");
  const results = [];
  for (let i = 0; i < segments.length; i++) {
    results.push(segments.slice(0, i + 1).join("/"));
  }
  return results;
}
function pathToRoot(slug) {
  let rootPath = slug.split("/").filter((x) => x !== "").slice(0, -1).map((_) => "..").join("/");
  if (rootPath.length === 0) {
    rootPath = ".";
  }
  return rootPath;
}
function resolveRelative(current, target) {
  const res = joinSegments(pathToRoot(current), simplifySlug(target));
  return res;
}
function splitAnchor(link) {
  const [fp, anchor] = link.split("#", 2);
  if (fp.endsWith(".pdf")) {
    return [fp, anchor === void 0 ? "" : `#${anchor}`];
  }
  const slugged = anchor === void 0 ? "" : "#" + slug(anchor);
  return [fp, slugged];
}
function slugTag(tag) {
  return tag.split("/").map((tagSegment) => _sluggify(tagSegment)).join("/");
}
function transformInternalLink(link) {
  const [fplike, anchor] = splitAnchor(decodeURI(link));
  const folderPath = isFolderPath(fplike);
  const segments = fplike.split("/").filter((x) => x.length > 0);
  const prefix = segments.filter(_isRelativeSegment).join("/");
  const fp = segments.filter((seg) => !_isRelativeSegment(seg) && seg !== "").join("/");
  const simpleSlug = simplifySlug(slugifyFilePath(fp));
  const joined = joinSegments(stripSlashes(prefix), stripSlashes(simpleSlug));
  const trail = folderPath ? "/" : "";
  const res = _addRelativeToStart(joined) + trail + anchor;
  return res;
}
function transformLink(src, target, opts) {
  const targetSlug = transformInternalLink(target);
  if (opts.strategy === "relative") {
    return targetSlug;
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
        const matchedSlug = matchingFileNames[0];
        return resolveRelative(src, matchedSlug) + targetAnchor;
      }
    }
    return joinSegments(pathToRoot(src), canonicalSlug) + folderTail;
  }
}
function _sluggify(s) {
  return s.split("/").map(
    (segment) => segment.replace(/\s/g, "-").replace(/&/g, "-and-").replace(/%/g, "-percent").replace(/\?/g, "").replace(/#/g, "")
  ).join("/").replace(/\/$/, "");
}
function _containsForbiddenCharacters(s) {
  return s.includes(" ") || s.includes("#") || s.includes("?") || s.includes("&");
}
function _hasFileExtension(s) {
  return getFileExtension(s) !== void 0;
}
function _isRelativeSegment(s) {
  return /^\.{0,2}$/.test(s);
}
function _addRelativeToStart(s) {
  if (s === "") {
    s = ".";
  }
  if (!s.startsWith(".")) {
    s = joinSegments(".", s);
  }
  return s;
}

// src/dom.ts
function removeAllChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
function registerEscapeHandler(outsideContainer, onEscape) {
  if (!outsideContainer) return () => {
  };
  const onClick = (e) => {
    if (!outsideContainer.classList.contains("active")) {
      return;
    }
    if (e.target === outsideContainer) {
      e.preventDefault();
      e.stopPropagation();
      onEscape();
    }
  };
  const onKeydown = (e) => {
    if (!outsideContainer.classList.contains("active")) {
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onEscape();
    }
  };
  outsideContainer.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown);
  return () => {
    outsideContainer.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKeydown);
  };
}
function normalizeRelativeURLs(html, baseUrl) {
  const elements = html.querySelectorAll("[src], [href]");
  for (const el of Array.from(elements)) {
    const attr = el.hasAttribute("href") ? "href" : "src";
    const val = el.getAttribute(attr);
    if (!val) continue;
    if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("mailto:") || val.startsWith("tel:") || val.startsWith("#") || val.startsWith("/") || val.startsWith("data:")) {
      continue;
    }
    try {
      const normalized = new URL(val, baseUrl).toString();
      el.setAttribute(attr, normalized);
    } catch {
      continue;
    }
  }
}

// src/lang.ts
function capitalize(s) {
  return s.substring(0, 1).toUpperCase() + s.substring(1);
}
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// src/escape.ts
function escapeHTML(unsafe) {
  return unsafe.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function unescapeHTML(html) {
  return html.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#039;", "'");
}
function childrenToString(children) {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(childrenToString).join("");
  return String(children ?? "");
}
var builtinComponents = {
  table: (props) => /* @__PURE__ */ jsx("div", { class: "table-container", children: /* @__PURE__ */ jsx("table", { ...props }) }),
  style: ({ children, ...rest }) => h("style", { ...rest, dangerouslySetInnerHTML: { __html: childrenToString(children) } }),
  script: ({ children, ...rest }) => h("script", { ...rest, dangerouslySetInnerHTML: { __html: childrenToString(children) } })
};
function htmlToJsx(tree, components) {
  return toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    elementAttributeNameCase: "html",
    components: { ...builtinComponents, ...components }
  });
}

export { capitalize, classNames, endsWith, escapeHTML, getAllSegmentPrefixes, getFileExtension, getFullSlug, getFullSlugFromUrl, htmlToJsx, isAbsoluteURL, isFilePath, isFolderPath, isFullSlug, isRelativeURL, isSimpleSlug, joinSegments, normalizeRelativeURLs, pathToRoot, registerEscapeHandler, removeAllChildren, resolvePath, resolveRelative, simplifySlug, slugTag, slugifyFilePath, splitAnchor, stripSlashes, transformInternalLink, transformLink, trimSuffix, unescapeHTML };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
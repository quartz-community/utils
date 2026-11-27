import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getBasePath,
  getFileExtension,
  getFullSlug,
  getFullSlugFromUrl,
  isAbsoluteURL,
  isFilePath,
  isFullSlug,
  isRelativeURL,
  isSimpleSlug,
  joinSegments,
  linkPathDecodes,
  pathToRoot,
  resolveAnchorHref,
  resolveRelative,
  slugifyFilePath,
  splitAnchor,
  transformLink,
} from "../src/path.js";
import type { FilePath, FullSlug, SimpleSlug, TransformOptions } from "../src/path.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("slug and path predicates", () => {
  it("isFilePath: a path with an extension that does not start with a dot", () => {
    expect(isFilePath("notes/page.md")).toBe(true);
    expect(isFilePath("image.png")).toBe(true);
    expect(isFilePath("notes/page")).toBe(false);
    expect(isFilePath("./page.md")).toBe(false);
  });

  it("isFullSlug: no leading dot or slash, no trailing slash, no URL-unsafe characters", () => {
    expect(isFullSlug("notes/page")).toBe(true);
    expect(isFullSlug("notes/index")).toBe(true);
    expect(isFullSlug("./notes/page")).toBe(false);
    expect(isFullSlug("/notes/page")).toBe(false);
    expect(isFullSlug("notes/")).toBe(false);
    for (const c of [" ", "#", "?", "&"]) {
      expect(isFullSlug(`notes/a${c}b`), JSON.stringify(c)).toBe(false);
    }
  });

  it("isSimpleSlug: like a full slug, but `/` is allowed alone and index and extensions are not", () => {
    expect(isSimpleSlug("/")).toBe(true);
    expect(isSimpleSlug("notes/page")).toBe(true);
    expect(isSimpleSlug("/notes/page")).toBe(false);
    expect(isSimpleSlug("./notes/page")).toBe(false);
    expect(isSimpleSlug("notes/index")).toBe(false);
    expect(isSimpleSlug("notes/page.md")).toBe(false);
    expect(isSimpleSlug("notes/a b")).toBe(false);
  });

  it("isRelativeURL: starts with . or .., is not an index, and is not a Markdown/HTML file", () => {
    expect(isRelativeURL("./notes/page")).toBe(true);
    expect(isRelativeURL("../notes/page")).toBe(true);
    expect(isRelativeURL("./image.png")).toBe(true);
    expect(isRelativeURL("notes/page")).toBe(false);
    expect(isRelativeURL("/notes/page")).toBe(false);
    expect(isRelativeURL("./notes/index")).toBe(false);
    expect(isRelativeURL("./notes/page.md")).toBe(false);
    expect(isRelativeURL("./notes/page.html")).toBe(false);
  });

  it("isAbsoluteURL: anything URL parses without a base", () => {
    expect(isAbsoluteURL("https://example.com/a")).toBe(true);
    expect(isAbsoluteURL("mailto:a@example.com")).toBe(true);
    expect(isAbsoluteURL("./a")).toBe(false);
    expect(isAbsoluteURL("/a")).toBe(false);
    expect(isAbsoluteURL("notes/page")).toBe(false);
  });

  it("getFileExtension: only the last segment's extension", () => {
    expect(getFileExtension("notes/page.md")).toBe(".md");
    expect(getFileExtension("archive.tar.gz")).toBe(".gz");
    expect(getFileExtension("notes.v2/page")).toBeUndefined();
    expect(getFileExtension("notes/page")).toBeUndefined();
  });
});

describe("slugifyFilePath extension handling", () => {
  it("removes the extension only at the end of the path", () => {
    // ".md" as a pattern also matches "cmd": only the final one is the extension
    expect(slugifyFilePath("cmd/page.md" as FilePath)).toBe("cmd/page");
    expect(slugifyFilePath("notes.md.bak/page.md" as FilePath)).toBe("notes.md.bak/page");
  });

  // Without an extension the pattern used to be built from `undefined` (/undefined$/), so a path
  // ending in "undefined" lost those letters: [[JavaScript undefined]] linked to ./javascript-.
  it("keeps a trailing 'undefined' in a path without an extension", () => {
    expect(slugifyFilePath("JavaScript undefined" as FilePath)).toBe("javascript-undefined");
    expect(slugifyFilePath("notes/undefined" as FilePath)).toBe("notes/undefined");
    expect(slugifyFilePath("notes/undefined.md" as FilePath)).toBe("notes/undefined");
  });

  it("strips only the extension itself, not a lookalike before it", () => {
    expect(slugifyFilePath("a/xmd.md" as FilePath)).toBe("a/xmd");
    expect(slugifyFilePath("a/photo.png" as FilePath)).toBe("a/photo.png");
    expect(slugifyFilePath("a/photo.png" as FilePath, true)).toBe("a/photo");
  });
});

describe("pathToRoot / resolveRelative", () => {
  it("climbs one level per folder of the current slug", () => {
    expect(pathToRoot("index" as FullSlug)).toBe(".");
    expect(pathToRoot("page" as FullSlug)).toBe(".");
    expect(pathToRoot("a/page" as FullSlug)).toBe("..");
    expect(pathToRoot("a/b/index" as FullSlug)).toBe("../..");
  });

  it("links to a target slug relative to the current page, folders with a trailing slash", () => {
    expect(resolveRelative("a/b/c" as FullSlug, "e/f" as FullSlug)).toBe("../../e/f");
    expect(resolveRelative("a/b/c" as FullSlug, "a/index" as FullSlug)).toBe("../../a/");
    expect(resolveRelative("index" as FullSlug, "index" as FullSlug)).toBe("./");
    expect(resolveRelative("a/page" as FullSlug, "e/f" as SimpleSlug)).toBe("../e/f");
  });
});

describe("joinSegments", () => {
  it("drops a lone `/` segment instead of doubling the separator", () => {
    expect(joinSegments("a", "/", "b")).toBe("a/b");
    expect(joinSegments()).toBe("");
  });
});

describe("splitAnchor on PDFs", () => {
  it("gives a PDF without an anchor an empty anchor", () => {
    expect(splitAnchor("docs/file.pdf")).toEqual(["docs/file.pdf", ""]);
  });
});

describe("linkPathDecodes", () => {
  it("is true for valid percent-encoding, including a multi-byte character at the end", () => {
    expect(linkPathDecodes("caf%C3%A9")).toBe(true);
    expect(linkPathDecodes("notes/a%20b.md")).toBe(true);
  });

  it("is false when the path does not decode", () => {
    expect(linkPathDecodes("%zz")).toBe(false);
    expect(linkPathDecodes("a%E2.md")).toBe(false);
  });

  it("only looks at the path: an anchor that does not decode is fine", () => {
    expect(linkPathDecodes("a#%zz")).toBe(true);
    expect(linkPathDecodes("%zz#heading")).toBe(false);
  });
});

describe("resolveAnchorHref edge cases", () => {
  const ids = new Set(["intro"]);

  it("leaves a bare `#` and links to other pages unchanged", () => {
    expect(resolveAnchorHref("#", ids)).toBe("#");
    expect(resolveAnchorHref("page#Intro", ids)).toBe("page#Intro");
    expect(resolveAnchorHref("Intro", ids)).toBe("Intro");
  });
});

describe("transformLink: more strategies", () => {
  const allSlugs = ["a/b/c", "a/b/d", "a/b/index", "e/f", "index"] as FullSlug[];

  it("absolute: a bare file name is a path from the root, not looked up by name", () => {
    const opts: TransformOptions = { strategy: "absolute", allSlugs };
    expect(transformLink("a/b/c" as FullSlug, "d", opts)).toBe("../../d");
  });

  it("relative: a folder note reached through ../ from a subfolder", () => {
    // topic/Topic.md is topic/index; from topic/sub/page, ../Topic.md is that folder note
    const opts: TransformOptions = { strategy: "relative", allSlugs };
    expect(transformLink("topic/sub/page" as FullSlug, "../Topic.md", opts)).toBe("../");
    expect(transformLink("topic/sub/page" as FullSlug, "../Topic.md#Part", opts)).toBe("../#part");
  });

  it("relative: a folder note linked without its extension", () => {
    const opts: TransformOptions = { strategy: "relative", allSlugs };
    expect(transformLink("notes/topic/other" as FullSlug, "Topic", opts)).toBe("./");
  });

  // obsidian-flavored-markdown builds a tag's href as pathToRoot(slug) + "/tags/…"; under
  // shortest/absolute it came out one folder too deep (../.././../tags/foo), which leaves a
  // site served under a base path (TalionOak/Carvalho: /tags/inicio instead of /Carvalho/tags/…).
  it.each(["shortest", "absolute"] as const)(
    "%s: a target starting with ../ is relative to the page",
    (strategy) => {
      const opts: TransformOptions = { strategy, allSlugs: [...allSlugs, "tags/foo" as FullSlug] };
      expect(transformLink("a/b/c" as FullSlug, "../../tags/foo", opts)).toBe("../../tags/foo");
      expect(transformLink("a/b/c" as FullSlug, "../../tags/foo#x", opts)).toBe("../../tags/foo#x");
      expect(transformLink("a/b/index" as FullSlug, "../../tags/foo", opts)).toBe("../../tags/foo");
      expect(transformLink("a/b/c" as FullSlug, "../e/f", opts)).toBe("../e/f");
      // a folder note reached through ../ resolves as under relative
      expect(transformLink("topic/sub/page" as FullSlug, "../Topic.md", opts)).toBe("../");
      // vault-root targets are unchanged
      expect(transformLink("a/b/c" as FullSlug, "e/f", opts)).toBe("../../e/f");
    },
  );

  it("relative: ../ above the root is not a folder note", () => {
    const opts: TransformOptions = { strategy: "relative", allSlugs };
    expect(transformLink("page" as FullSlug, "../page.md", opts)).toBe("../page");
  });
});

describe("browser-side slug helpers", () => {
  it("getFullSlug reads the slug Quartz writes on <body>", () => {
    const win = { document: { body: { dataset: { slug: "notes/page" } } } };
    expect(getFullSlug(win as unknown as Window)).toBe("notes/page");
  });

  it("getFullSlugFromUrl decodes the path and drops its slashes", () => {
    vi.stubGlobal("window", { location: { pathname: "/notes/caf%C3%A9/" } });
    expect(getFullSlugFromUrl()).toBe("notes/café");
    vi.stubGlobal("window", { location: { pathname: "/" } });
    expect(getFullSlugFromUrl()).toBe("");
  });

  it("getBasePath reads data-basepath in the browser and is empty without it", () => {
    vi.stubGlobal("document", { body: { dataset: { basepath: "/repo" } } });
    expect(getBasePath()).toBe("/repo");
    vi.stubGlobal("document", { body: { dataset: {} } });
    expect(getBasePath()).toBe("");
    vi.stubGlobal("document", { body: null });
    expect(getBasePath()).toBe("");
  });
});

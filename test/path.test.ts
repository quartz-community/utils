import { describe, it, expect } from "vitest";
import {
  simplifySlug,
  joinSegments,
  resolvePath,
  resolveBasePath,
  endsWith,
  trimSuffix,
  stripSlashes,
  isFolderPath,
  getAllSegmentPrefixes,
  slugifyFilePath,
  slugifyPath,
  splitAnchor,
  transformInternalLink,
  transformLink,
  normalizeHastElement,
} from "../src/path.js";
import type { FilePath, FullSlug, TransformOptions } from "../src/path.js";
import type { Element as HastElement } from "hast";

describe("simplifySlug", () => {
  it("removes /index suffix", () => {
    expect(simplifySlug("folder/index")).toBe("folder/");
  });

  it("returns / for index only", () => {
    expect(simplifySlug("index")).toBe("/");
  });

  it("keeps non-index slugs unchanged", () => {
    expect(simplifySlug("page")).toBe("page");
  });
});

describe("joinSegments", () => {
  it("joins simple segments", () => {
    expect(joinSegments("a", "b", "c")).toBe("a/b/c");
  });

  it("handles leading slash", () => {
    expect(joinSegments("/a", "b")).toBe("/a/b");
  });

  it("handles trailing slash", () => {
    expect(joinSegments("a", "b/")).toBe("a/b/");
  });

  it("filters empty segments", () => {
    expect(joinSegments("a", "", "c")).toBe("a/c");
  });
});

describe("resolvePath", () => {
  it("adds leading slash if missing", () => {
    expect(resolvePath("blog/post")).toBe("/blog/post");
  });

  it("keeps existing leading slash", () => {
    expect(resolvePath("/already")).toBe("/already");
  });
});

describe("endsWith", () => {
  it("matches exact suffix", () => {
    expect(endsWith("folder/index", "index")).toBe(true);
  });

  it("matches exact string", () => {
    expect(endsWith("index", "index")).toBe(true);
  });

  it("does not match partial suffix", () => {
    expect(endsWith("myindex", "index")).toBe(false);
  });
});

describe("trimSuffix", () => {
  it("removes matching suffix", () => {
    expect(trimSuffix("folder/index", "index")).toBe("folder/");
  });

  it("keeps non-matching string", () => {
    expect(trimSuffix("page", "index")).toBe("page");
  });
});

describe("stripSlashes", () => {
  it("removes leading and trailing slashes", () => {
    expect(stripSlashes("/path/to/file/")).toBe("path/to/file");
  });

  it("removes only leading slash when specified", () => {
    expect(stripSlashes("/path/", true)).toBe("path/");
  });
});

describe("slugifyFilePath", () => {
  const slugify = (fp: string) => slugifyFilePath(fp as FilePath);

  describe("basic path handling", () => {
    it("strips .md extension from markdown files", () => {
      expect(slugify("content/post.md")).toBe("content/post");
    });

    it("strips .html extension", () => {
      expect(slugify("content/post.html")).toBe("content/post");
    });

    it("preserves non-markdown extensions", () => {
      expect(slugify("content/image.png")).toBe("content/image.png");
    });

    it("strips leading slash", () => {
      expect(slugify("/content/post.md")).toBe("content/post");
    });

    it("handles top-level index.md", () => {
      expect(slugify("index.md")).toBe("index");
    });

    it("handles nested index.md", () => {
      expect(slugify("content/index.md")).toBe("content/index");
    });
  });

  describe("Hugo _index convention", () => {
    it("rewrites trailing _index to index", () => {
      expect(slugify("content/_index.md")).toBe("content/index");
    });

    it("rewrites _index inside nested path", () => {
      expect(slugify("a/b/_index.md")).toBe("a/b/index");
    });
  });

  describe("Obsidian Folder Notes convention", () => {
    it("rewrites folder/folder.md to folder/index", () => {
      expect(slugify("characters/characters.md")).toBe("characters/index");
    });

    it("rewrites nested folder/folder.md to folder/index", () => {
      expect(slugify("fiction/books/books.md")).toBe("fiction/books/index");
    });

    it("rewrites deeply nested folder/folder.md", () => {
      expect(slugify("a/b/c/d/d.md")).toBe("a/b/c/d/index");
    });

    it("does NOT rewrite single-segment slugs (parentFolder storage is out of scope)", () => {
      expect(slugify("characters.md")).toBe("characters");
    });

    it("does NOT rewrite when last two segments differ", () => {
      expect(slugify("characters/alice.md")).toBe("characters/alice");
    });

    it("does NOT rewrite when basename matches a deeper ancestor but not direct parent", () => {
      expect(slugify("characters/sub/characters.md")).toBe("characters/sub/characters");
    });

    it("rewrites even when the inner folder is inside a same-named outer folder", () => {
      expect(slugify("a/a/a.md")).toBe("a/a/index");
    });

    it("leaves index.md as the canonical form unchanged", () => {
      expect(slugify("characters/index.md")).toBe("characters/index");
    });

    it("does not double-apply when folder literally named 'index' has index.md", () => {
      expect(slugify("index/index.md")).toBe("index/index");
    });

    it("handles nested folder literally named 'index'", () => {
      expect(slugify("docs/index/index.md")).toBe("docs/index/index");
    });

    it("rewrites slugified paths with special characters", () => {
      expect(slugify("my folder/my folder.md")).toBe("my-folder/index");
    });
  });

  describe("interaction with simplifySlug (end-to-end canonicalization)", () => {
    it("folder/folder.md routes to canonical folder URL via simplifySlug", () => {
      expect(simplifySlug(slugify("characters/characters.md"))).toBe("characters/");
    });

    it("folder/index.md and folder/folder.md produce identical simplified URLs", () => {
      expect(simplifySlug(slugify("characters/characters.md"))).toBe(
        simplifySlug(slugify("characters/index.md")),
      );
    });

    it("top-level index.md simplifies to root", () => {
      expect(simplifySlug(slugify("index.md"))).toBe("/");
    });
  });

  describe("interaction with isFolderPath", () => {
    it("classifies folder/folder.md output as a folder path", () => {
      expect(isFolderPath(slugify("characters/characters.md"))).toBe(true);
    });

    it("classifies regular file as non-folder", () => {
      expect(isFolderPath(slugify("characters/alice.md"))).toBe(false);
    });
  });
});

describe("isFolderPath", () => {
  it("detects trailing slash", () => {
    expect(isFolderPath("folder/")).toBe(true);
  });

  it("detects index suffix", () => {
    expect(isFolderPath("folder/index")).toBe(true);
  });

  it("returns false for files", () => {
    expect(isFolderPath("file.md")).toBe(false);
  });
});

describe("getAllSegmentPrefixes", () => {
  it("returns all prefixes", () => {
    expect(getAllSegmentPrefixes("a/b/c")).toEqual(["a", "a/b", "a/b/c"]);
  });
});

describe("resolveBasePath", () => {
  it("prepends explicit basePath to slug", () => {
    expect(resolveBasePath("features/Callouts", "/repository")).toBe(
      "/repository/features/Callouts",
    );
  });

  it("prepends explicit basePath to slug with leading slash", () => {
    expect(resolveBasePath("/features/Callouts", "/repository")).toBe(
      "/repository/features/Callouts",
    );
  });

  it("returns just /slug when basePath is empty (root deployment)", () => {
    expect(resolveBasePath("features/Callouts", "")).toBe("/features/Callouts");
  });

  it("handles empty slug with basePath", () => {
    expect(resolveBasePath("", "/repository")).toBe("/repository/");
  });

  it("handles empty slug with empty basePath", () => {
    expect(resolveBasePath("", "")).toBe("/");
  });

  it("falls back to getBasePath() when no basePath argument (server-side returns empty)", () => {
    expect(resolveBasePath("page")).toBe("/page");
  });
});

describe("slugifyPath", () => {
  it("replaces spaces with hyphens", () => {
    expect(slugifyPath("Arcanist's Folly")).toBe("arcanist's-folly");
  });

  it("replaces ampersands with -and-", () => {
    expect(slugifyPath("Arts & Crafts")).toBe("arts--and--crafts");
  });

  it("replaces percent with -percent", () => {
    expect(slugifyPath("100%")).toBe("100-percent");
  });

  it("removes question marks and hash signs", () => {
    expect(slugifyPath("What?#Section")).toBe("whatsection");
  });

  it("handles multi-segment paths", () => {
    expect(slugifyPath("Compendium/Species/Ratkin/Deific Exaltation")).toBe(
      "compendium/species/ratkin/deific-exaltation",
    );
  });

  it("strips trailing slashes", () => {
    expect(slugifyPath("folder/")).toBe("folder");
  });

  it("lowercases for case-insensitive matching (Obsidian parity)", () => {
    expect(slugifyPath("Compendium/Species/Dryad/Apple")).toBe("compendium/species/dryad/apple");
  });

  it('removes filesystem-illegal characters (< > : " | *)', () => {
    expect(slugifyPath("Alias with <illegal> chars")).toBe("alias-with-illegal-chars");
  });

  it("removes colons and pipes", () => {
    expect(slugifyPath("Title: Subtitle | Part")).toBe("title-subtitle--part");
  });

  it("removes asterisks and quotes", () => {
    expect(slugifyPath('What is "AI"*')).toBe("what-is-ai");
  });

  it("handles mixed illegal characters across path segments", () => {
    expect(slugifyPath("Guides/X-Men: First Class/Notes <draft>")).toBe(
      "guides/x-men-first-class/notes-draft",
    );
  });
});

describe("splitAnchor", () => {
  it("slugifies heading anchors", () => {
    const [fp, anchor] = splitAnchor("page#My Heading");
    expect(fp).toBe("page");
    expect(anchor).toBe("#my-heading");
  });

  it("strips ^ and lowercases block references", () => {
    const [fp, anchor] = splitAnchor("page#^MyBlock123");
    expect(fp).toBe("page");
    expect(anchor).toBe("#myblock123");
  });

  it("strips ^ and lowercases complex block reference IDs", () => {
    const [fp, anchor] = splitAnchor("page#^CB-A34B78B4ICqt6zX6xBDAh6CT-47-927-1034");
    expect(fp).toBe("page");
    expect(anchor).toBe("#cb-a34b78b4icqt6zx6xbdah6ct-47-927-1034");
  });

  it("returns empty anchor when no # present", () => {
    const [fp, anchor] = splitAnchor("page");
    expect(fp).toBe("page");
    expect(anchor).toBe("");
  });

  it("passes PDF anchors through unchanged", () => {
    const [fp, anchor] = splitAnchor("doc.pdf#page=5");
    expect(fp).toBe("doc.pdf");
    expect(anchor).toBe("#page=5");
  });
});

describe("transformInternalLink", () => {
  it("returns folder path for folder note convention (same-name parent)", () => {
    expect(transformInternalLink("characters/characters")).toBe("./characters/");
  });

  it("returns folder path for folder note with spaces", () => {
    expect(transformInternalLink("My Folder/My Folder")).toBe("./my-folder/");
  });

  it("returns folder path for deep folder note", () => {
    expect(transformInternalLink("a/b/c/d/d")).toBe("./a/b/c/d/");
  });

  it("preserves explicit trailing slash", () => {
    expect(transformInternalLink("tags/")).toBe("./tags/");
  });

  it("returns folder path for explicit index", () => {
    expect(transformInternalLink("content/index")).toBe("./content/");
  });

  it("does not add trailing slash for regular nested links", () => {
    expect(transformInternalLink("My Folder/My Note")).toBe("./my-folder/my-note");
  });

  it("handles spaces in nested paths", () => {
    expect(transformInternalLink("content/with spaces")).toBe("./content/with-spaces");
  });

  it("handles anchor on folder note link", () => {
    expect(transformInternalLink("My Folder/My Folder#heading")).toBe("./my-folder/#heading");
  });

  it("lowercases block reference anchor", () => {
    expect(transformInternalLink("Note#^MyBlock123")).toBe("./note#myblock123");
  });

  it("handles percent-encoded spaces", () => {
    expect(transformInternalLink("My%20Folder/My%20Note")).toBe("./my-folder/my-note");
  });

  it("handles simple single-segment link", () => {
    expect(transformInternalLink("My Note")).toBe("./my-note");
  });

  it("returns dot for empty input", () => {
    expect(transformInternalLink("")).toBe(".");
  });
});

describe("transformLink", () => {
  const allSlugs = [
    "a/b/c",
    "a/b/d",
    "a/b/index",
    "e/f",
    "e/g/h",
    "index",
    "a/test.png",
  ] as FullSlug[];

  describe("absolute", () => {
    const opts: TransformOptions = { strategy: "absolute", allSlugs };

    it("resolves from a/b/c", () => {
      const cur = "a/b/c" as FullSlug;
      expect(transformLink(cur, "a/b/d", opts)).toBe("../../a/b/d");
      expect(transformLink(cur, "a/b/index", opts)).toBe("../../a/b/");
      expect(transformLink(cur, "e/f", opts)).toBe("../../e/f");
      expect(transformLink(cur, "index", opts)).toBe("../../");
    });

    it("resolves from a/b/index (explicit index slug)", () => {
      const cur = "a/b/index" as FullSlug;
      expect(transformLink(cur, "a/b/d", opts)).toBe("../../a/b/d");
      expect(transformLink(cur, "a/b", opts)).toBe("../../a/b");
      expect(transformLink(cur, "index", opts)).toBe("../../");
    });

    it("resolves from a/b (folder page without /index suffix) same as a/b/index", () => {
      const cur = "a/b" as FullSlug;
      expect(transformLink(cur, "a/b/d", opts)).toBe("../../a/b/d");
      expect(transformLink(cur, "index", opts)).toBe("../../");
    });

    it("resolves from index", () => {
      const cur = "index" as FullSlug;
      expect(transformLink(cur, "index", opts)).toBe("./");
      expect(transformLink(cur, "a/b/c", opts)).toBe("./a/b/c");
      expect(transformLink(cur, "a/b/index", opts)).toBe("./a/b/");
    });
  });

  describe("shortest", () => {
    const opts: TransformOptions = { strategy: "shortest", allSlugs };

    it("resolves unique filenames from a/b/c", () => {
      const cur = "a/b/c" as FullSlug;
      expect(transformLink(cur, "d", opts)).toBe("../../a/b/d");
      expect(transformLink(cur, "h", opts)).toBe("../../e/g/h");
      expect(transformLink(cur, "index", opts)).toBe("../../");
    });

    it("resolves from a/b/index (explicit index slug)", () => {
      const cur = "a/b/index" as FullSlug;
      expect(transformLink(cur, "d", opts)).toBe("../../a/b/d");
      expect(transformLink(cur, "h", opts)).toBe("../../e/g/h");
      expect(transformLink(cur, "index", opts)).toBe("../../");
    });

    it("resolves from a/b (folder page without /index suffix) same as a/b/index", () => {
      const cur = "a/b" as FullSlug;
      expect(transformLink(cur, "d", opts)).toBe("../../a/b/d");
      expect(transformLink(cur, "h", opts)).toBe("../../e/g/h");
      expect(transformLink(cur, "index", opts)).toBe("../../");
    });

    it("resolves from index", () => {
      const cur = "index" as FullSlug;
      expect(transformLink(cur, "d", opts)).toBe("./a/b/d");
      expect(transformLink(cur, "h", opts)).toBe("./e/g/h");
      expect(transformLink(cur, "index", opts)).toBe("./");
    });
  });

  describe("multi-segment partial path (shortest)", () => {
    const multiSegSlugs = [
      "compendium/species/elf/wood",
      "compendium/species/elf/index",
      "compendium/species/elf/eladrin",
      "compendium/spells/index",
      "compendium/spells/bane",
      "campaigns/unnamed/people/index",
      "index",
    ] as FullSlug[];

    const opts: TransformOptions = { strategy: "shortest", allSlugs: multiSegSlugs };

    it("resolves multi-segment path species/elf/wood to unique match", () => {
      const cur = "campaigns/unnamed/people/index" as FullSlug;
      expect(transformLink(cur, "species/elf/wood", opts)).toBe(
        "../../../compendium/species/elf/wood",
      );
    });

    it("resolves multi-segment path species/elf/index to folder page", () => {
      const cur = "campaigns/unnamed/people/index" as FullSlug;
      expect(transformLink(cur, "species/elf/index", opts)).toBe(
        "../../../compendium/species/elf/",
      );
    });

    it("falls back to absolute when multi-segment path has no match", () => {
      const cur = "index" as FullSlug;
      expect(transformLink(cur, "species/elf/nosuchpage", opts)).toBe("./species/elf/nosuchpage");
    });

    it("resolves single-segment name that is unique", () => {
      const cur = "index" as FullSlug;
      expect(transformLink(cur, "bane", opts)).toBe("./compendium/spells/bane");
    });

    it("resolves exact full path as multi-segment match", () => {
      const cur = "index" as FullSlug;
      expect(transformLink(cur, "compendium/species/elf/eladrin", opts)).toBe(
        "./compendium/species/elf/eladrin",
      );
    });
  });

  describe("folder page bug regression", () => {
    const spellSlugs = [
      "compendium/spells/index",
      "compendium/spells/bane",
      "compendium/spells/absorb-elements",
      "compendium/species/elf/eladrin",
      "index",
    ] as FullSlug[];

    it("does not double the folder segment for absolute strategy", () => {
      const opts: TransformOptions = { strategy: "absolute", allSlugs: spellSlugs };
      const cur = "compendium/spells" as FullSlug;
      expect(transformLink(cur, "compendium/spells/bane", opts)).toBe(
        "../../compendium/spells/bane",
      );
      expect(transformLink(cur, "compendium/spells/absorb-elements", opts)).toBe(
        "../../compendium/spells/absorb-elements",
      );
    });

    it("does not double the folder segment for shortest strategy", () => {
      const opts: TransformOptions = { strategy: "shortest", allSlugs: spellSlugs };
      const cur = "compendium/spells" as FullSlug;
      expect(transformLink(cur, "bane", opts)).toBe("../../compendium/spells/bane");
      expect(transformLink(cur, "absorb-elements", opts)).toBe(
        "../../compendium/spells/absorb-elements",
      );
    });

    it("matches explicit index slug behavior", () => {
      const opts: TransformOptions = { strategy: "absolute", allSlugs: spellSlugs };
      const fromFolder = "compendium/spells" as FullSlug;
      const fromIndex = "compendium/spells/index" as FullSlug;
      expect(transformLink(fromFolder, "compendium/spells/bane", opts)).toBe(
        transformLink(fromIndex, "compendium/spells/bane", opts),
      );
    });

    it("does not affect non-folder pages", () => {
      const opts: TransformOptions = { strategy: "absolute", allSlugs: spellSlugs };
      const cur = "compendium/spells/bane" as FullSlug;
      expect(transformLink(cur, "compendium/spells/absorb-elements", opts)).toBe(
        "../../compendium/spells/absorb-elements",
      );
    });
  });
});

describe("normalizeHastElement", () => {
  const makeEl = (href: string, tagName = "a"): HastElement => ({
    type: "element",
    tagName,
    properties: { href },
    children: [{ type: "text", value: "link" }],
  });

  it("rebases a relative href when embedding deeper content into shallower context", () => {
    const el = makeEl("../layout#page-frames");
    const out = normalizeHastElement(
      el,
      "canvas.canvas" as FullSlug,
      "plugins/canvaspage" as FullSlug,
    );
    const href = out.properties!.href as string;
    expect(
      new URL(href, "https://example.com/canvas.canvas").pathname +
        new URL(href, "https://example.com/canvas.canvas").hash,
    ).toBe("/layout#page-frames");
  });

  it("rebases a relative href when embedding shallower content into deeper context", () => {
    const el = makeEl("./sibling");
    const out = normalizeHastElement(
      el,
      "features/canvas" as FullSlug,
      "canvas.canvas" as FullSlug,
    );
    const href = out.properties!.href as string;
    expect(new URL(href, "https://example.com/features/canvas").pathname).toBe("/sibling");
  });

  it("produces a href that resolves identically when curBase equals newBase", () => {
    const el = makeEl("./foo");
    const out = normalizeHastElement(el, "index" as FullSlug, "index" as FullSlug);
    const href = out.properties!.href as string;
    expect(new URL(href, "https://example.com/").pathname).toBe("/foo");
  });

  it("preserves anchor fragments", () => {
    const el = makeEl("../target#section-two");
    const out = normalizeHastElement(el, "a/b" as FullSlug, "a/b/c" as FullSlug);
    const href = out.properties!.href as string;
    const url = new URL(href, "https://example.com/a/b");
    expect(url.hash).toBe("#section-two");
  });

  it("passes absolute URLs through unchanged", () => {
    const el = makeEl("https://example.com/external");
    const out = normalizeHastElement(el, "index" as FullSlug, "other" as FullSlug);
    expect(out.properties!.href).toBe("https://example.com/external");
  });

  it("passes root-relative URLs through unchanged", () => {
    const el = makeEl("/absolute/path");
    const out = normalizeHastElement(el, "index" as FullSlug, "other" as FullSlug);
    expect(out.properties!.href).toBe("/absolute/path");
  });

  it("rebases src attributes as well as href", () => {
    const el: HastElement = {
      type: "element",
      tagName: "img",
      properties: { src: "../image.png" },
      children: [],
    };
    const out = normalizeHastElement(el, "index" as FullSlug, "deep/page" as FullSlug);
    const src = out.properties!.src as string;
    expect(new URL(src, "https://example.com/").pathname).toBe("/image.png");
  });

  it("leaves elements without href or src unchanged", () => {
    const el: HastElement = {
      type: "element",
      tagName: "p",
      properties: {},
      children: [{ type: "text", value: "plain text" }],
    };
    const out = normalizeHastElement(el, "a" as FullSlug, "b" as FullSlug);
    expect(out).toEqual(el);
  });

  it("recurses into children to rebase nested elements", () => {
    const el: HastElement = {
      type: "element",
      tagName: "p",
      properties: {},
      children: [
        { type: "text", value: "see " },
        {
          type: "element",
          tagName: "a",
          properties: { href: "../layout" },
          children: [{ type: "text", value: "layout" }],
        },
      ],
    };
    const out = normalizeHastElement(
      el,
      "canvas.canvas" as FullSlug,
      "plugins/canvaspage" as FullSlug,
    );
    const innerAnchor = out.children[1] as HastElement;
    const href = innerAnchor.properties!.href as string;
    expect(new URL(href, "https://example.com/canvas.canvas").pathname).toBe("/layout");
  });

  it("does not mutate the input element", () => {
    const el = makeEl("../layout");
    const originalHref = el.properties!.href;
    normalizeHastElement(el, "canvas.canvas" as FullSlug, "plugins/canvaspage" as FullSlug);
    expect(el.properties!.href).toBe(originalHref);
  });
});

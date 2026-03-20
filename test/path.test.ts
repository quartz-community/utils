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
  slugifyPath,
  transformLink,
} from "../src/path.js";
import type { FullSlug, TransformOptions } from "../src/path.js";

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
    expect(slugifyPath("Arcanist's Folly")).toBe("Arcanist's-Folly");
  });

  it("replaces ampersands with -and-", () => {
    expect(slugifyPath("Arts & Crafts")).toBe("Arts--and--Crafts");
  });

  it("replaces percent with -percent", () => {
    expect(slugifyPath("100%")).toBe("100-percent");
  });

  it("removes question marks and hash signs", () => {
    expect(slugifyPath("What?#Section")).toBe("WhatSection");
  });

  it("handles multi-segment paths", () => {
    expect(slugifyPath("Compendium/Species/Ratkin/Deific Exaltation")).toBe(
      "Compendium/Species/Ratkin/Deific-Exaltation",
    );
  });

  it("strips trailing slashes", () => {
    expect(slugifyPath("folder/")).toBe("folder");
  });

  it("leaves clean paths unchanged", () => {
    expect(slugifyPath("Compendium/Species/Dryad/Apple")).toBe("Compendium/Species/Dryad/Apple");
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

  describe("folder page bug regression", () => {
    const spellSlugs = [
      "Compendium/Spells/index",
      "Compendium/Spells/Bane",
      "Compendium/Spells/Absorb-Elements",
      "Compendium/Species/Elf/Eladrin",
      "index",
    ] as FullSlug[];

    it("does not double the folder segment for absolute strategy", () => {
      const opts: TransformOptions = { strategy: "absolute", allSlugs: spellSlugs };
      const cur = "Compendium/Spells" as FullSlug;
      expect(transformLink(cur, "Compendium/Spells/Bane", opts)).toBe(
        "../../Compendium/Spells/Bane",
      );
      expect(transformLink(cur, "Compendium/Spells/Absorb-Elements", opts)).toBe(
        "../../Compendium/Spells/Absorb-Elements",
      );
    });

    it("does not double the folder segment for shortest strategy", () => {
      const opts: TransformOptions = { strategy: "shortest", allSlugs: spellSlugs };
      const cur = "Compendium/Spells" as FullSlug;
      expect(transformLink(cur, "Bane", opts)).toBe("../../Compendium/Spells/Bane");
      expect(transformLink(cur, "Absorb-Elements", opts)).toBe(
        "../../Compendium/Spells/Absorb-Elements",
      );
    });

    it("matches explicit index slug behavior", () => {
      const opts: TransformOptions = { strategy: "absolute", allSlugs: spellSlugs };
      const fromFolder = "Compendium/Spells" as FullSlug;
      const fromIndex = "Compendium/Spells/index" as FullSlug;
      expect(transformLink(fromFolder, "Compendium/Spells/Bane", opts)).toBe(
        transformLink(fromIndex, "Compendium/Spells/Bane", opts),
      );
    });

    it("does not affect non-folder pages", () => {
      const opts: TransformOptions = { strategy: "absolute", allSlugs: spellSlugs };
      const cur = "Compendium/Spells/Bane" as FullSlug;
      expect(transformLink(cur, "Compendium/Spells/Absorb-Elements", opts)).toBe(
        "../../Compendium/Spells/Absorb-Elements",
      );
    });
  });
});

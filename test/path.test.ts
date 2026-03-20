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
} from "../src/path.js";

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

import type { QuartzPluginData } from "@quartz-community/types";
import type { Root } from "hast";
import type { VNode } from "preact";
import { describe, expect, it } from "vitest";
import { formatDate } from "../src/date.js";
import { getIconCode } from "../src/emoji.js";
import { htmlToJsx } from "../src/jsx.js";
import { capitalize, classNames } from "../src/lang.js";
import { byDateAndAlphabetical, getDate } from "../src/sort.js";

function page(title: string | undefined, date?: string): QuartzPluginData {
  return {
    frontmatter: title === undefined ? {} : { title },
    ...(date ? { defaultDateType: "created", dates: { created: new Date(date) } } : {}),
  } as unknown as QuartzPluginData;
}

describe("getDate", () => {
  it("returns the date of the configured default type", () => {
    const d = new Date("2024-03-01");
    const data = {
      defaultDateType: "modified",
      dates: { created: new Date("2020-01-01"), modified: d },
    } as unknown as QuartzPluginData;
    expect(getDate(data)).toBe(d);
  });

  it("is undefined without a default date type or dates", () => {
    expect(getDate({ dates: { created: new Date() } } as unknown as QuartzPluginData)).toBe(
      undefined,
    );
    expect(getDate({ defaultDateType: "created" } as unknown as QuartzPluginData)).toBe(undefined);
  });
});

describe("byDateAndAlphabetical", () => {
  const sort = byDateAndAlphabetical();
  const titles = (pages: QuartzPluginData[]) =>
    pages.map((p) => (p.frontmatter as { title?: string }).title);

  it("puts newer pages first, dated pages before undated ones, then titles A-Z ignoring case", () => {
    const pages = [
      page("b undated"),
      page("a old", "2020-01-01"),
      page("A undated"),
      page("z new", "2024-01-01"),
      page("c undated"),
    ];
    expect(titles([...pages].sort(sort))).toEqual([
      "z new",
      "a old",
      "A undated",
      "b undated",
      "c undated",
    ]);
    expect(titles([...pages].reverse().sort(sort))).toEqual([
      "z new",
      "a old",
      "A undated",
      "b undated",
      "c undated",
    ]);
  });

  it("sorts an untitled page as an empty title", () => {
    expect(titles([page("a"), page(undefined)].sort(sort))).toEqual([undefined, "a"]);
  });
});

describe("getIconCode", () => {
  it("gives the code points of an emoji, as twemoji file names spell them", () => {
    expect(getIconCode("👍")).toBe("1f44d");
    expect(getIconCode("a")).toBe("61");
  });

  it("drops the variation selector, except in ZWJ sequences", () => {
    expect(getIconCode("❤️")).toBe("2764");
    expect(getIconCode("🏳️‍🌈")).toBe("1f3f3-fe0f-200d-1f308");
    expect(getIconCode("👨‍💻")).toBe("1f468-200d-1f4bb");
  });

  it("combines surrogate pairs at both ends of the high-surrogate range", () => {
    expect(getIconCode("\u{10000}")).toBe("10000");
    expect(getIconCode("\u{10FFFF}")).toBe("10ffff");
  });
});

describe("formatDate", () => {
  it("formats as a short month, two-digit day and year", () => {
    expect(formatDate(new Date(2024, 0, 5))).toBe("Jan 05, 2024");
    expect(formatDate(new Date(2024, 0, 5), "en-GB")).toBe("05 Jan 2024");
  });
});

describe("lang", () => {
  it("capitalize upper-cases only the first character", () => {
    expect(capitalize("hello world")).toBe("Hello world");
    expect(capitalize("")).toBe("");
  });

  it("classNames joins the truthy class names", () => {
    expect(classNames("a", undefined, null, false, "", "b")).toBe("a b");
    expect(classNames()).toBe("");
  });
});

describe("htmlToJsx", () => {
  type Props = { children?: unknown; [k: string]: unknown };
  // Expands components by calling them, which is all these trees need (no hooks, no DOM).
  function flatten(node: unknown): VNode<Props>[] {
    if (Array.isArray(node)) return node.flatMap(flatten);
    if (!node || typeof node !== "object") return [];
    const v = node as VNode<Props>;
    // A component (the built-in overrides are components): flatten what it renders
    if (typeof v.type === "function") return flatten((v.type as (p: Props) => unknown)(v.props));
    return [v, ...flatten(v.props?.children)];
  }
  const tree = (children: Root["children"]): Root => ({ type: "root", children });

  it("wraps tables in a scrollable container", () => {
    const nodes = flatten(
      htmlToJsx(
        tree([
          { type: "element", tagName: "table", properties: { className: ["t"] }, children: [] },
        ]),
      ),
    );
    const div = nodes.find((n) => n.type === "div");
    expect(div?.props.class).toBe("table-container");
    const table = flatten(div!.props.children).find((n) => n.type === "table");
    expect(table?.props.class).toBe("t");
  });

  it("renders <style> and <script> bodies unescaped", () => {
    const css = 'a[href^="x"] > b { content: "&"; }';
    const js = 'if (a < b && c) alert("x")';
    const nodes = flatten(
      htmlToJsx(
        tree([
          {
            type: "element",
            tagName: "style",
            properties: {},
            children: [{ type: "text", value: css }],
          },
          {
            type: "element",
            tagName: "script",
            properties: { type: "module" },
            children: [{ type: "text", value: js }],
          },
        ]),
      ),
    );
    const style = nodes.find((n) => n.type === "style")!;
    const script = nodes.find((n) => n.type === "script")!;
    expect(style.props.dangerouslySetInnerHTML).toEqual({ __html: css });
    expect(style.props.children).toBeUndefined();
    expect(script.props.dangerouslySetInnerHTML).toEqual({ __html: js });
    expect(script.props.type).toBe("module");
  });

  it("joins a style body split over several text nodes", () => {
    const nodes = flatten(
      htmlToJsx(
        tree([
          {
            type: "element",
            tagName: "style",
            properties: {},
            children: [
              { type: "text", value: "a { color: red; }" },
              { type: "text", value: " b > i {}" },
            ],
          },
        ]),
      ),
    );
    const style = nodes.find((n) => n.type === "style")!;
    expect(style.props.dangerouslySetInnerHTML).toEqual({ __html: "a { color: red; } b > i {}" });
  });

  it("lets callers override the built-in components", () => {
    const nodes = flatten(
      htmlToJsx(tree([{ type: "element", tagName: "table", properties: {}, children: [] }]), {
        table: () => "custom" as unknown as VNode,
      }),
    );
    expect(nodes.some((n) => n.type === "div")).toBe(false);
  });
});

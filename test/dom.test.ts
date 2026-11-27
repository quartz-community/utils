import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeRelativeURLs, registerEscapeHandler, removeAllChildren } from "../src/dom.js";

// The tests run in Node, without a DOM: these fakes carry just what the helpers touch.

type Listener = (e: unknown) => void;

class FakeTarget {
  listeners = new Map<string, Set<Listener>>();
  addEventListener(type: string, fn: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
  }
  removeEventListener(type: string, fn: Listener) {
    this.listeners.get(type)?.delete(fn);
  }
  dispatch(type: string, e: unknown) {
    for (const fn of this.listeners.get(type) ?? []) fn(e);
  }
  count(type: string) {
    return this.listeners.get(type)?.size ?? 0;
  }
}

class FakeContainer extends FakeTarget {
  classes = new Set<string>();
  classList = { contains: (c: string) => this.classes.has(c) };
}

function fakeEvent(props: Record<string, unknown>) {
  return {
    ...props,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("removeAllChildren", () => {
  it("removes every child", () => {
    const children = ["a", "b", "c"];
    const el = {
      get firstChild() {
        return children[0] ?? null;
      },
      removeChild(c: string) {
        children.splice(children.indexOf(c), 1);
      },
    };
    removeAllChildren(el as unknown as HTMLElement);
    expect(children).toEqual([]);
  });
});

describe("registerEscapeHandler", () => {
  function setup() {
    const doc = new FakeTarget();
    vi.stubGlobal("document", doc);
    const container = new FakeContainer();
    const onEscape = vi.fn();
    const cleanup = registerEscapeHandler(container as unknown as HTMLElement, onEscape);
    return { doc, container, onEscape, cleanup };
  }

  it("calls onEscape for Escape and for a click on the backdrop while active", () => {
    const { doc, container, onEscape } = setup();
    container.classes.add("active");

    const key = fakeEvent({ key: "Escape" });
    doc.dispatch("keydown", key);
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(key.defaultPrevented).toBe(true);

    const click = fakeEvent({ target: container });
    container.dispatch("click", click);
    expect(onEscape).toHaveBeenCalledTimes(2);
    expect(click.defaultPrevented).toBe(true);
    expect(click.propagationStopped).toBe(true);
  });

  it("ignores other keys, clicks inside the panel, and everything while inactive", () => {
    const { doc, container, onEscape } = setup();
    container.classes.add("active");
    doc.dispatch("keydown", fakeEvent({ key: "Enter" }));
    const inside = fakeEvent({ target: {} });
    container.dispatch("click", inside);
    expect(onEscape).not.toHaveBeenCalled();
    expect(inside.defaultPrevented).toBe(false);

    container.classes.delete("active");
    const key = fakeEvent({ key: "Escape" });
    doc.dispatch("keydown", key);
    container.dispatch("click", fakeEvent({ target: container }));
    expect(onEscape).not.toHaveBeenCalled();
    expect(key.defaultPrevented).toBe(false);
  });

  it("the returned cleanup removes both listeners", () => {
    const { doc, container, cleanup } = setup();
    expect(doc.count("keydown")).toBe(1);
    expect(container.count("click")).toBe(1);
    cleanup();
    expect(doc.count("keydown")).toBe(0);
    expect(container.count("click")).toBe(0);
  });

  it("does nothing without a container", () => {
    const doc = new FakeTarget();
    vi.stubGlobal("document", doc);
    const cleanup = registerEscapeHandler(null, () => {});
    expect(doc.count("keydown")).toBe(0);
    expect(() => cleanup()).not.toThrow();
  });
});

describe("normalizeRelativeURLs", () => {
  function el(attrs: Record<string, string>) {
    return {
      attrs: { ...attrs },
      hasAttribute(n: string) {
        return n in this.attrs;
      },
      getAttribute(n: string) {
        return this.attrs[n as keyof typeof this.attrs] ?? null;
      },
      setAttribute(n: string, v: string) {
        (this.attrs as Record<string, string>)[n] = v;
      },
    };
  }

  it("makes relative href/src absolute against the page URL and leaves the rest alone", () => {
    const base = "https://example.com/notes/page";
    const kept = [
      "http://other.test/x",
      "https://other.test/x",
      "mailto:a@example.com",
      "tel:123",
      "#heading",
      "/root/path",
      "data:image/png;base64,AA==",
    ];
    const els = [
      el({ href: "./sibling" }),
      el({ href: "../up" }),
      el({ src: "image.png" }),
      ...kept.map((href) => el({ href })),
      el({ href: "" }),
    ];
    const doc = { querySelectorAll: () => els };
    normalizeRelativeURLs(doc as unknown as Document, base);
    expect(els[0]!.attrs.href).toBe("https://example.com/notes/sibling");
    expect(els[1]!.attrs.href).toBe("https://example.com/up");
    expect((els[2]!.attrs as Record<string, string>).src).toBe(
      "https://example.com/notes/image.png",
    );
    expect(els.slice(3, 3 + kept.length).map((e) => e.attrs.href)).toEqual(kept);
    expect(els.at(-1)!.attrs.href).toBe("");
  });

  it("leaves URLs alone when the base is not a URL", () => {
    const e = el({ href: "./sibling" });
    normalizeRelativeURLs({ querySelectorAll: () => [e] } as unknown as Document, "not a url");
    expect(e.attrs.href).toBe("./sibling");
  });
});

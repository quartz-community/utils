import { describe, it, expect } from "vitest";
import { escapeHTML, unescapeHTML } from "../src/escape";

describe("escapeHTML", () => {
  it("escapes the five special characters", () => {
    expect(escapeHTML(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#039;Jerry&#039;&lt;/a&gt;",
    );
  });
});

describe("unescapeHTML", () => {
  it("unescapes the five entities", () => {
    expect(unescapeHTML("&lt;div class=&quot;a&quot;&gt;&amp;&#039;&lt;/div&gt;")).toBe(
      `<div class="a">&'</div>`,
    );
  });

  it("decodes each entity only once", () => {
    expect(unescapeHTML("&amp;lt;br&amp;gt;")).toBe("&lt;br&gt;");
    expect(unescapeHTML("&amp;amp;")).toBe("&amp;");
    expect(unescapeHTML("&amp;quot;&amp;#039;")).toBe("&quot;&#039;");
  });

  it.each(["a &lt; b", "Tom &amp; Jerry &quot;x&quot;", "<b>&gt;</b>", "&#039;", "&&amp;;"])(
    "round-trips %j through escapeHTML",
    (text) => {
      expect(unescapeHTML(escapeHTML(text))).toBe(text);
    },
  );
});

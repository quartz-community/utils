import type { Components, Jsx } from "hast-util-to-jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { Root, Node } from "hast";
import { Fragment, jsx, jsxs } from "preact/jsx-runtime";
import { h } from "preact";

/**
 * Extract text content from JSX children.
 *
 * `toJsxRuntime` passes the inner text of `<style>` / `<script>` elements as
 * the `children` prop.  This helper normalises the various shapes it can take
 * (string, array of strings, or other) into a single string so we can feed it
 * to `dangerouslySetInnerHTML`.
 */
function childrenToString(children: unknown): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(childrenToString).join("");
  return String(children ?? "");
}

/**
 * Default component overrides applied by {@link htmlToJsx}.
 *
 * - **table** – wrapped in a scrollable `<div class="table-container">`
 * - **style** / **script** – rendered with `dangerouslySetInnerHTML` so that
 *   special characters (`"`, `&`, etc.) are *not* HTML-escaped by preact.
 */
const builtinComponents: Components = {
  table: (props) => (
    <div class="table-container">
      <table {...props} />
    </div>
  ),
  style: ({ children, ...rest }) =>
    h("style", { ...rest, dangerouslySetInnerHTML: { __html: childrenToString(children) } }),
  script: ({ children, ...rest }) =>
    h("script", { ...rest, dangerouslySetInnerHTML: { __html: childrenToString(children) } }),
};

/**
 * Convert a HAST tree to Preact JSX, with sensible defaults for Quartz plugins.
 *
 * This is the canonical way for pageType body components (and any other code
 * that renders a HAST tree to JSX) to produce output that is safe for
 * `preact-render-to-string`.  It applies built-in component overrides for
 * `<table>`, `<style>`, and `<script>` elements, preventing the common
 * pitfall where inline CSS / JS gets HTML-escaped.
 *
 * @param tree        The HAST root (or node) to render.
 * @param components  Optional additional component overrides.  These are
 *                    merged with (and override) the built-in defaults.
 * @returns           A Preact JSX element ready for `render()`.
 */
export function htmlToJsx(tree: Node, components?: Partial<Components>) {
  return toJsxRuntime(tree as Root, {
    Fragment,
    jsx: jsx as Jsx,
    jsxs: jsxs as Jsx,
    elementAttributeNameCase: "html",
    components: { ...builtinComponents, ...components },
  });
}

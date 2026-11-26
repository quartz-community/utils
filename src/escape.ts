/**
 * HTML escape utilities for safe string rendering.
 */

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * @param unsafe - The string to escape
 * @returns The escaped string safe for HTML rendering
 *
 * @example
 * escapeHTML('<script>alert("xss")</script>') // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHTML(unsafe: string): string {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Unescapes HTML entities back to their original characters.
 * @param html - The HTML-escaped string
 * @returns The unescaped string
 *
 * @example
 * unescapeHTML('&lt;div&gt;') // '<div>'
 */
export function unescapeHTML(html: string): string {
  // One pass, so "&amp;lt;" becomes "&lt;" and is not decoded again to "<".
  return html.replace(/&(?:amp|lt|gt|quot|#039);/g, (entity) => HTML_ENTITIES[entity]!);
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
};
